const { CartModel } = require("../models/cart.model");

class CartRepository {
  async getByUserId(userId) {
    return CartModel.findOne({ userId });
  }

  async upsertCart(userId, payload) {
    return CartModel.findOneAndUpdate({ userId }, payload, { upsert: true, new: true });
  }
}

module.exports = { CartRepository };
