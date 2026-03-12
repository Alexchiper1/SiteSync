import "./env.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

const hasCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);
const isVercel = Boolean(process.env.VERCEL);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

const localDiskStorage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Vercel functions run on a read-only filesystem, so never initialize disk storage there.
const storage = hasCloudinaryConfig || isVercel
  ? multer.memoryStorage()
  : localDiskStorage;

export const upload = multer({ storage });
export { cloudinary, hasCloudinaryConfig, isVercel };
