const { Model } = require("objection");

// ==============================
// Base Model (BEST PRACTICE)
// ==============================
class BaseModel extends Model {
  $beforeInsert() {
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}

// ==============================
// Fraud Detection
// ==============================
class FraudDetection extends BaseModel {
  static get tableName() {
    return "fraud_detections";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "user_id", "risk_score"],
      properties: {
        id: { type: "string", format: "uuid" },
        order_id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        risk_score: { type: "number", minimum: 0, maximum: 100 },
        risk_level: {
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          default: "low",
        },
        indicators: { type: "object" },
        payment_method: { type: "string" },
        card_last4: { type: "string", minLength: 4, maxLength: 4 },
        card_country: { type: "string" },
        previous_fraud_count: { type: "integer", default: 0 },
        review_status: {
          type: "string",
          enum: ["pending", "reviewed", "approved", "rejected"],
          default: "pending",
        },
        false_positive: { type: "boolean", default: false },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }
}

// ==============================
// Return (RMA)
// ==============================
class Return extends BaseModel {
  static get tableName() {
    return "returns";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["order_id", "order_item_id", "user_id", "seller_id", "quantity", "reason"],
      properties: {
        id: { type: "string", format: "uuid" },
        order_id: { type: "string", format: "uuid" },
        order_item_id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        seller_id: { type: "string", format: "uuid" },
        quantity: { type: "integer", minimum: 1 },
        reason: { type: "string" },
        description: { type: "string" },
        status: {
          type: "string",
          enum: ["requested", "approved", "rejected", "shipped_back", "received", "refunded"],
          default: "requested",
        },
        refund_amount: { type: "number", default: 0 },
        refund_status: {
          type: "string",
          enum: ["pending", "approved", "processed", "completed"],
          default: "pending",
        },
        tracking_number: { type: "string" },
        returned_condition: { type: "string" },
        notes: { type: "string" },
        created_at: { type: "string", format: "date-time" },
        updated_at: { type: "string", format: "date-time" },
      },
    };
  }
}

// ==============================
// Loyalty Ledger
// ==============================
class LoyaltyLedger extends BaseModel {
  static get tableName() {
    return "loyalty_ledger";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "points", "transaction_type"],
      properties: {
        id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        points: { type: "integer" },
        transaction_type: {
          type: "string",
          enum: ["purchase", "bonus", "redemption", "expiry", "adjustment"],
        },
        reference_id: { type: "string", format: "uuid" },
        description: { type: "string" },
        expires_at: { type: "string", format: "date-time" },
        created_at: { type: "string", format: "date-time" },
      },
    };
  }
}

// ==============================
// User Activity Velocity
// ==============================
class UserActivityVelocity extends BaseModel {
  static get tableName() {
    return "user_activity_velocity";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "activity_type", "timestamp"],
      properties: {
        id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        activity_type: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
        metadata: { type: "object" },
        created_at: { type: "string", format: "date-time" },
      },
    };
  }
}

// ==============================
// Recommendation Events
// ==============================
class RecommendationEvent extends BaseModel {
  static get tableName() {
    return "recommendation_events";
  }

  static get idColumn() {
    return "id";
  }

  static get jsonSchema() {
    return {
      type: "object",
      required: ["user_id", "product_id", "event_type"],
      properties: {
        id: { type: "string", format: "uuid" },
        user_id: { type: "string", format: "uuid" },
        product_id: { type: "string", format: "uuid" },
        event_type: {
          type: "string",
          enum: ["viewed", "added_to_cart", "purchased", "returned"],
        },
        score: { type: "number", minimum: 0, maximum: 1, default: 0 },
        conversion: { type: "boolean", default: false },
        created_at: { type: "string", format: "date-time" },
      },
    };
  }
}

module.exports = {
  FraudDetection,
  Return,
  LoyaltyLedger,
  UserActivityVelocity,
  RecommendationEvent,
};