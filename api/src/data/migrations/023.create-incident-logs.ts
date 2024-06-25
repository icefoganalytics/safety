import * as knex from "knex";

export async function up(knex: knex.Knex) {
    await knex.schema.createTable("incident_logs", function(table) {
        table.increments("id").primary().notNullable();
        table.integer("incident_id").notNullable();
        table.string("old_description", 4000).notNullable();
        table.string("old_sensitivity_code", 256).nullable();
        table.string("old_supervisor", 8).nullable();
        table.datetime("old_created_date").notNullable();
        table.string("old_status_code", 8).nullable();
        table.integer("old_incident_type_id").nullable();
        table.string("new_description", 4000).notNullable();
        table.string("new_supervisor", 8).nullable();
        table.string("new_sensitivity_code", 8).nullable();
        table.datetime("new_created_date").notNullable();
        table.string("new_status_code", 8).nullable();
        table.integer("new_incident_type_id").nullable();
        table.integer("changer_user_id").nullable();
        table.integer("changer_role_id").nullable();
        table.datetime("changed_date").notNullable();
        table.string("log_comment", 4000).notNullable();
        table.string("user_action", 8).notNullable();

        table.foreign("incident_id").references("incidents.id");
    });
};

export async function down(knex: knex.Knex) {
    await knex.schema.dropTable("incident_logs");
};
