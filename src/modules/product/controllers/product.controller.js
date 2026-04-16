const { successResponse } = require("../../../shared/http/response");
const { ProductService } = require("../services/product.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class ProductController {
  constructor({ productService = new ProductService() } = {}) {
    this.productService = productService;
  }

  create = async (req, res) => {
    const actor = requireActor(req);
    const product = await this.productService.createProduct(req.body, actor);
    res.status(201).json(successResponse(product));
  };

  list = async (req, res) => {
    const result = await this.productService.listProducts(req.query);
    res.json(successResponse(result.items, { total: result.total }));
  };

  getOne = async (req, res) => {
    const product = await this.productService.getProduct(req.params.productId);
    res.json(successResponse(product));
  };

  search = async (req, res) => {
    const products = await this.productService.searchProducts(req.query);
    res.json(successResponse(products));
  };
}

module.exports = { ProductController };
