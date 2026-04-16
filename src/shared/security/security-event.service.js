const { SecurityEventModel } = require("./security-event.model");

class SecurityEventService {
  async record(payload) {
    return SecurityEventModel.create(payload);
  }
}

const securityEventService = new SecurityEventService();

module.exports = { SecurityEventService, securityEventService };
