const { SellerRepository } = require("../repositories/seller.repository");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { KYC_STATUS } = require("../../../shared/domain/commerce-constants");
const { AppError } = require("../../../shared/errors/app-error");

class SellerService {
  constructor({ sellerRepository = new SellerRepository() } = {}) {
    this.sellerRepository = sellerRepository;
  }

  async submitKyc(payload, actor) {
    const record = await this.sellerRepository.upsertKyc({
      ...payload,
      sellerId: actor.userId,
      verificationStatus: KYC_STATUS.SUBMITTED,
    });

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.SELLER_KYC_SUBMITTED_V1,
        {
          sellerId: actor.userId,
          verificationStatus: record.verification_status,
          legalName: record.legal_name,
        },
        {
        source: "seller-module",
        aggregateId: actor.userId,
        },
      ),
    );
    return record;
  }

  async updateProfile(payload, actor) {
    const existingSeller = await this.sellerRepository.findSellerById(actor.userId);
    if (!existingSeller) {
      throw new AppError("Seller profile not found", 404);
    }

    const kycRecord = await this.sellerRepository.findKycBySellerId(actor.userId);
    const nextChecklist = {
      ...(existingSeller.sellerProfile?.onboardingChecklist || {}),
      ...(payload.onboardingChecklist || {}),
      profileCompleted: true,
      kycSubmitted: Boolean(kycRecord),
      gstVerified: kycRecord?.verification_status === KYC_STATUS.VERIFIED,
    };

    const nextOnboardingStatus = Object.values(nextChecklist).every(Boolean) ? "ready_for_go_live" : "in_progress";
    const updatedSeller = await this.sellerRepository.updateSellerProfile(actor.userId, {
      ...(existingSeller.sellerProfile || {}),
      ...payload,
      onboardingChecklist: nextChecklist,
      onboardingStatus: nextOnboardingStatus,
    });

    return updatedSeller?.sellerProfile || null;
  }

  async updateSettings(payload, actor) {
    const existingSeller = await this.sellerRepository.findSellerById(actor.userId);
    if (!existingSeller) {
      throw new AppError("Seller profile not found", 404);
    }

    const nextSettings = {
      ...(existingSeller.sellerSettings || {}),
      ...payload,
    };

    const updatedSeller = await this.sellerRepository.updateSellerSettings(actor.userId, nextSettings);
    return updatedSeller?.sellerSettings || null;
  }

  async getDashboard(query, actor) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : this.getDateBeforeDays(30);
    const toDate = query.toDate ? new Date(query.toDate) : new Date();

    const [summary, topProducts, recentOrders, seller, kyc] = await Promise.all([
      this.sellerRepository.fetchDashboardSummary(actor.userId, fromDate, toDate),
      this.sellerRepository.fetchTopProducts(actor.userId, fromDate, toDate),
      this.sellerRepository.fetchRecentOrders(actor.userId),
      this.sellerRepository.findSellerById(actor.userId),
      this.sellerRepository.findKycBySellerId(actor.userId),
    ]);

    const totalOrders = Number(summary?.total_orders || 0);
    const gmv = Number(summary?.gmv || 0);

    return {
      window: {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      },
      onboarding: {
        status: seller?.sellerProfile?.onboardingStatus || "initiated",
        checklist: seller?.sellerProfile?.onboardingChecklist || {},
        kycStatus: kyc?.verification_status || KYC_STATUS.DRAFT,
      },
      metrics: {
        totalOrders,
        unitsSold: Number(summary?.units_sold || 0),
        gmv,
        deliveredRevenue: Number(summary?.delivered_revenue || 0),
        cancelledOrders: Number(summary?.cancelled_orders || 0),
        returnedOrders: Number(summary?.returned_orders || 0),
        averageOrderValue: totalOrders > 0 ? Number((gmv / totalOrders).toFixed(2)) : 0,
        averageItemValue: Number(summary?.avg_item_value || 0),
      },
      topProducts,
      recentOrders,
    };
  }

  getDateBeforeDays(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  async reviewKyc(sellerId, payload, actor) {
    const record = await this.sellerRepository.reviewKyc(sellerId, {
      ...payload,
      reviewedBy: actor.userId,
    });

    if (!record) {
      throw new AppError("Seller KYC record not found", 404);
    }

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.KYC_STATUS_UPDATED_V1,
        {
          sellerId,
          verificationStatus: record.verification_status,
          rejectionReason: record.rejection_reason,
        },
        {
          source: "seller-module",
          aggregateId: sellerId,
        },
      ),
    );

    return record;
  }
}

module.exports = { SellerService };
