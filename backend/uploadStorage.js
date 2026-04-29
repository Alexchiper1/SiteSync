import "./env.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Pull Cloudinary credentials from environment.
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

// True only when all three Cloudinary vars are non empty strings otherwise we fall back to disk or memory behavior.
const hasCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);
// Vercel sets VERCEL=1 during serverless builds to avoid writing to local disk
const isVercel = Boolean(process.env.VERCEL);

// Configure the Cloudinary client once so uploads can use cloudinary.uploader later
if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

// Vercel functions run on a read only filesystem, so never initialize disk storage there. *******************
// Choose multer storage, RAM buffers when using Cloudinary or on Vercel, otherwise save files under uploads/ on disk.
const storage = hasCloudinaryConfig || isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: "uploads/",
      filename: (req, file, cb) => {
        // Unique filename, timestamp + original name from the browser
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    });

// Default export pattern for routes, use upload.single("fieldName") on the Express routes.
export const upload = multer({ storage });
// some othermodules import cloudinary to upload buffers, flags tell code whether Cloudinary/disk paths apply.
export { cloudinary, hasCloudinaryConfig, isVercel };
