const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    items: [
      {
        productId: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    wishlist: [{ type: String }],
  },
  { timestamps: true },
);

const CartModel = mongoose.model("Cart", cartSchema);

module.exports = { CartModel };
