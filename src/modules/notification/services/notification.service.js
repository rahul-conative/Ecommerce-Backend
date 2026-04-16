const { NotificationRepository } = require("../repositories/notification.repository");
const { createQueue } = require("../../../shared/queues/queue-factory");
const { sendMail } = require("../../../infrastructure/mail/mailer");
const { eventBus } = require("../../../infrastructure/events/event-bus");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");

const notificationQueue = createQueue("notifications");
let subscribersRegistered = false;

class NotificationService {
  constructor({ notificationRepository = new NotificationRepository() } = {}) {
    this.notificationRepository = notificationRepository;
    this.registerSubscribers();
  }

  registerSubscribers() {
    if (subscribersRegistered) {
      return;
    }

    subscribersRegistered = true;

    eventBus.subscribe(DOMAIN_EVENTS.AUTH_USER_REGISTERED_V1, async (event) => {
      const { userId, email } = event.payload;
      await notificationQueue.add("welcome-email", { userId, email });
    });
  }

  async createNotification(payload) {
    const notification = await this.notificationRepository.create(payload);

    if (notification.channel === "email" && payload.email) {
      await sendMail({
        to: payload.email,
        subject: notification.subject || "Notification",
        html: `<p>${notification.template}</p>`,
      });
    }

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.NOTIFICATION_CREATED_V1,
        {
          userId: notification.userId,
          channel: notification.channel,
          subject: notification.subject,
        },
        {
          source: "notification-module",
          aggregateId: notification.id,
        },
      ),
    );

    return notification;
  }

  async listMyNotifications(actor) {
    return this.notificationRepository.listByUser(actor.userId);
  }
}

module.exports = { NotificationService, notificationQueue };
