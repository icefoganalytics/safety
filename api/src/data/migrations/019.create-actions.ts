import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.createTable("actions", function (table) {
    table.increments("id").primary().notNullable();
    table.integer("hazard_id").nullable();
    table.integer("incident_id").nullable();
    table.integer("creator_user_id").nullable();
    table.integer("creator_role_type_id").nullable();
    table.integer("actor_user_id").nullable();
    table.string("actor_user_email", 250).nullable();
    table.integer("actor_role_type_id").nullable();
    table.specificType("created_at", "TIMESTAMP(0) WITH TIME ZONE").notNullable().defaultTo(knex.fn.now());
    table.specificType("modified_at", "TIMESTAMP(0) WITH TIME ZONE").nullable().defaultTo(knex.fn.now());
    table.specificType("due_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.string("description", 4000).notNullable();
    table.string("action_type_code", 8).notNullable();
    table.string("sensitivity_code", 8).nullable();
    table.string("status_code", 8).nullable();
    table.string("notes", 4000).nullable();
    table.specificType("complete_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.string("complete_name", 200).nullable();
    table.integer("complete_user_id").nullable();

    table.foreign("hazard_id").references("hazards.id");
    table.foreign("incident_id").references("incidents.id");
    table.foreign("creator_user_id").references("users.id");
    table.foreign("actor_user_id").references("users.id");
    table.foreign("creator_role_type_id").references("role_types.id");
    table.foreign("actor_role_type_id").references("role_types.id");
    table.foreign("action_type_code").references("action_types.code");
    table.foreign("sensitivity_code").references("sensitivities.code");
    table.foreign("status_code").references("action_statuses.code");
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.dropTable("actions");
}
