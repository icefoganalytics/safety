import express, { Request, Response } from "express";
import { isArray, isEmpty } from "lodash";

import { db as knex } from "../data";
import { DepartmentService, DirectoryService, EmailService, IncidentService } from "../services";
import {
  Action,
  ActionStatuses,
  ActionTypes,
  Hazard,
  HazardStatuses,
  Incident,
  IncidentAttachment,
  IncidentHazard,
  IncidentHazardTypes,
  IncidentStatuses,
  IncidentStep,
  Scopes,
  SensitivityLevels,
  Urgencies,
  UserRole,
} from "../data/models";
import { InsertableDate } from "../utils/formatters";
import { DateTime } from "luxon";

export const reportRouter = express.Router();
const db = new IncidentService();
const emailService = new EmailService();
const directoryService = new DirectoryService();

reportRouter.get("/my-reports", async (req: Request, res: Response) => {
  const list = await db.getByReportingEmail(req.user.email);
  return res.json({ data: list });
});

reportRouter.get("/my-supervisor-reports", async (req: Request, res: Response) => {
  const list = await db.getBySupervisorEmail(req.user.email);
  return res.json({ data: list });
});

reportRouter.get("/role/:role", async (req: Request, res: Response) => {
  const { role } = req.params;

  const match = req.user.roles.find((r: UserRole) => r.name == role);
  if (!match) return res.json({ data: [] });

  const list = await db.getAll();
  res.json({ data: list });
});

reportRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await db.getById(id);

  if (!data) return res.status(404).send();

  return res.json({ data });
});

reportRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, investigation_notes, additional_description } = req.body;

  await knex("incidents").where({ id }).update({ description, investigation_notes, additional_description });

  return res.json({ data: {}, messages: [{ variant: "success", text: "Incident Saved" }] });
});

reportRouter.post("/:id/investigation", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { investigation_data } = req.body;

  investigation_data.completed_on = new Date().toISOString();
  investigation_data.completed_by = req.user.display_name;
  investigation_data.completed_by_ud = req.user.id;
  const jsonString = JSON.stringify(investigation_data);

  await knex("investigations").insert({ incident_id: id, investigation_data: jsonString });

  return res.json({ data: {}, messages: [{ variant: "success", text: "Incident Saved" }] });
});

reportRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const trx = await knex.transaction();

  try {
    await trx("actions").where({ incident_id: id }).delete();
    await trx("incident_hazards").where({ incident_id: id }).delete();
    await trx("incident_attachments").where({ incident_id: id }).delete();
    await trx("incident_steps").where({ incident_id: id }).delete();
    await trx("incidents").where({ id }).delete();
    trx.commit();
    return res.json({ data: {}, messages: [{ variant: "success", text: "Incident Removed" }] });
  } catch (error) {
    console.log("ERROR IN TRANSACTION", error);
    trx.rollback();
    return res.json({ data: {}, messages: [{ variant: "error", text: "Error Removing Incident" }] });
  }
});

reportRouter.post("/", async (req: Request, res: Response) => {
  const {} = req.body;
  req.body.email = req.user.email;
  req.body.status = "Initial Report";

  let {
    date,
    eventType,
    description,
    location_code,
    location_detail,
    supervisor_email,
    supervisor_alt_email,
    on_behalf,
    on_behalf_email,
    urgency,
  } = req.body;

  const reporting_person_email = on_behalf == "Yes" ? on_behalf_email : req.user.email;

  const defaultHazardType = await knex("hazard_types").orderBy("id").select("id").first();
  const defaultIncidentType = await knex("incident_types").where({ name: eventType }).select("id").first();
  const department = await new DepartmentService().determineDepartment(
    reporting_person_email,
    supervisor_email,
    location_code
  );

  await directoryService.connect();
  const directorySubmitter = await directoryService.searchByEmail(reporting_person_email);
  const directorySupervisor = await directoryService.searchByEmail(supervisor_email);

  const employeeName =
    directorySubmitter && directorySubmitter[0] ? directorySubmitter[0].display_name : reporting_person_email;

  const trx = await knex.transaction();

  try {
    const hazard = {
      hazard_type_id: defaultHazardType.id,
      location_code,
      department_code: department.code,
      scope_code: Scopes.DEFAULT.code,
      status_code: HazardStatuses.OPEN.code,
      sensitivity_code: SensitivityLevels.NOT_SENSITIVE.code,
      description,
      location_detail,
      reopen_count: 0,
      created_at: InsertableDate(DateTime.utc().toISO()),
      reported_at: InsertableDate(date),
      urgency_code: urgency,
    } as Hazard;

    const incident = {
      created_at: InsertableDate(DateTime.utc().toISO()),
      reported_at: InsertableDate(date),
      description,
      department_code: department.code,
      status_code: IncidentStatuses.OPEN.code,
      sensitivity_code: SensitivityLevels.NOT_SENSITIVE.code,
      supervisor_email,
      supervisor_alt_email,
      incident_type_id: defaultIncidentType.id,
      reporting_person_email,
      proxy_user_id: req.user.id,
      urgency_code: urgency,
    } as Incident;

    const insertedIncidents = await trx("incidents").insert(incident).returning("*");
    const insertedHazards = await trx("hazards").insert(hazard).returning("*");

    let insertedIncidentId = insertedIncidents[0].id;
    let insertedHazardId = insertedHazards[0].id;

    const link = {
      hazard_id: insertedHazardId,
      incident_id: insertedIncidentId,
      priority_order: 1,
      incident_hazard_type_code: IncidentHazardTypes.CONTRIBUTING_FACTOR.code,
    } as IncidentHazard;

    await trx("incident_hazards").insert(link);

    let steps = new Array<string>();

    if (eventType == "hazard") {
      steps = ["Hazard Identified", "Assessment of Hazard", "Control the Hazard", "Employee Notification"];
    } else {
      steps = ["Incident Reported", "Investigation", "Control Plan", "Controls Implemented", "Employee Notification"];
    }

    for (let i = 1; i <= steps.length; i++) {
      const step_title = steps[i - 1];

      const step = {
        incident_id: insertedIncidentId,
        step_title,
        order: i,
        activate_date: i == i ? new Date() : null,
      } as IncidentStep;

      if (i == 1) {
        (step as any).complete_date = InsertableDate(DateTime.utc().toISO());
        step.complete_name = req.user.display_name;
        step.complete_user_id = req.user.id;
      }

      await trx("incident_steps").insert(step);
    }

    if (req.files && req.files.files) {
      let files = req.files.files;

      if (!isArray(files)) files = [files];

      for (const file of files) {
        let attachment = {
          incident_id: insertedIncidentId,
          added_by_email: req.user.email,
          file_name: file.name,
          file_type: file.mimetype,
          file_size: file.size,
          file: file.data,
          added_date: InsertableDate(DateTime.utc().toISO()),
        } as IncidentAttachment;

        await trx("incident_attachments").insert(attachment);
      }
    }

    if (directorySubmitter && directorySubmitter.length > 0) {
      await emailService.sendIncidentEmployeeNotification(
        { fullName: directorySubmitter[0].display_name, email: reporting_person_email },
        employeeName,
        insertedIncidents[0]
      );

      if (req.user.email != reporting_person_email) {
        await emailService.sendIncidentReporterNotification(
          { fullName: req.user.display_name, email: req.user.email },
          employeeName,
          insertedIncidents[0]
        );
      }
    }

    if (directorySupervisor && directorySupervisor.length > 0) {
      await emailService.sendIncidentSupervisorNotification(
        { fullName: directorySupervisor[0].display_name, email: supervisor_email },
        employeeName,
        insertedIncidents[0]
      );
    }

    await trx.commit();
    return res.status(200).json({ data: {} });
  } catch (error) {
    trx.rollback();
    console.log("ERROR IN TRANSACTION", error);
  }

  return res.status(400).json({ data: {} });
});

reportRouter.put("/:id/step/:step_id/:operation", async (req: Request, res: Response) => {
  const { id, step_id, operation } = req.params;

  const step = await knex("incident_steps").where({ incident_id: id, id: step_id }).first();

  if (step) {
    if (operation == "complete") {
      await knex("incident_steps")
        .where({ incident_id: id, id: step_id })
        .update({
          complete_name: req.user.display_name,
          complete_date: InsertableDate(DateTime.utc().toISO()),
          complete_user_id: req.user.id,
        });
    } else if (operation == "revert") {
      await knex("incident_steps").where({ incident_id: id, id: step_id }).update({
        complete_name: null,
        complete_date: null,
        complete_user_id: null,
      });

      if (step.step_title == "Investigation") {
        await knex("actions").where({ incident_id: id }).delete();
        await knex("investigations").where({ incident_id: id }).delete();
      }
    }
  }

  const allSteps = await knex("incident_steps").where({ incident_id: id });
  let allComplete = true;

  for (const step of allSteps) {
    if (!step.complete_date) allComplete = false;
  }

  if (allComplete) {
    await knex("incidents").where({ id }).update({ status_code: IncidentStatuses.CLOSED.code });
  } else {
    await knex("incidents").where({ id }).update({ status_code: IncidentStatuses.IN_PROGRESS.code });
  }

  return res.json({ data: {} });
});

reportRouter.post("/:id/action", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, notes, actor_user_email, actor_user_id, actor_display_name, actor_role_type_id, due_date } =
    req.body;

  const action = {
    incident_id: parseInt(id),
    created_at: InsertableDate(DateTime.utc().toISO()),
    description,
    notes,
    action_type_code: ActionTypes.USER_GENERATED.code,
    sensitivity_code: SensitivityLevels.NOT_SENSITIVE.code,
    status_code: ActionStatuses.OPEN.code,
    actor_user_email,
    actor_user_id,
    actor_role_type_id,
    due_date: InsertableDate(due_date),
  } as Action;

  await knex("actions").insert(action);

  if (actor_user_email) {
    await emailService.sendTaskAssignmentNotification(
      { fullName: actor_display_name, email: actor_user_email },
      action
    );
  }

  return res.json({ data: {}, messages: [{ variant: "success", text: "Task Saved" }] });
});

reportRouter.put("/:id/action/:action_id", async (req: Request, res: Response) => {
  const { id, action_id } = req.params;
  const { description, notes, actor_user_email, actor_role_type_id, due_date, status_code } = req.body;
  let { actor_user_id } = req.body;

  const action = await knex("actions").where({ incident_id: id, id: action_id }).first();
  if (!action) return res.status(404).send();

  if (!isEmpty(actor_user_email)) {
    const actorUser = await knex("users").where({ email: actor_user_email }).first();
    if (actorUser) actor_user_id = actorUser.id;
  }

  await knex("actions")
    .where({ id: action_id })
    .update({
      description,
      notes,
      actor_user_email,
      actor_user_id,
      actor_role_type_id,
      due_date: InsertableDate(due_date),
      status_code,
    });

  return res.json({ data: {} });
});

reportRouter.delete("/:id/action/:action_id", async (req: Request, res: Response) => {
  const { id, action_id } = req.params;

  await knex("actions").where({ incident_id: id, id: action_id }).delete();

  return res.json({ data: {} });
});

reportRouter.delete("/:id/action/:action_id", async (req: Request, res: Response) => {
  const { id, action_id } = req.params;

  await knex("actions").where({ incident_id: id, id: action_id }).delete();

  return res.json({ data: {} });
});

reportRouter.put("/:id/action/:action_id/:operation", async (req: Request, res: Response) => {
  const { id, action_id, operation } = req.params;

  if (operation == "complete") {
    await knex("actions")
      .where({ incident_id: id, id: action_id })
      .update({
        complete_date: InsertableDate(DateTime.utc().toISO()),
        complete_name: req.user.display_name,
        complete_user_id: req.user.id,
      });
  } else if (operation == "revert") {
    await knex("actions").where({ incident_id: id, id: action_id }).update({
      complete_date: null,
      complete_name: null,
      complete_user_id: null,
    });
  }

  return res.json({ data: {} });
});
