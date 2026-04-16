const { AppError } = require("../errors/app-error");
const { hasCapability } = require("../auth/access-control");

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
}

function authorizeCapability(...capabilities) {
  return (req, res, next) => {
    if (!req.auth) {
      return next(new AppError("Authentication required", 401));
    }

    const allowed = capabilities.every((capability) => hasCapability(req.auth.role, capability));
    if (!allowed) {
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
}

module.exports = { authorize, authorizeCapability };
