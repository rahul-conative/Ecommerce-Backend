const BaseModel = require("./BaseModel");

class OrderModel extends BaseModel {
  static get tableName() {
    return "orders";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    const OrderItemModel = require("./OrderItemModel");
    const PaymentModel = require("./PaymentModel");

    return {
      items: {
        relation: BaseModel.HasManyRelation,
        modelClass: OrderItemModel,
        join: {
          from: "orders.id",
          to: "order_items.order_id",
        },
      },
      payments: {
        relation: BaseModel.HasManyRelation,
        modelClass: PaymentModel,
        join: {
          from: "orders.id",
          to: "payments.order_id",
        },
      },
    };
  }
}

module.exports = OrderModel;
