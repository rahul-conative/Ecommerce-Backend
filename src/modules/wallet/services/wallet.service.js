const { AppError } = require("../../../shared/errors/app-error");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { WalletRepository } = require("../repositories/wallet.repository");

class WalletService {
  constructor({ walletRepository = new WalletRepository() } = {}) {
    this.walletRepository = walletRepository;
  }

  async ensureWallet(userId) {
    return this.walletRepository.ensureWallet(userId);
  }

  async getWalletSummary(userId) {
    const wallet = await this.walletRepository.ensureWallet(userId);
    const transactions = await this.walletRepository.listTransactions(userId);
    return { wallet, transactions };
  }

  async credit(userId, amount, meta) {
    await this.walletRepository.creditWallet(userId, amount, meta);
    return this.walletRepository.findWalletByUserId(userId);
  }

  async hold(userId, amount, referenceId, metadata = {}) {
    if (!amount || amount <= 0) {
      return null;
    }

    try {
      await this.walletRepository.holdWalletAmount(userId, amount, referenceId, metadata);
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.WALLET_RESERVED_V1,
          { userId, amount, referenceId },
          { source: "wallet-module", aggregateId: userId },
        ),
      );
    } catch (error) {
      throw new AppError(error.message || "Unable to reserve wallet amount", 409);
    }
  }

  async capture(userId, referenceId) {
    const transaction = await this.walletRepository.captureHeldAmount(userId, referenceId);
    if (transaction) {
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.WALLET_CAPTURED_V1,
          { userId, amount: Number(transaction.amount), referenceId },
          { source: "wallet-module", aggregateId: userId },
        ),
      );
    }
    return transaction;
  }

  async release(userId, referenceId) {
    const transaction = await this.walletRepository.releaseHeldAmount(userId, referenceId);
    if (transaction) {
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.WALLET_RELEASED_V1,
          { userId, amount: Number(transaction.amount), referenceId },
          { source: "wallet-module", aggregateId: userId },
        ),
      );
    }
    return transaction;
  }
}

module.exports = { WalletService };
