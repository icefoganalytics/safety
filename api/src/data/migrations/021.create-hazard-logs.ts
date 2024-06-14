import * as knex from "knex";

export async function up(knex: knex.Knex) {
    await knex.schema.createTable("hazard_logs", function(table) {
        table.increments("id").primary().notNullable();
        table.integer("hazard_id").notNullable();
        table.integer("old_hazard_type_id").notNullable();
        table.string("old_description", 4096).nullable();
        table.string("old_location", 8).nullable();
        table.string("old_location_detail", 8).nullable();
        table.string("old_department", 8).nullable();
        table.string("old_scope", 8).nullable();
        table.string("old_sensitivity", 8).nullable();
        table.string("old_status", 8).nullable();
        table.integer("old_reopen_count").notNullable();
        table.integer("new_hazard_type_id").notNullable();
        table.string("new_description", 4096).nullable();
        table.string("new_location", 8).nullable();
        table.string("new_location_detail", 8).nullable();
        table.string("new_department", 8).nullable();
        table.string("new_scope", 8).nullable();
        table.string("new_sensitivity", 8).nullable();
        table.string("new_status", 8).nullable();
        table.integer("new_reopen_count").notNullable();
        table.string("changer_employee_id", 256).nullable();
        table.integer("changer_role_id").nullable();
        table.datetime("changed_date").notNullable();
        table.string("log_comment", 4096).notNullable();
        table.string("user_action", 8).notNullable();

        table.foreign("hazard_id").references("hazards.id");
        table.foreign("old_hazard_type_id").references("hazard_types.id");
        table.foreign("old_location").references("locations.code");
        table.foreign("old_department").references("departments.code");
        table.foreign("old_scope").references("scopes.code");
        table.foreign("old_sensitivity").references("sensitivities.code");
        table.foreign("old_status").references("hazard_statuses.code");
        table.foreign("new_hazard_type_id").references("hazard_types.id");
        table.foreign("new_location").references("locations.code");
        table.foreign("new_department").references("departments.code");
        table.foreign("new_scope").references("scopes.code");
        table.foreign("new_sensitivity").references("sensitivities.code");
        table.foreign("new_status").references("hazard_statuses.code");
        table.foreign("changer_role_id").references("roles.id");
    });
};

export async function down(knex: knex.Knex) {
    await knex.schema.dropTable("hazard_logs");
};
