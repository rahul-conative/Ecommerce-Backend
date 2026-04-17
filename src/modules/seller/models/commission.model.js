exports.up = async function (knex) {
  // ==============================
  // SELLER PAYOUTS (create first for FK dependency)
  // ==============================
  await knex.schema.createTable("seller_payouts", (table) => {
    table.uuid("id").primary();

    table.uuid("seller_id").notNullable().index();

    table.date("period_start").notNullable();
    table.date("period_end").notNullable();

    table.decimal("total_amount", 14, 2).notNullable();
    table.decimal("commission_amount", 14, 2).notNullable();
    table.decimal("tax_amount", 14, 2).defaultTo(0);
    table.decimal("net_amount", 14, 2).notNullable();

    table
      .enu("status", ["pending", "processing", "completed", "failed"])
      .defaultTo("pending");

    table.string("payment_method").nullable();
    table.string("payment_reference").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());

    // 🔥 Index for dashboard queries
    table.index(["seller_id", "status"]);
  });

  // ==============================
  // SELLER COMMISSIONS
  // ==============================
  await knex.schema.createTable("seller_commissions", (table) => {
    table.uuid("id").primary();

    table.uuid("seller_id").notNullable().index();
    table.uuid("order_id").notNullable().index();

    table.decimal("amount", 12, 2).notNullable();
    table.decimal("commission_rate", 5, 2).notNullable();
    table.decimal("commission_amount", 12, 2).notNullable();
    table.decimal("tax_amount", 12, 2).defaultTo(0);
    table.decimal("net_amount", 12, 2).notNullable();

    table
      .enu("status", ["pending", "approved", "paid", "rejected"])
      .defaultTo("pending");

    table.uuid("payout_id").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());

    // 🔥 Foreign Keys
    table
      .foreign("payout_id")
      .references("id")
      .inTable("seller_payouts")
      .onDelete("SET NULL");

    // 🔥 Indexes
    table.index(["seller_id", "status"]);
    table.index(["order_id"]);
  });

  // ==============================
  // SELLER SETTLEMENTS
  // ==============================
  await knex.schema.createTable("seller_settlements", (table) => {
    table.uuid("id").primary();

    table.uuid("seller_id").notNullable().index();

    table.date("settlement_date").notNullable();

    table.decimal("amount", 14, 2).notNullable();

    table.string("currency").defaultTo("INR");

    table
      .enu("status", ["pending", "issued", "completed", "failed"])
      .defaultTo("pending");

    table.text("notes").nullable();

    table.timestamp("created_at").defaultTo(knex.fn.now());

    // 🔥 Index for reporting
    table.index(["seller_id", "settlement_date"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("seller_commissions");
  await knex.schema.dropTableIfExists("seller_settlements");
  await knex.schema.dropTableIfExists("seller_payouts");
};