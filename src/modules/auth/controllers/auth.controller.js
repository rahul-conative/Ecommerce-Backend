const { successResponse } = require("../../../shared/http/response");
const { AuthService } = require("../services/auth.service");
const { buildRequestContext } = require("../../../shared/utils/request-context");

class AuthController {
  constructor({ authService = new AuthService() } = {}) {
    this.authService = authService;
  }

  register = async (req, res) => {
    const result = await this.authService.register(req.body, buildRequestContext(req));
    res.status(201).json(successResponse(result));
  };

  login = async (req, res) => {
    const result = await this.authService.login(req.body, buildRequestContext(req));
    res.json(successResponse(result));
  };

  refresh = async (req, res) => {
    const result = await this.authService.refreshToken(req.body.refreshToken, buildRequestContext(req));
    res.json(successResponse(result));
  };

  socialLogin = async (req, res) => {
    const result = await this.authService.socialLogin(req.body, buildRequestContext(req));
    res.json(successResponse(result));
  };
}

module.exports = { AuthController };
