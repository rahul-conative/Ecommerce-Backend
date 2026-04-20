#!/usr/bin/env node
const { v4: uuidv4 } = require("uuid");
const { connectMongo } = require("../../src/infrastructure/mongo/mongo-client");
const { postgresPool } = require("../../src/infrastructure/postgres/postgres-client");
const { UserModel } = require("../../src/modules/user/models/user.model");
const { ProductModel } = require("../../src/modules/product/models/product.model");
const { CartModel } = require("../../src/modules/cart/models/cart.model");
const { hashValue } = require("../../src/shared/utils/hash");

async function seedMongo() {
  const adminEmail = "admin@demo.local";
  const sellerEmail = "seller@demo.local";
  const buyerEmail = "buyer@demo.local";

  const passwordHash = await hashValue("Password@123");

  const admin = await findOrCreateUser(adminEmail, {
    email: adminEmail,
    phone: "9999999999",
    passwordHash,
    role: "admin",
    accountStatus: "active",
    profile: { firstName: "Platform", lastName: "Admin" },
    referralCode: "ADMIN001",
  });

  const seller = await findOrCreateUser(sellerEmail, {
    email: sellerEmail,
    phone: "8888888888",
    passwordHash,
    role: "seller",
    accountStatus: "active",
    profile: { firstName: "Demo", lastName: "Seller" },
    referralCode: "SELLER01",
    sellerProfile: {
      displayName: "Demo Seller Store",
      legalBusinessName: "Demo Seller Pvt Ltd",
      supportEmail: sellerEmail,
      supportPhone: "8888888888",
      onboardingStatus: "ready_for_go_live",
    },
  });

  const buyer = await findOrCreateUser(buyerEmail, {
    email: buyerEmail,
    phone: "7777777777",
    passwordHash,
    role: "buyer",
    accountStatus: "active",
    profile: { firstName: "Demo", lastName: "Buyer" },
    referralCode: "BUYER001",
  });

  const product = await ProductModel.findOneAndUpdate(
    { slug: "demo-smartphone-5g-seeded" },
    {
      $setOnInsert: {
        sellerId: String(seller.id),
        title: "Demo Smartphone 5G",
        slug: "demo-smartphone-5g-seeded",
        description: "High-performance seeded smartphone for local development and QA testing.",
        price: 15999,
        mrp: 19999,
        gstRate: 18,
        currency: "INR",
        category: "electronics",
        attributes: { ram: "8GB", storage: "128GB" },
        stock: 120,
        reservedStock: 0,
        images: [],
        rating: 4.2,
        status: "active",
      },
    },
    { upsert: true, new: true },
  );

  await CartModel.findOneAndUpdate(
    { userId: String(buyer.id) },
    {
      userId: String(buyer.id),
      items: [{ productId: String(product.id), quantity: 1, price: Number(product.price) }],
      wishlist: [String(product.id)],
    },
    { upsert: true, new: true },
  );

  return { admin, seller, buyer, product };
}

async function findOrCreateUser(email, payload) {
  const existing = await UserModel.findOne({ email });
  if (existing) {
    return existing;
  }
  return UserModel.create(payload);
}

async function seedPostgres(context) {
  const orderId = uuidv4();
  const paymentId = uuidv4();
  const walletId = uuidv4();
  const payoutId = uuidv4();

  const existingOrder = await postgresPool.query("SELECT id FROM orders WHERE buyer_id = $1 LIMIT 1", [
    String(context.buyer.id),
  ]);

  if (!existingOrder.rows[0]) {
    await postgresPool.query(
      `INSERT INTO orders (
        id, buyer_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount,
        shipping_address, coupon_code, wallet_discount_amount, payable_amount, tax_breakup
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        orderId,
        String(context.buyer.id),
        "confirmed",
        "INR",
        15999,
        0,
        2879.82,
        18878.82,
        JSON.stringify({
          line1: "Seed Street 1",
          city: "Bengaluru",
          state: "Karnataka",
          postalCode: "560001",
        }),
        null,
        0,
        18878.82,
        JSON.stringify({
          taxableAmount: 15999,
          cgstAmount: 1439.91,
          sgstAmount: 1439.91,
          igstAmount: 0,
          totalTaxAmount: 2879.82,
          taxMode: "cgst_sgst",
        }),
      ],
    );

    await postgresPool.query(
      `INSERT INTO order_items (id, order_id, product_id, seller_id, quantity, unit_price, line_total)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [uuidv4(), orderId, String(context.product.id), String(context.seller.id), 1, 15999, 15999],
    );

    await postgresPool.query(
      `INSERT INTO payments (
        id, order_id, buyer_id, provider, status, amount, currency, transaction_reference,
        provider_order_id, provider_payment_id, verification_method, metadata, verified_at, failed_reason
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NULL
      )`,
      [
        paymentId,
        orderId,
        String(context.buyer.id),
        "razorpay",
        "captured",
        18878.82,
        "INR",
        `txn_${paymentId.slice(0, 8)}`,
        `order_${paymentId.slice(0, 8)}`,
        `pay_${paymentId.slice(0, 8)}`,
        "seed",
        JSON.stringify({ source: "seed-script" }),
      ],
    );

    await postgresPool.query(
      `INSERT INTO vendor_payouts (
        id, seller_id, period_start, period_end, gross_amount, commission_amount, processing_fee_amount,
        tax_withheld_amount, net_payout_amount, currency, status, scheduled_at, metadata
      ) VALUES (
        $1,$2,NOW() - INTERVAL '7 days',NOW(),$3,$4,$5,$6,$7,'INR','scheduled',NOW(),$8
      )`,
      [payoutId, String(context.seller.id), 15999, 1599.9, 120, 159.99, 14119.11, { source: "seed-script" }],
    );
  }

  const existingWallet = await postgresPool.query("SELECT id FROM wallets WHERE user_id = $1 LIMIT 1", [
    String(context.buyer.id),
  ]);
  if (!existingWallet.rows[0]) {
    await postgresPool.query(
      `INSERT INTO wallets (id, user_id, available_balance, locked_balance, created_at)
       VALUES ($1,$2,$3,$4,NOW())`,
      [walletId, String(context.buyer.id), 1000, 0],
    );
  }
}

async function main() {
  await connectMongo();
  const context = await seedMongo();
  await seedPostgres(context);
  process.stdout.write("Seeded development data for MongoDB + PostgreSQL\n");
}

main()
  .catch((error) => {
    process.stderr.write(`Seeding failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await postgresPool.end();
    process.exit();
  });
