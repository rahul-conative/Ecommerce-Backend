const { successResponse } = require("../../../shared/http/response");
const { NotificationService } = require("../services/notification.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class NotificationController {
  constructor({ notificationService = new NotificationService() } = {}) {
    this.notificationService = notificationService;
  }

  create = async (req, res) => {
    const notification = await this.notificationService.createNotification(req.body);
    res.status(201).json(successResponse(notification));
  };

  listMine = async (req, res) => {
    const actor = requireActor(req);
    const notifications = await this.notificationService.listMyNotifications(actor);
    res.json(successResponse(notifications));
  };
}

module.exports = { NotificationController };
