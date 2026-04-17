const BaseModel = require("./BaseModel");

class UserKycModel extends BaseModel {
  static get tableName() {
    return "user_kyc";
  }

  static get idColumn() {
    return "id";
  }
}

module.exports = UserKycModel;
