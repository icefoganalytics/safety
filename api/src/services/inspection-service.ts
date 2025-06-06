import { Incident } from "../data/models";
import { db } from "../data";
import { Knex } from "knex";
import { isArray } from "lodash";

export class InspectionService {
  async getAll(email: string, where: (query: Knex.QueryBuilder) => Knex.QueryBuilder): Promise<Incident[]> {
    return db<Incident>("incidents")
      .innerJoin("incident_types", "incident_types.id", "incidents.incident_type_id")
      .innerJoin("incident_statuses", "incident_statuses.code", "incidents.status_code")
      .innerJoin("departments", "departments.code", "incidents.department_code")
      .whereRaw(`"incidents"."id" IN (SELECT "incident_id" FROM "incident_users_view" WHERE "user_email" = ?)`, [email])
      .where("incident_types.name", "inspection")
      .modify(where)
      .select(
        "incidents.*",
        "incident_types.name as incident_type_name",
        "incident_types.description as incident_type_description",
        "incident_statuses.name as status_name",
        "departments.name as department_name"
      )
      .orderBy("incidents.created_at", "desc");
  }
  async getCount(email: string, where: (query: Knex.QueryBuilder) => Knex.QueryBuilder): Promise<{ count: number }> {
    return db<Incident>("incidents")
      .innerJoin("incident_types", "incident_types.id", "incidents.incident_type_id")
      .innerJoin("incident_statuses", "incident_statuses.code", "incidents.status_code")
      .innerJoin("departments", "departments.code", "incidents.department_code")
      .whereRaw(`"incidents"."id" IN (SELECT "incident_id" FROM "incident_users_view" WHERE "user_email" = ?)`, [email])
      .where("incident_types.name", "inspection")
      .modify(where)
      .count("* as count")
      .first();
  }

  async getBySlug(slug: string, email: string): Promise<Incident | undefined> {
    const item = await db("incidents").where({ slug }).first();
    if (!item) return undefined;
    return this.getById(item.id, email);
  }

  async getById(id: number | string, email: string): Promise<Incident | undefined> {
    const item = await db("incidents")
      .where("incidents.id", parseInt(`${id}`))
      .innerJoin("incident_types", "incident_types.id", "incidents.incident_type_id")
      .innerJoin("incident_statuses", "incident_statuses.code", "incidents.status_code")
      .innerJoin("departments", "departments.code", "incidents.department_code")
      .innerJoin("locations", "incidents.location_code", "locations.code")
      .leftOuterJoin("inspection_locations", "inspection_locations.id", "incidents.inspection_location_id")
      .whereRaw(`"incidents"."id" IN (SELECT "incident_id" FROM "incident_users_view" WHERE "user_email" = ?)`, [email])
      .where("incident_types.name", "inspection")
      .select<Incident>(
        "incidents.*",
        "incident_types.name as incident_type_name",
        "incident_types.description as incident_type_description",
        "incident_statuses.name as status_name",
        "departments.name as department_name",
        "locations.name as location_name",
        "inspection_locations.name as inspection_location_name"
      )
      .first();

    if (!item) return item;

    item.attachments = await db("incident_attachments")
      .where({ incident_id: item.id })
      .select("id", "incident_id", "added_by_email", "file_name", "file_type", "file_size", "added_date");

    item.actions = await db("actions").where({ incident_id: item.id }).orderBy("due_date").orderBy("id");
    item.access = await db("incident_users_view").where({ incident_id: item.id, user_email: email });

    item.hazards = await db("incident_hazards")
      .where({ incident_id: item.id })
      .innerJoin("incident_hazard_types", "incident_hazards.incident_hazard_type_code", "incident_hazard_types.code")
      .select("incident_hazards.*", "incident_hazard_types.name as incident_hazard_type_name");

    for (let hazard of item.hazards ?? []) {
      hazard.hazard = await db("hazards")
        .where({ "hazards.id": hazard.hazard_id })
        .innerJoin("hazard_types", "hazards.hazard_type_id", "hazard_types.id")
        .innerJoin("locations", "hazards.location_code", "locations.code")
        .select("hazards.*", "hazard_types.name as hazard_type_name", "locations.name as location_name")
        .first();
    }

    for (let action of item.actions) {
      if (action.actor_role_type_id) {
        action.actor_display_name = (
          await db("role_types").where({ id: action.actor_role_type_id }).first()
        ).description;
      } else if (action.actor_user_id) {
        action.actor_display_name = (await db("users").where({ id: action.actor_user_id }).first()).display_name;
      } else if (action.actor_user_email) {
        action.actor_display_name = action.actor_user_email;
      }

      action.categories = action.categories ?? [];
      if (!isArray(action.categories)) action.categories = action.categories.split(",").filter((c) => c);
    }

    return item;
  }

  async getByReportingEmail(email: string): Promise<Incident[]> {
    return db<Incident>("incidents")
      .where("incident_users_view.user_email", email)
      .where("incident_users_view.reason", "reporter")
      .where("incident_types.name", "inspection")
      .whereNotIn("status_code", ["Closed", "Dup", "NoAct"])
      .innerJoin("incident_users_view", "incidents.id", "incident_users_view.incident_id")
      .innerJoin("incident_types", "incident_types.id", "incidents.incident_type_id")
      .innerJoin("incident_statuses", "incident_statuses.code", "incidents.status_code")
      .innerJoin("departments", "departments.code", "incidents.department_code")
      .select(
        "incidents.*",
        "incident_types.name as incident_type_name",
        "incident_types.description as incident_type_description",
        "incident_statuses.name as status_name",
        "departments.name as department_name"
      );
  }

  async create(item: any): Promise<Incident[]> {
    return db("incidents").insert(item).returning("*");
  }

  async update(id: number, item: any): Promise<Incident> {
    return db("incidents").where({ id }).update(item);
  }
}
