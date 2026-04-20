const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    title: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, index: true },
    mrp: { type: Number, required: true },
    gstRate: { type: Number, required: true, default: 18 },
    currency: { type: String, default: "INR" },
    category: { type: String, required: true, index: true },
    attributes: { type: Object, default: {} },
    stock: { type: Number, required: true, default: 0 },
    reservedStock: { type: Number, required: true, default: 0 },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    status: { type: String, default: "draft", index: true },
    moderation: {
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: String },
      rejectionReason: { type: String },
      checklist: {
        titleVerified: { type: Boolean, default: false },
        categoryVerified: { type: Boolean, default: false },
        complianceVerified: { type: Boolean, default: false },
        mediaVerified: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
);

productSchema.index({ title: "text", description: "text", category: 1 });

const ProductModel = mongoose.model("Product", productSchema);

module.exports = { ProductModel };
