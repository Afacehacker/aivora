import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Multer storage for images
export const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aivora/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// Multer storage for videos
export const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'aivora/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  },
});

export default cloudinary;
