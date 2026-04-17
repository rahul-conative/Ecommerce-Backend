const BaseModel = require("./BaseModel");

class PaymentModel extends BaseModel {
  static get tableName() {
    return "payments";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    const OrderModel = require("./OrderModel");

    return {
      order: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: OrderModel,
        join: {
          from: "payments.order_id",
          to: "orders.id",
        },
      },
    };
  }
}

module.exports = PaymentModel;
