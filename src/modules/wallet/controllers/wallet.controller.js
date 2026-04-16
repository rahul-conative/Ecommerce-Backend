const { successResponse } = require("../../../shared/http/response");
const { requireActor } = require("../../../shared/auth/actor-context");
const { WalletService } = require("../services/wallet.service");

class WalletController {
  constructor({ walletService = new WalletService() } = {}) {
    this.walletService = walletService;
  }

  getMyWallet = async (req, res) => {
    const actor = requireActor(req);
    const wallet = await this.walletService.getWalletSummary(actor.userId);
    res.json(successResponse(wallet));
  };
}

module.exports = { WalletController };
