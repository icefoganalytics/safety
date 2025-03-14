import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.createTable("hazard_logs", function (table) {
    table.increments("id").primary().notNullable();
    table.integer("hazard_id").notNullable();
    table.integer("old_hazard_type_id").notNullable();
    table.string("old_description", 4000).nullable();
    table.string("old_location_code", 8).nullable();
    table.string("old_location_detail", 8).nullable();
    table.string("old_department_code", 8).nullable();
    table.string("old_scope_code", 8).nullable();
    table.string("old_sensitivity_code", 8).nullable();
    table.string("old_status_code", 8).nullable();
    table.integer("old_reopen_count").nullable();
    table.integer("new_hazard_type_id").nullable();
    table.string("new_description", 4000).nullable();
    table.string("new_location_code", 8).nullable();
    table.string("new_location_detail", 8).nullable();
    table.string("new_department_code", 8).nullable();
    table.string("new_scope_code", 8).nullable();
    table.string("new_sensitivity_code", 8).nullable();
    table.string("new_status_code", 8).nullable();
    table.integer("new_reopen_count").nullable();
    table.integer("changer_user_id").nullable();
    table.integer("changer_role_id").nullable();
    table.specificType("changed_date", "TIMESTAMP(0) WITH TIME ZONE").notNullable();
    table.string("log_title", 200).notNullable();
    table.string("log_comment", 4000).nullable();
    table.string("user_action", 8).notNullable();

    table.foreign("hazard_id").references("hazards.id");
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.dropTable("hazard_logs");
}
