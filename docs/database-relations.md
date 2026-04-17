# Database Relations

## MongoDB Collections

### `users`
- `referredByUserId` → references another `users._id` (self-referential referral link)
- `referralCode` → unique code used by `referrals.referralCode`

### `carts`
- `userId` → references `users._id`
- `items.productId` → references `products._id`
- `wishlist` → array of `products._id`

### `products`
- `sellerId` → references `users._id` for the seller account that owns the product

### `referrals`
- `referrerUserId` → references `users._id`
- `refereeUserId` → references `users._id`
- `referralCode` → references the same code stored in `users.referralCode`

### `inventoryreservations`
- `orderId` → references `orders.id` stored in PostgreSQL
- `buyerId` → references `users._id`
- `items.productId` → references `products._id`
- `items.sellerId` → references `users._id`

### `notifications`
- `userId` → references `users._id`

### `analytics`
- `actorId` → references `users._id` (or other actor IDs used for event tracking)

### `coupons`
- `code` → referenced by `orders.coupon_code` in PostgreSQL (application-level lookup only)

### Notes
- MongoDB uses application-level reference fields rather than Mongoose `ref`/populate definitions.
- Most Mongo relations are stored as strings, not enforced foreign keys.

## PostgreSQL Tables

### `orders`
- `buyer_id` → logically references `users.id` from MongoDB user records
- `coupon_code` → logically references `coupons.code` in MongoDB

### `order_items`
- `order_id` → foreign key to `orders.id` (`REFERENCES orders(id) ON DELETE CASCADE`)
- `product_id` → logically references `products._id` in MongoDB
- `seller_id` → logically references `users.id` for the product seller

### `payments`
- `order_id` → foreign key to `orders.id` (`REFERENCES orders(id) ON DELETE CASCADE`)
- `buyer_id` → logically references `users.id`
- `provider_order_id` / `provider_payment_id` → external payment provider IDs

### `wallets`
- `user_id` → logically references `users.id`

### `wallet_transactions`
- `user_id` → logically references `users.id`
- `reference_type` / `reference_id` → polymorphic reference, typically used for `order` references

### `user_kyc`
- `user_id` → logically references `users.id`
- `reviewed_by` → logically references `users.id` of the admin/reviewer

### `seller_kyc`
- `seller_id` → logically references `users.id` for a seller account
- `reviewed_by` → logically references `users.id` of the admin/reviewer

### `outbox_events`
- `aggregate_id` → polymorphic reference used by domain events
  - can hold `order` id, `payment` id, `user` id, or other aggregate IDs depending on event type

## Cross-Database Relationships

- `orders.buyer_id`, `payments.buyer_id`, `wallets.user_id`, `wallet_transactions.user_id`, `user_kyc.user_id`, `seller_kyc.seller_id`, `notifications.userId`, `analytics.actorId` all use the same `users` identity space.
- `order_items.product_id`, `carts.items.productId`, and `inventoryreservations.items.productId` all point to the same `products` identity space.
- `order_items.seller_id`, `products.sellerId`, and `seller_kyc.seller_id` all point to seller user accounts stored in `users`.
- `inventoryreservations.orderId` is the main MongoDB → PostgreSQL bridge in current design.

## Practical Relation Map

1. `users` → `carts` by `userId`
2. `users` → `referrals` by `referrerUserId` / `refereeUserId`
3. `users` → `notifications` by `userId`
4. `users` → `analytics` by `actorId`
5. `users` → `wallets` by `user_id`
6. `users` → `user_kyc` by `user_id`
7. `users` → `seller_kyc` by `seller_id`
8. `users` → `products` by `sellerId`
9. `products` → `carts.items` and `inventoryreservations.items` by `productId`
10. `orders` → `order_items` by `order_id`
11. `orders` → `payments` by `order_id`
12. `orders` → `inventoryreservations` by `orderId`
13. `coupons.code` → `orders.coupon_code`

## Summary
- MongoDB handles user, product, cart, referral, inventory reservation, notification, analytics, and coupon data.
- PostgreSQL handles orders, payments, wallets, KYC, and outbox events.
- There are only two enforced Postgres FKs: `order_items.order_id → orders.id` and `payments.order_id → orders.id`.
- All other relations are application-level references across MongoDB and PostgreSQL.
