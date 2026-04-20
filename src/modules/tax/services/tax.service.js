const { AppError } = require("../../../shared/errors/app-error");
const { TaxRepository } = require("../repositories/tax.repository");
const { OrderRepository } = require("../../order/repositories/order.repository");
const { env } = require("../../../config/env");

class TaxService {
  constructor({
    taxRepository = new TaxRepository(),
    orderRepository = new OrderRepository(),
  } = {}) {
    this.taxRepository = taxRepository;
    this.orderRepository = orderRepository;
  }

  async generateInvoice(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const existingInvoice = await this.taxRepository.findInvoiceByOrderId(orderId);
    if (existingInvoice) {
      return existingInvoice;
    }

    const taxBreakup = order.tax_breakup || {};
    const taxableAmount = Number(taxBreakup.taxableAmount || 0);
    const taxAmount = Number(order.tax_amount || taxBreakup.totalTaxAmount || 0);
    const cgstAmount = Number(taxBreakup.cgstAmount || 0);
    const sgstAmount = Number(taxBreakup.sgstAmount || 0);
    const igstAmount = Number(taxBreakup.igstAmount || 0);
    const tcsAmount = Number((taxableAmount * 0.01).toFixed(2));
    const invoiceNumber = await this.taxRepository.nextInvoiceNumber("GST");

    const invoice = await this.taxRepository.createInvoice({
      invoiceNumber,
      orderId,
      buyerId: order.buyer_id,
      taxableAmount,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      tcsAmount,
      totalAmount: Number(order.total_amount || 0),
      currency: order.currency || "INR",
      taxMode: taxBreakup.taxMode || "cgst_sgst",
      gstinMarketplace: env.commerce.gstinMarketplace || null,
      gstinSeller: null,
      placeOfSupply: order.shipping_address?.state || null,
      metadata: {
        orderStatus: order.status,
        generatedBy: "tax-service",
      },
    });

    const ledgerEntries = [];
    if (cgstAmount > 0) {
      ledgerEntries.push(this.buildLedgerEntry(orderId, invoice.id, "tax_collected", "cgst", cgstAmount));
    }
    if (sgstAmount > 0) {
      ledgerEntries.push(this.buildLedgerEntry(orderId, invoice.id, "tax_collected", "sgst", sgstAmount));
    }
    if (igstAmount > 0) {
      ledgerEntries.push(this.buildLedgerEntry(orderId, invoice.id, "tax_collected", "igst", igstAmount));
    }
    if (tcsAmount > 0) {
      ledgerEntries.push(this.buildLedgerEntry(orderId, invoice.id, "tax_collected", "tcs", tcsAmount));
    }

    await this.taxRepository.insertLedgerEntries(ledgerEntries);
    return invoice;
  }

  async getTaxReport(query) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : this.getDateBeforeDays(30);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();

    const reportRows = await this.taxRepository.listTaxReports({
      fromDate,
      toDate,
      taxComponent: query.taxComponent || null,
      limit: Number(query.limit || 200),
      offset: Number(query.offset || 0),
    });

    return {
      window: {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      entries: reportRows,
    };
  }

  buildLedgerEntry(orderId, invoiceId, entryType, taxComponent, amount) {
    return {
      orderId,
      invoiceId,
      entryType,
      taxComponent,
      amount: Number(amount),
      currency: "INR",
      referenceType: "invoice",
      referenceId: invoiceId,
    };
  }

  getDateBeforeDays(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}

module.exports = { TaxService };

