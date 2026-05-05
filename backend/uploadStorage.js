import "./env.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Pull Cloudinary credentials from environment.
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

const hasCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);

if (!hasCloudinaryConfig) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

// Default export pattern for routes, use upload.single("fieldName") on the Express routes.
export const upload = multer({ storage });
export { cloudinary };
