const { successResponse } = require("../../../shared/http/response");
const { TaxService } = require("../services/tax.service");

class TaxController {
  constructor({ taxService = new TaxService() } = {}) {
    this.taxService = taxService;
  }

  generateOrderInvoice = async (req, res) => {
    const invoice = await this.taxService.generateInvoice(req.params.orderId);
    res.status(201).json(successResponse(invoice));
  };

  getReport = async (req, res) => {
    const report = await this.taxService.getTaxReport(req.query);
    res.json(successResponse(report));
  };
}

module.exports = { TaxController };

