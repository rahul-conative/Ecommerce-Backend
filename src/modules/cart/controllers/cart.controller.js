const { successResponse } = require("../../../shared/http/response");
const { CartService } = require("../services/cart.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class CartController {
  constructor({ cartService = new CartService() } = {}) {
    this.cartService = cartService;
  }

  getMyCart = async (req, res) => {
    const actor = requireActor(req);
    const cart = await this.cartService.getCart(actor.userId);
    res.json(successResponse(cart));
  };

  upsertMyCart = async (req, res) => {
    const actor = requireActor(req);
    const cart = await this.cartService.upsertCart(actor.userId, req.body);
    res.json(successResponse(cart));
  };
}

module.exports = { CartController };
