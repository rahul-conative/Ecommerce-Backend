const { successResponse } = require("../../../shared/http/response");
const { UserService } = require("../services/user.service");
const { requireActor } = require("../../../shared/auth/actor-context");

class UserController {
  constructor({ userService = new UserService() } = {}) {
    this.userService = userService;
  }

  getMe = async (req, res) => {
    const actor = requireActor(req);
    const user = await this.userService.getProfile(actor.userId);
    res.json(successResponse(user));
  };

  updateMe = async (req, res) => {
    const actor = requireActor(req);
    const user = await this.userService.updateProfile(actor.userId, req.body);
    res.json(successResponse(user));
  };

  submitKyc = async (req, res) => {
    const actor = requireActor(req);
    const kyc = await this.userService.submitKyc(actor.userId, req.body);
    res.status(201).json(successResponse(kyc));
  };

  reviewKyc = async (req, res) => {
    const actor = requireActor(req);
    const kyc = await this.userService.reviewKyc(req.params.userId, req.body, actor);
    res.json(successResponse(kyc));
  };
}

module.exports = { UserController };
