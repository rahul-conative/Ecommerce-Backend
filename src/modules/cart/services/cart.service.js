const { CartRepository } = require("../repositories/cart.repository");

class CartService {
  constructor({ cartRepository = new CartRepository() } = {}) {
    this.cartRepository = cartRepository;
  }

  async getCart(userId) {
    return this.cartRepository.getByUserId(userId);
  }

  async upsertCart(userId, payload) {
    return this.cartRepository.upsertCart(userId, {
      $set: {
        items: payload.items,
        wishlist: payload.wishlist || [],
      },
    });
  }
}

module.exports = { CartService };
