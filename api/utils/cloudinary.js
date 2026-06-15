const cloudinary = require('cloudinary').v2;
const { retry } = require('./retry');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadToCloudinary(base64Image) {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary environment configuration is missing.');
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const folderPath = `logs/${yyyy}/${mm}/${dd}`;

  try {
    const secureUrl = await retry(async () => {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: folderPath,
        resource_type: "image"
      });
      return result.secure_url;
    }, 3, 1000);
    return secureUrl;
  } catch (error) {
    console.error("Cloudinary upload failed after retries:", error);
    throw new Error("Image archiving failed.");
  }
}

module.exports = {
  uploadToCloudinary
};
