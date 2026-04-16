const paymentTable = {
  name: "payments",
  columns: [
    "id",
    "order_id",
    "buyer_id",
    "provider",
    "status",
    "amount",
    "currency",
    "transaction_reference",
    "created_at",
  ],
};

module.exports = { paymentTable };
