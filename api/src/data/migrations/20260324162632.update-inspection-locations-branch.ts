import * as knex from "knex";

export async function up(knex: knex.Knex) {
  await knex.schema.alterTable("inspection_locations", function (table) {
    table.string("location_code", 8).nullable();
    table.string("branch", 50).nullable();

    table.foreign("location_code").references("locations.code");
  });
}

export async function down(knex: knex.Knex) {
  await knex.schema.alterTable("inspection_locations", function (table) {
    table.dropForeign(["location_code"]);
    table.dropColumn("location_code");
    table.dropColumn("branch");
  });
}
