import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.createTable("role_logs", function (table) {
    table.increments("id").primary().notNullable();
    table.integer("user_roles_id").notNullable();
    table.string("old_name", 256).nullable();
    table.string("old_department_code", 8).nullable();
    table.string("old_location_code", 8).nullable();
    table.integer("old_role_type_id").nullable();
    table.integer("old_user_id").nullable();
    table.specificType("old_start_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.specificType("old_end_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.string("new_name", 256).nullable();
    table.string("new_department_code", 8).nullable();
    table.string("new_location_code", 8).nullable();
    table.integer("new_role_type_id").nullable();
    table.integer("new_user_id").nullable();
    table.specificType("new_start_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.specificType("new_end_date", "TIMESTAMP(0) WITH TIME ZONE").nullable();
    table.integer("changer_user_id").nullable();
    table.integer("changer_role_id").nullable();
    table.specificType("changed_date", "TIMESTAMP(0) WITH TIME ZONE").notNullable();
    table.string("log_title", 200).notNullable();
    table.string("log_comment", 4000).nullable();
    table.string("user_action", 8).notNullable();

    table.foreign("user_roles_id").references("user_roles.id");
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.dropTable("role_logs");
}
