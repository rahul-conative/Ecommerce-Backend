# Advanced DB Architecture and Operations

## 1) Databases Used

### MongoDB (Document + high-write domains)
- `users`: identity, roles, seller storefront profile/settings, auth sessions.
- `products`: catalog with moderation workflow and rich attributes.
- `carts`: customer cart + wishlist.
- `notifications`, `analytics`, `coupons`, `inventoryreservations`, `referrals`.

### PostgreSQL (ACID + financial/compliance domains)
- Core commerce: `orders`, `order_items`, `payments`, `wallets`, `wallet_transactions`, `outbox_events`.
- Compliance and finance (advanced): `tax_invoices`, `tax_ledger_entries`, `vendor_payouts`, `gst_filings`, `admin_action_logs`.
- KYC: `seller_kyc`, `user_kyc`.

## 2) Connection Strategy

### Existing runtime connections
- Mongo: `src/infrastructure/mongo/mongo-client.js`
- PostgreSQL (`pg`): `src/infrastructure/postgres/postgres-client.js`
- App bootstrap: `src/app/create-app.js`

### Sequelize (PostgreSQL advanced schema management)
- Client: `src/infrastructure/sequelize/sequelize-client.js`
- Models: `src/infrastructure/sequelize/models/index.js`
- Migrations: `sequelize/migrations/*.js`
- Migration runner: `scripts/db/run-sequelize-migrations.js`

Note:
- Runtime repositories can continue using `pg` queries for performance/control.
- Sequelize is used for schema governance (migrations), model-level consistency, and future extraction readiness.

## 3) MongoDB ↔ PostgreSQL Cross-DB Relationships

- `users._id` (Mongo) ↔ `orders.buyer_id`, `payments.buyer_id`, `wallets.user_id`, `seller_kyc.seller_id`, `vendor_payouts.seller_id`.
- `products._id` (Mongo) ↔ `order_items.product_id`.
- `orders.id` (Postgres UUID) ↔ `inventoryreservations.orderId` (Mongo string), `tax_invoices.order_id`, `tax_ledger_entries.order_id`.
- `tax_invoices.id` ↔ `tax_ledger_entries.invoice_id`.

## 4) Tax and GST Design

### Tax flow
1. Pricing computes tax breakup (`cgst`, `sgst`, `igst`) from order context.
2. Admin/Tax API generates invoice per order (`tax_invoices`).
3. Ledger entries created in `tax_ledger_entries` for CGST/SGST/IGST/TCS.
4. Filing summaries use ledger aggregation for GSTR-ready reporting.

### Tables
- `tax_invoices`: immutable invoice snapshot per order.
- `tax_ledger_entries`: normalized tax movement records.
- `gst_filings`: filing period snapshots for compliance operations.

## 5) Payout Design

- `vendor_payouts` supports scheduled/processing/paid/failed states.
- Supports gross, commissions, processing fees, tax withholding, net payout.
- Aligns with split-payment and settlement lifecycle.

## 6) Admin Control Plane Data

- Vendor state and onboarding in Mongo (`users.sellerProfile`, `users.sellerSettings`).
- Admin financial control and logs in Postgres (`vendor_payouts`, `admin_action_logs`).
- Product moderation workflow in Mongo (`products.status`, `products.moderation.*`).

## 7) Migrations and Seed Workflow

### Prerequisites
1. Start MongoDB and PostgreSQL.
2. Set `.env` values (`MONGO_URI`, `POSTGRES_URL`).
3. Install dependencies:
   - `npm install`

### Commands
1. Run migrations:
   - `npm run db:migrate`
2. Seed dev/test data:
   - `npm run db:seed`
3. One-shot setup:
   - `npm run db:setup`

## 8) Test Data Insertion Script

- Script: `scripts/db/seed-dev-data.js`
- Seeds:
  - Mongo: admin, seller, buyer, sample product, sample cart.
  - Postgres: sample order, order item, captured payment, wallet, payout.
- Designed to create missing records and avoid duplicate base records.

## 9) Recommended Next DB Enhancements

1. Add monthly partitioning for `payments`, `tax_ledger_entries`, `admin_action_logs`.
2. Add read-model materialized views for admin dashboards.
3. Add idempotency key table for payment and webhook handlers.
4. Add CDC/event streaming from outbox to analytics warehouse.
5. Add anonymization pipeline for DPDP compliance and right-to-erasure workflows.

