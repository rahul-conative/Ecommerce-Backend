const slugify = require("slugify");
const { buildPagination } = require("../../../shared/lib/pagination");
const { ProductRepository } = require("../repositories/product.repository");
const { elasticsearchClient } = require("../../../shared/search/elasticsearch-client");
const { getOrSetCache } = require("../../../shared/lib/cache");
const { AppError } = require("../../../shared/errors/app-error");

class ProductService {
  constructor({ productRepository = new ProductRepository() } = {}) {
    this.productRepository = productRepository;
  }

  async createProduct(payload, actor) {
    const product = await this.productRepository.create({
      ...payload,
      sellerId: actor.userId,
      slug: slugify(`${payload.title}-${Date.now()}`, { lower: true, strict: true }),
    });

    await elasticsearchClient.index({
      index: "products",
      document: {
        id: product.id,
        title: product.title,
        category: product.category,
        price: product.price,
      },
    });

    return product;
  }

  async listProducts(query) {
    const pagination = buildPagination(query);
    const filter = {};

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status) {
      filter.status = query.status;
    }

    return getOrSetCache(`products:${JSON.stringify({ filter, pagination })}`, 60, () =>
      this.productRepository.paginate(filter, pagination),
    );
  }

  async getProduct(productId) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  async searchProducts(query) {
    const response = await elasticsearchClient.search({
      index: "products",
      query: {
        multi_match: {
          query: query.q,
          fields: ["title^3", "category", "description"],
        },
      },
    });

    return response.hits.hits.map((item) => item._source);
  }
}

module.exports = { ProductService };
