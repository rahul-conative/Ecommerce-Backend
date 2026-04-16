const { successResponse } = require("../../../shared/http/response");
const { PaymentService } = require("../services/payment.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class PaymentController {
  constructor({ paymentService = new PaymentService() } = {}) {
    this.paymentService = paymentService;
  }

  initiate = async (req, res) => {
    const actor = requireActor(req);
    const payment = await this.paymentService.initiatePayment(req.body, actor);
    res.status(201).json(successResponse(payment));
  };

  verify = async (req, res) => {
    const actor = requireActor(req);
    const payment = await this.paymentService.verifyPayment(req.body, actor);
    res.json(successResponse(payment));
  };

  listMine = async (req, res) => {
    const actor = requireActor(req);
    const payments = await this.paymentService.listPayments(actor);
    res.json(successResponse(payments));
  };

  webhook = async (req, res) => {
    const result = await this.paymentService.handleWebhook(
      req.headers["x-razorpay-signature"],
      req.rawBody,
    );
    res.json(successResponse(result));
  };
}

module.exports = { PaymentController };
