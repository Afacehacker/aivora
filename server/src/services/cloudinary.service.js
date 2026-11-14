import cloudinary from '../config/cloudinary.js';

/**
 * Upload an image file to Cloudinary
 * @param {string} filePath - Local or remote file path
 * @param {string} folder - Cloudinary folder
 */
export const uploadImage = async (filePath, folder = 'aivora/images') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    quality: 'auto',
    fetch_format: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Upload a video file to Cloudinary
 * @param {string} filePath - Local or remote file path
 * @param {string} folder - Cloudinary folder
 */
export const uploadVideo = async (filePath, folder = 'aivora/videos') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'video',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration,
  };
};

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' or 'video'
 */
export const deleteFile = async (publicId, resourceType = 'image') => {
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });

  return result;
};
