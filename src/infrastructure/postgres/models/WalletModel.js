const BaseModel = require("./BaseModel");

class WalletModel extends BaseModel {
  static get tableName() {
    return "wallets";
  }

  static get idColumn() {
    return "id";
  }

  static get relationMappings() {
    const WalletTransactionModel = require("./WalletTransactionModel");

    return {
      transactions: {
        relation: BaseModel.HasManyRelation,
        modelClass: WalletTransactionModel,
        join: {
          from: "wallets.user_id",
          to: "wallet_transactions.user_id",
        },
      },
    };
  }
}

module.exports = WalletModel;
