const cloudinary = require('cloudinary').v2;

let configured = false;

function hasCloudinaryConfig() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  if (configured) {
    return cloudinary;
  }

  if (!hasCloudinaryConfig()) {
    return null;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
  return cloudinary;
}

function uploadBuffer(buffer, options = {}) {
  const client = configureCloudinary();
  if (!client) {
    throw new Error('Cloudinary is not configured for resume uploads');
  }

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }

      return resolve(result);
    });

    stream.end(buffer);
  });
}

async function deleteAsset(publicId, resourceType = 'raw') {
  if (!publicId) {
    return null;
  }

  const client = configureCloudinary();
  if (!client) {
    return null;
  }

  return client.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = {
  cloudinary,
  configureCloudinary,
  hasCloudinaryConfig,
  uploadBuffer,
  deleteAsset,
};