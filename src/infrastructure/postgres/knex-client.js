const Knex = require("knex");
const { env } = require("../../config/env");

const knex = Knex({
  client: "pg",
  connection: env.postgresUrl,
  pool: {
    min: 2,
    max: 10,
  },
  useNullAsDefault: true,
});

module.exports = { knex };
