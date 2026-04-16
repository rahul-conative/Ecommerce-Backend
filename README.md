# Scalable E-commerce Backend

Production-grade modular monolith for a Flipkart/Amazon-style backend using Node.js, Express, MongoDB, PostgreSQL, Redis, BullMQ, and Elasticsearch.

## Architecture

- Modular monolith with microservice-ready boundaries.
- DDD-lite module shape for every domain:
  - `controllers`
  - `services`
  - `repositories`
  - `routes`
  - `validation`
  - `models`
- Multi-database strategy:
  - MongoDB: users, products, carts, notifications, analytics
  - PostgreSQL: orders, order items, payments, seller KYC
  - Redis: caching and queues
- Service-layer communication only. No module reaches into another module's database directly.

## Modules

- Auth: JWT access/refresh tokens, refresh session rotation, and Google/Firebase social login verification
- User: profile retrieval, updates, user KYC workflows, and referral identity
- Product: catalog management, Elasticsearch indexing, and reservation-aware stock fields
- Cart: cart and wishlist persistence
- Order: PostgreSQL-backed order creation with server-side pricing and lifecycle transitions
- Payment: Razorpay order creation, signature verification, and webhook handling
- Seller: seller onboarding plus KYC submission/review
- Notification: email/SMS/push-ready notification persistence and queueing
- Analytics: event capture and aggregation-ready event log
- Inventory: reservation, release, commit, and restock flows
- Pricing: coupon engine and centralized total calculation
- Wallet: balance ledger, held credits, capture/release flow, and referral rewards

## Shared Platform Capabilities

- Express middleware for security, rate limiting, validation, auth, and errors
- Auth-specific rate limiting and security event logging for sign-in/refresh flows
- Redis-backed BullMQ queue factory
- Cloudinary-based abstract storage layer
- Nodemailer mailer abstraction
- In-memory event bus abstraction for easy migration to Kafka later
- Versioned domain event contracts in `src/contracts/events`
- PostgreSQL outbox pattern for transactional modules like orders and payments
- Socket.IO realtime updates for order, payment, notification, and KYC state changes
- Domain event log persistence for traceable business events
- Inventory reservations to reduce overselling during checkout/payment windows
- Coupon management and server-owned order total calculation
- Wallet ledger for stored credits and hybrid wallet+gateway checkout
- Referral rewards for referrer and referee onboarding incentives
- GST tax breakup support for CGST/SGST vs IGST calculation
- Cron registration for order cleanup, payment retries, and analytics aggregation
- Pino logging and request logging
- Mongo-backed audit log capture for API requests

## Run Locally

1. Copy `.env.example` to `.env`
2. Install dependencies:

```bash
npm install
```

3. Start infrastructure:

```bash
docker-compose up -d mongo postgres redis elasticsearch mailhog
```

4. Start the app:

```bash
npm run dev
```

## API Surface

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/social`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/products`
- `GET /api/v1/products/:productId`
- `GET /api/v1/products/search?q=iphone`
- `POST /api/v1/products`
- `GET /api/v1/carts/me`
- `PUT /api/v1/carts/me`
- `GET /api/v1/orders/me`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/:orderId/status`
- `GET /api/v1/payments/me`
- `POST /api/v1/payments/initiate`
- `POST /api/v1/payments/verify`
- `POST /api/v1/payments/webhooks/razorpay`
- `GET /api/v1/pricing/coupons`
- `POST /api/v1/pricing/coupons`
- `GET /api/v1/wallets/me`
- `POST /api/v1/sellers/kyc`
- `PATCH /api/v1/sellers/:sellerId/kyc/review`
- `POST /api/v1/users/me/kyc`
- `PATCH /api/v1/users/:userId/kyc/review`
- `GET /api/v1/notifications/me`
- `POST /api/v1/notifications`
- `GET /api/v1/analytics`
- `POST /api/v1/analytics/events`

## Migration Strategy

- Replace each module route group with an API gateway route when extracting services.
- Swap module-internal service invocations for async events or HTTP/gRPC contracts.
- Move the in-memory event bus to Kafka without changing controller contracts.
- Keep event names stable and versioned through `src/contracts/events`.
- Let PostgreSQL-backed modules publish through the outbox first, then replace the outbox consumer with a broker publisher.
- Split workers into standalone processes first, then extract the owning module.
- Preserve repository interfaces so data-layer rewrites stay inside the module.

## Social Login Notes

- Web clients should obtain a Google ID token from Google Sign-In and send it to `POST /api/v1/auth/social`.
- Mobile apps can send either a Google ID token or a Firebase ID token after authenticating with Firebase Auth.
- The backend verifies the identity token itself; clients are never trusted based on profile payload alone.
- Configure `GOOGLE_CLIENT_IDS` with all approved web/android/iOS client IDs.
- Configure Firebase server credentials with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

## Security Notes

- No backend is "unhackable"; the goal is layered defense and rapid detection.
- Refresh tokens are rotated and stored as hashed sessions instead of raw token strings.
- Auth endpoints are rate-limited.
- Security-sensitive auth events are stored in MongoDB for investigation and alerting.

## Razorpay Notes

- `POST /api/v1/payments/initiate` creates a provider order and returns checkout metadata for the client.
- `POST /api/v1/payments/verify` verifies the payment signature server-side after checkout success.
- `POST /api/v1/payments/webhooks/razorpay` handles trusted gateway webhooks for captured or failed payments.
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` before enabling the gateway.

## KYC Notes

- Seller KYC supports PAN, GST, Aadhaar, and document URLs with review states.
- User KYC supports PAN and Aadhaar for regulated payment/identity flows when needed.
- Admin review routes allow moving KYC records through `under_review`, `verified`, or `rejected`.
- This project stores KYC workflows and documents metadata; it does not yet call external government verification APIs.

## Realtime Notes

- Socket.IO is attached to the main server and authenticates with the access token.
- Connected users automatically join `user:<id>` and `role:<role>` rooms.
- Clients can subscribe to an order room using `join:order`.
- Current live events include:
  - `order:created`
  - `order:status`
  - `payment:initiated`
  - `payment:verified`
  - `payment:failed`
  - `payment:update`
  - `notification:new`
  - `kyc:submitted`
  - `kyc:status`
  - `admin:kyc:update`

## Commerce Logic Notes

- Orders no longer trust client-provided totals; pricing is calculated on the server from product data.
- Coupons are validated centrally and usage is tracked.
- Inventory is reserved when an order is created, committed on successful payment, and released on payment failure.
- Returns can restock previously committed inventory.
- Wallet credits can be held against an order and either captured on success or released on failure/cancel.
- Referral codes can reward both the referrer and the new user through wallet credits.
- Tax calculation now returns CGST/SGST for intra-state orders and IGST for inter-state orders based on `BUSINESS_STATE`.

## Scale Notes

- Add read replicas and partitioning for PostgreSQL payment/order workloads.
- Add Redis caching around hot product/category/search endpoints.
- Push search reads to Elasticsearch instead of MongoDB listing for large catalogs.
- Run app and workers independently behind autoscaling.
- Add distributed tracing and a central config service as the next enterprise step.
# Ecommerce-Backend
