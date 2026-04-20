const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class TaxRepository {
  async findInvoiceByOrderId(orderId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM tax_invoices WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1",
      [orderId],
    );
    return rows[0] || null;
  }

  async createInvoice(payload) {
    const id = uuidv4();
    const { rows } = await postgresPool.query(
      `INSERT INTO tax_invoices (
        id, invoice_number, order_id, buyer_id, taxable_amount, tax_amount,
        cgst_amount, sgst_amount, igst_amount, tcs_amount, total_amount,
        currency, tax_mode, gstin_marketplace, gstin_seller, place_of_supply, issued_at, metadata
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),$18
      )
      RETURNING *`,
      [
        id,
        payload.invoiceNumber,
        payload.orderId,
        payload.buyerId,
        payload.taxableAmount,
        payload.taxAmount,
        payload.cgstAmount,
        payload.sgstAmount,
        payload.igstAmount,
        payload.tcsAmount,
        payload.totalAmount,
        payload.currency || "INR",
        payload.taxMode,
        payload.gstinMarketplace || null,
        payload.gstinSeller || null,
        payload.placeOfSupply || null,
        payload.metadata || {},
      ],
    );
    return rows[0];
  }

  async insertLedgerEntries(entries) {
    if (!entries.length) {
      return [];
    }

    const values = [];
    const params = [];
    let idx = 1;

    for (const entry of entries) {
      values.push(
        `($${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},$${idx++},NOW(),$${idx++})`,
      );
      params.push(
        uuidv4(),
        entry.orderId,
        entry.invoiceId || null,
        entry.entryType,
        entry.taxComponent,
        entry.amount,
        entry.currency || "INR",
        entry.referenceType || "order",
        entry.referenceId || entry.orderId,
      );
    }

    const { rows } = await postgresPool.query(
      `INSERT INTO tax_ledger_entries (
        id, order_id, invoice_id, entry_type, tax_component, amount, currency, reference_type, created_at, reference_id
      )
      VALUES ${values.join(",")}
      RETURNING *`,
      params,
    );

    return rows;
  }

  async listTaxReports({ fromDate, toDate, taxComponent = null, limit = 200, offset = 0 }) {
    const values = [fromDate, toDate];
    let whereSql = "WHERE created_at BETWEEN $1 AND $2";
    let idx = 3;

    if (taxComponent) {
      whereSql += ` AND tax_component = $${idx++}`;
      values.push(taxComponent);
    }

    values.push(limit, offset);

    const { rows } = await postgresPool.query(
      `SELECT
         tax_component,
         entry_type,
         COUNT(*)::INT AS entry_count,
         COALESCE(SUM(amount), 0)::NUMERIC AS total_amount
       FROM tax_ledger_entries
       ${whereSql}
       GROUP BY tax_component, entry_type
       ORDER BY tax_component ASC, entry_type ASC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    );
    return rows;
  }

  async nextInvoiceNumber(prefix = "INV") {
    const { rows } = await postgresPool.query(
      `SELECT COUNT(*)::INT AS count
       FROM tax_invoices
       WHERE invoice_number LIKE $1`,
      [`${prefix}-%`],
    );
    const nextSequence = Number(rows[0]?.count || 0) + 1;
    const pad = String(nextSequence).padStart(6, "0");
    const month = new Date().toISOString().slice(0, 7).replace("-", "");
    return `${prefix}-${month}-${pad}`;
  }
}

module.exports = { TaxRepository };

