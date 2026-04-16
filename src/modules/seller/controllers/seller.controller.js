const { successResponse } = require("../../../shared/http/response");
const { SellerService } = require("../services/seller.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class SellerController {
  constructor({ sellerService = new SellerService() } = {}) {
    this.sellerService = sellerService;
  }

  submitKyc = async (req, res) => {
    const actor = requireActor(req);
    const kyc = await this.sellerService.submitKyc(req.body, actor);
    res.status(201).json(successResponse(kyc));
  };

  reviewKyc = async (req, res) => {
    const actor = requireActor(req);
    const kyc = await this.sellerService.reviewKyc(req.params.sellerId, req.body, actor);
    res.json(successResponse(kyc));
  };
}

module.exports = { SellerController };
