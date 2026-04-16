const { Client } = require("@elastic/elasticsearch");
const { env } = require("../../config/env");

const elasticsearchClient = new Client({
  node: env.elasticsearchNode,
});

module.exports = { elasticsearchClient };
