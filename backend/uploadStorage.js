import "./env.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import cloudinaryStoragePkg from "multer-storage-cloudinary";

const { CloudinaryStorage } = cloudinaryStoragePkg;

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

const hasCloudinaryConfig =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);

let storage;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: "sitesync/tasks",
      resource_type: "image",
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`
    })
  });
} else {
  storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
}

export const upload = multer({ storage });
export { hasCloudinaryConfig };
