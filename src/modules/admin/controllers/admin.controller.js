const { successResponse } = require("../../../shared/http/response");
const { requireActor } = require("../../../shared/auth/actor-context");
const { AdminService } = require("../services/admin.service");

class AdminController {
  constructor({ adminService = new AdminService() } = {}) {
    this.adminService = adminService;
  }

  overview = async (req, res) => {
    const data = await this.adminService.getOverview();
    res.json(successResponse(data));
  };

  listVendors = async (req, res) => {
    const result = await this.adminService.listVendors(req.query);
    res.json(successResponse(result.items, { total: result.total }));
  };

  updateVendorStatus = async (req, res) => {
    const seller = await this.adminService.updateVendorStatus(req.params.sellerId, req.body);
    res.json(successResponse(seller));
  };

  moderationQueue = async (req, res) => {
    const result = await this.adminService.listProductModerationQueue(req.query);
    res.json(successResponse(result.items, { total: result.total }));
  };

  moderateProduct = async (req, res) => {
    const actor = requireActor(req);
    const product = await this.adminService.moderateProduct(req.params.productId, req.body, actor);
    res.json(successResponse(product));
  };

  listOrders = async (req, res) => {
    const items = await this.adminService.listOrders(req.query);
    res.json(successResponse(items));
  };

  listPayments = async (req, res) => {
    const items = await this.adminService.listPayments(req.query);
    res.json(successResponse(items));
  };

  createPayout = async (req, res) => {
    const payout = await this.adminService.createPayout(req.body);
    res.status(201).json(successResponse(payout));
  };

  listPayouts = async (req, res) => {
    const payouts = await this.adminService.listPayouts(req.query);
    res.json(successResponse(payouts));
  };

  taxReport = async (req, res) => {
    const report = await this.adminService.getTaxReport(req.query);
    res.json(successResponse(report));
  };

  generateInvoice = async (req, res) => {
    const invoice = await this.adminService.generateInvoice(req.params.orderId);
    res.status(201).json(successResponse(invoice));
  };
}

module.exports = { AdminController };

