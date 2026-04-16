const cloudinary = require("cloudinary").v2;
const { env } = require("../../config/env");

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

class StorageService {
  async upload(filePath, options = {}) {
    return cloudinary.uploader.upload(filePath, options);
  }
}

const storageService = new StorageService();

module.exports = { storageService };
