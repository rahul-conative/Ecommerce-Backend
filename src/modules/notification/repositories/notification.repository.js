const { NotificationModel } = require("../models/notification.model");

class NotificationRepository {
  async create(payload) {
    return NotificationModel.create(payload);
  }

  async listByUser(userId) {
    return NotificationModel.find({ userId }).sort({ createdAt: -1 });
  }
}

module.exports = { NotificationRepository };
