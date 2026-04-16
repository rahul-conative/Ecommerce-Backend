const express = require("express");
const { WalletController } = require("../controllers/wallet.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");
const { asyncHandler } = require("../../../shared/middleware/async-handler");

const walletRoutes = express.Router();
const walletController = new WalletController();

walletRoutes.get(
  "/me",
  authenticate,
  authorizeCapability(CAPABILITIES.WALLET_SELF),
  asyncHandler(walletController.getMyWallet),
);

module.exports = { walletRoutes };
