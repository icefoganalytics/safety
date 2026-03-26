import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.alterTable("incidents", function (table) {
    table.string("committee_supervisor_response", 500).nullable();
    table.string("committee_supervisor_rationale", 2000).nullable();
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.alterTable("incidents", function (table) {
    table.dropColumn("committee_supervisor_response");
    table.dropColumn("committee_supervisor_rationale");
  });
}
