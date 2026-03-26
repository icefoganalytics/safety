import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.alterTable("incidents", function (table) {
    table
      .specificType(
        "committee_review_request_date",
        "TIMESTAMP(0) WITH TIME ZONE",
      )
      .nullable();
    table
      .specificType(
        "committee_review_complete_date",
        "TIMESTAMP(0) WITH TIME ZONE",
      )
      .nullable();
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.alterTable("incidents", function (table) {
    table.dropColumn("committee_review_request_date");
    table.dropColumn("committee_review_complete_date");
  });
}
