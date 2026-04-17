const BaseModel = require("./BaseModel");

class WalletTransactionModel extends BaseModel {
  static get tableName() {
    return "wallet_transactions";
  }

  static get idColumn() {
    return "id";
  }
}

module.exports = WalletTransactionModel;
