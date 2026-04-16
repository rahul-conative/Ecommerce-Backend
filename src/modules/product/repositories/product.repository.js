const { ProductModel } = require("../models/product.model");

class ProductRepository {
  async create(payload) {
    return ProductModel.create(payload);
  }

  async paginate(filter, pagination) {
    const [items, total] = await Promise.all([
      ProductModel.find(filter).skip(pagination.skip).limit(pagination.limit).sort({ createdAt: -1 }),
      ProductModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findById(productId) {
    return ProductModel.findById(productId);
  }

  async findByIds(productIds) {
    return ProductModel.find({ _id: { $in: productIds } });
  }

  async reserveStock(productId, quantity) {
    return ProductModel.findOneAndUpdate(
      {
        _id: productId,
        $expr: {
          $gte: [{ $subtract: ["$stock", "$reservedStock"] }, quantity],
        },
      },
      {
        $inc: { reservedStock: quantity },
      },
      { new: true },
    );
  }

  async releaseReservedStock(productId, quantity) {
    return ProductModel.findOneAndUpdate(
      {
        _id: productId,
        reservedStock: { $gte: quantity },
      },
      {
        $inc: { reservedStock: -quantity },
      },
      { new: true },
    );
  }

  async commitReservedStock(productId, quantity) {
    return ProductModel.findOneAndUpdate(
      {
        _id: productId,
        reservedStock: { $gte: quantity },
        stock: { $gte: quantity },
      },
      {
        $inc: {
          reservedStock: -quantity,
          stock: -quantity,
        },
      },
      { new: true },
    );
  }

  async addStock(productId, quantity) {
    return ProductModel.findByIdAndUpdate(productId, { $inc: { stock: quantity } }, { new: true });
  }
}

module.exports = { ProductRepository };
