const { AppError } = require("../../../shared/errors/app-error");
const { AdminRepository } = require("../repositories/admin.repository");
const { ProductService } = require("../../product/services/product.service");
const { TaxService } = require("../../tax/services/tax.service");

class AdminService {
  constructor({
    adminRepository = new AdminRepository(),
    productService = new ProductService(),
    taxService = new TaxService(),
  } = {}) {
    this.adminRepository = adminRepository;
    this.productService = productService;
    this.taxService = taxService;
  }

  async getOverview() {
    return this.adminRepository.getOverviewStats();
  }

  async listVendors(query) {
    return this.adminRepository.listVendors(query);
  }

  async updateVendorStatus(sellerId, payload) {
    const seller = await this.adminRepository.updateVendorStatus(sellerId, payload);
    if (!seller) {
      throw new AppError("Seller not found", 404);
    }
    return seller;
  }

  async listProductModerationQueue(query) {
    return this.adminRepository.listProductsForModeration(query);
  }

  async moderateProduct(productId, payload, actor) {
    return this.productService.reviewProduct(productId, payload, actor);
  }

  async listOrders(query) {
    return this.adminRepository.listOrders({
      ...query,
      limit: Number(query.limit || 50),
      offset: Number(query.offset || 0),
    });
  }

  async listPayments(query) {
    return this.adminRepository.listPayments({
      ...query,
      limit: Number(query.limit || 50),
      offset: Number(query.offset || 0),
    });
  }

  async createPayout(payload) {
    const grossAmount = Number(payload.grossAmount);
    const commissionAmount = Number(payload.commissionAmount || 0);
    const processingFeeAmount = Number(payload.processingFeeAmount || 0);
    const taxWithheldAmount = Number(payload.taxWithheldAmount || 0);
    const netPayoutAmount = Number(
      payload.netPayoutAmount ??
        (grossAmount - commissionAmount - processingFeeAmount - taxWithheldAmount).toFixed(2),
    );

    return this.adminRepository.createPayout({
      ...payload,
      grossAmount,
      commissionAmount,
      processingFeeAmount,
      taxWithheldAmount,
      netPayoutAmount,
    });
  }

  async listPayouts(query) {
    return this.adminRepository.listPayouts({
      ...query,
      limit: Number(query.limit || 50),
      offset: Number(query.offset || 0),
    });
  }

  async getTaxReport(query) {
    return this.taxService.getTaxReport(query);
  }

  async generateInvoice(orderId) {
    return this.taxService.generateInvoice(orderId);
  }
}

module.exports = { AdminService };

