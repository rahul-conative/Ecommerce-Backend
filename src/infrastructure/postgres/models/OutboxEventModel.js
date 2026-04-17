const BaseModel = require("./BaseModel");

class OutboxEventModel extends BaseModel {
  static get tableName() {
    return "outbox_events";
  }

  static get idColumn() {
    return "id";
  }
}

module.exports = OutboxEventModel;
