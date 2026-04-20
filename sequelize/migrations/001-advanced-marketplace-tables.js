module.exports = {
  id: "001-advanced-marketplace-tables",
  async up({ queryInterface, Sequelize, transaction }) {
    await queryInterface.createTable(
      "tax_invoices",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        invoice_number: { type: Sequelize.STRING(64), allowNull: false, unique: true },
        order_id: { type: Sequelize.UUID, allowNull: false },
        buyer_id: { type: Sequelize.STRING(64), allowNull: false },
        taxable_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        cgst_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        sgst_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        igst_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        tcs_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "INR" },
        tax_mode: { type: Sequelize.STRING(32), allowNull: false },
        gstin_marketplace: { type: Sequelize.STRING(32), allowNull: true },
        gstin_seller: { type: Sequelize.STRING(32), allowNull: true },
        place_of_supply: { type: Sequelize.STRING(64), allowNull: true },
        issued_at: { type: Sequelize.DATE, allowNull: false },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "tax_ledger_entries",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        order_id: { type: Sequelize.UUID, allowNull: false },
        invoice_id: { type: Sequelize.UUID, allowNull: true },
        entry_type: { type: Sequelize.STRING(32), allowNull: false },
        tax_component: { type: Sequelize.STRING(16), allowNull: false },
        amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "INR" },
        reference_type: { type: Sequelize.STRING(32), allowNull: false },
        reference_id: { type: Sequelize.STRING(64), allowNull: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "vendor_payouts",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        seller_id: { type: Sequelize.STRING(64), allowNull: false },
        period_start: { type: Sequelize.DATE, allowNull: false },
        period_end: { type: Sequelize.DATE, allowNull: false },
        gross_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        commission_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        processing_fee_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        tax_withheld_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
        net_payout_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: "INR" },
        status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "scheduled" },
        scheduled_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        processed_at: { type: Sequelize.DATE, allowNull: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "admin_action_logs",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        admin_id: { type: Sequelize.STRING(64), allowNull: false },
        action_type: { type: Sequelize.STRING(64), allowNull: false },
        target_type: { type: Sequelize.STRING(64), allowNull: false },
        target_id: { type: Sequelize.STRING(64), allowNull: false },
        ip_address: { type: Sequelize.STRING(64), allowNull: true },
        user_agent: { type: Sequelize.TEXT, allowNull: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      },
      { transaction },
    );

    await queryInterface.createTable(
      "gst_filings",
      {
        id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
        filing_period: { type: Sequelize.STRING(16), allowNull: false, unique: true },
        gstr_type: { type: Sequelize.STRING(16), allowNull: false, defaultValue: "GSTR-8" },
        total_taxable_value: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        total_tcs_collected: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        total_cgst: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        total_sgst: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        total_igst: { type: Sequelize.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: "draft" },
        filed_at: { type: Sequelize.DATE, allowNull: true },
        metadata: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      },
      { transaction },
    );

    await queryInterface.addIndex("tax_invoices", ["order_id"], { transaction });
    await queryInterface.addIndex("tax_ledger_entries", ["order_id", "tax_component"], { transaction });
    await queryInterface.addIndex("vendor_payouts", ["seller_id", "status"], { transaction });
    await queryInterface.addIndex("admin_action_logs", ["admin_id", "created_at"], { transaction });
    await queryInterface.addIndex("gst_filings", ["status"], { transaction });
  },

  async down({ queryInterface, transaction }) {
    await queryInterface.dropTable("gst_filings", { transaction });
    await queryInterface.dropTable("admin_action_logs", { transaction });
    await queryInterface.dropTable("vendor_payouts", { transaction });
    await queryInterface.dropTable("tax_ledger_entries", { transaction });
    await queryInterface.dropTable("tax_invoices", { transaction });
  },
};

