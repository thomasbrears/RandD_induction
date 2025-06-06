import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
});

// Reference your storage bucket
const bucket = storage.bucket("aut-events-induction-files");

export { bucket, storage };