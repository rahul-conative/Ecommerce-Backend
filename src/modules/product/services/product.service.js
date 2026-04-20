const slugify = require("slugify");
const { buildPagination } = require("../../../shared/lib/pagination");
const { ProductRepository } = require("../repositories/product.repository");
const { elasticsearchClient } = require("../../../shared/search/elasticsearch-client");
const { getOrSetCache } = require("../../../shared/lib/cache");
const { AppError } = require("../../../shared/errors/app-error");
const { PRODUCT_STATUS } = require("../../../shared/domain/commerce-constants");

class ProductService {
  constructor({ productRepository = new ProductRepository() } = {}) {
    this.productRepository = productRepository;
  }

  async createProduct(payload, actor) {
    const isSeller = actor.role === "seller";
    const status = isSeller ? PRODUCT_STATUS.PENDING_APPROVAL : payload.status || PRODUCT_STATUS.DRAFT;
    const product = await this.productRepository.create({
      ...payload,
      status,
      sellerId: actor.userId,
      slug: slugify(`${payload.title}-${Date.now()}`, { lower: true, strict: true }),
      moderation: {
        submittedAt: new Date(),
        checklist: payload.moderationChecklist || {
          titleVerified: false,
          categoryVerified: false,
          complianceVerified: false,
          mediaVerified: false,
        },
      },
    });

    if (product.status === PRODUCT_STATUS.ACTIVE) {
      await elasticsearchClient.index({
        index: "products",
        document: {
          id: product.id,
          title: product.title,
          category: product.category,
          price: product.price,
        },
      });
    }

    return product;
  }

  async listProducts(query) {
    const pagination = buildPagination(query);
    const filter = {};

    if (query.category) {
      filter.category = query.category;
    }

    filter.status = query.status || PRODUCT_STATUS.ACTIVE;

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

  async reviewProduct(productId, payload, actor) {
    const existingProduct = await this.productRepository.findById(productId);
    if (!existingProduct) {
      throw new AppError("Product not found", 404);
    }

    const nextStatus = payload.status;
    const updatedProduct = await this.productRepository.reviewProduct(productId, {
      status: nextStatus,
      moderation: {
        ...(existingProduct.moderation || {}),
        reviewedAt: new Date(),
        reviewedBy: actor.userId,
        rejectionReason: payload.rejectionReason || null,
        checklist: payload.checklist || existingProduct.moderation?.checklist || {},
      },
    });

    if (nextStatus === PRODUCT_STATUS.ACTIVE) {
      await elasticsearchClient.index({
        index: "products",
        id: String(updatedProduct.id),
        document: {
          id: updatedProduct.id,
          title: updatedProduct.title,
          category: updatedProduct.category,
          price: updatedProduct.price,
          description: updatedProduct.description,
        },
      });
    }

    if ([PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED].includes(nextStatus)) {
      try {
        await elasticsearchClient.delete({
          index: "products",
          id: String(existingProduct.id),
        });
      } catch (error) {
        if (error?.meta?.statusCode !== 404) {
          throw error;
        }
      }
    }

    return updatedProduct;
  }
}

module.exports = { ProductService };
