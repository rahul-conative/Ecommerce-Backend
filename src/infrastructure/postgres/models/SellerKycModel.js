const BaseModel = require("./BaseModel");

class SellerKycModel extends BaseModel {
  static get tableName() {
    return "seller_kyc";
  }

  static get idColumn() {
    return "id";
  }
}

module.exports = SellerKycModel;
