const BaseModel = require("./BaseModel");

class OrderItemModel extends BaseModel {
  static get tableName() {
    return "order_items";
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
          from: "order_items.order_id",
          to: "orders.id",
        },
      },
    };
  }
}

module.exports = OrderItemModel;
