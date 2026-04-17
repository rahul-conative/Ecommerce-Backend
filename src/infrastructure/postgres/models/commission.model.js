const { Model } = require("objection");

// ==============================
// Seller Commission
// ==============================
class SellerCommission extends Model {
  static get tableName() {
    return "seller_commissions";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "seller_id",
        "order_id",
        "order_item_id",
        "product_price",
        "commission_rate"
      ],
      properties: {
        id: { type: "string", format: "uuid" },

        seller_id: { type: "string", format: "uuid" },
        order_id: { type: "string", format: "uuid" },
        order_item_id: { type: "string", format: "uuid" },

        product_price: { type: "number", minimum: 0 },
        commission_rate: { type: "number", minimum: 0 },
        commission_amount: { type: "number", minimum: 0 },
        tax_amount: { type: "number", minimum: 0 },
        net_commission: { type: "number", minimum: 0 },

        status: {
          type: "string",
          enum: ["pending", "approved", "rejected", "paid"],
          default: "pending"
        },

        notes: { type: ["string", "null"], maxLength: 500 },

        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings() {
    return {
      seller: {
        relation: Model.BelongsToOneRelation,
        modelClass: require("../user/models/user.model"),
        join: {
          from: "seller_commissions.seller_id",
          to: "users.id"
        }
      },

      order: {
        relation: Model.BelongsToOneRelation,
        modelClass: require("../order/models/order.model"),
        join: {
          from: "seller_commissions.order_id",
          to: "orders.id"
        }
      }
    };
  }

  // Auto calculation hook
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();

    this.commission_amount =
      this.product_price * (this.commission_rate / 100);

    this.net_commission =
      this.commission_amount - (this.tax_amount || 0);
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

// ==============================
// Seller Payout
// ==============================
class SellerPayout extends Model {
  static get tableName() {
    return "seller_payouts";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: [
        "seller_id",
        "payout_period_start",
        "payout_period_end",
        "total_commissions",
        "net_payout"
      ],
      properties: {
        id: { type: "string", format: "uuid" },

        seller_id: { type: "string", format: "uuid" },

        payout_period_start: { type: "string", format: "date" },
        payout_period_end: { type: "string", format: "date" },

        total_commissions: { type: "number", minimum: 0 },
        total_tax: { type: "number", minimum: 0 },
        net_payout: { type: "number", minimum: 0 },

        status: {
          type: "string",
          enum: ["pending", "approved", "processing", "completed", "failed"],
          default: "pending"
        },

        payment_method: { type: ["string", "null"] },
        payment_date: { type: ["string", "null"], format: "date-time" },
        transaction_reference: { type: ["string", "null"] },

        notes: { type: ["string", "null"], maxLength: 500 },

        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings() {
    return {
      seller: {
        relation: Model.BelongsToOneRelation,
        modelClass: require("../user/models/user.model"),
        join: {
          from: "seller_payouts.seller_id",
          to: "users.id"
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

// ==============================
// Seller Settlement
// ==============================
class SellerSettlement extends Model {
  static get tableName() {
    return "seller_settlements";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["seller_id", "settlement_date", "net_amount"],
      properties: {
        id: { type: "string", format: "uuid" },

        seller_id: { type: "string", format: "uuid" },

        settlement_date: { type: "string", format: "date" },
        period_start: { type: ["string", "null"], format: "date" },
        period_end: { type: ["string", "null"], format: "date" },

        commission_commissions: { type: "number", minimum: 0 },
        commission_adjustments: { type: "number", minimum: 0 },
        chargebacks: { type: "number", minimum: 0 },
        platform_fees: { type: "number", minimum: 0 },

        net_amount: { type: "number", minimum: 0 },

        currency: { type: "string", default: "INR" },

        settlement_status: {
          type: "string",
          enum: ["pending", "issued", "completed", "contested"],
          default: "pending"
        },

        bank_name: { type: ["string", "null"] },
        bank_account_last4: { type: ["string", "null"], maxLength: 4 },

        notes: { type: ["string", "null"], maxLength: 500 },

        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" }
      }
    };
  }

  static get relationMappings() {
    return {
      seller: {
        relation: Model.BelongsToOneRelation,
        modelClass: require("../user/models/user.model"),
        join: {
          from: "seller_settlements.seller_id",
          to: "users.id"
        }
      }
    };
  }

  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

module.exports = {
  SellerCommission,
  SellerPayout,
  SellerSettlement
};