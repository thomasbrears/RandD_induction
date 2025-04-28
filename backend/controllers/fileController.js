import { bucket } from "../gcs.js";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const BUCKET_NAME = "r_and_d_induction_files";

export const uploadFile = async (req, res) => {
  try {
    const { file } = req;
    const { customFileName } = req.body;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    const safeOriginalName = file.originalname.replace(/\s+/g, "_");

    // Use provided customFileName or generate one
    const gcsFileName = customFileName 
      ? customFileName.replace(/\s+/g, "_")
      : `${Date.now()}_${safeOriginalName}`;

    const blob = bucket.file(gcsFileName);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Error uploading file:", err);
      return res.status(500).send("Something went wrong.");
    });

    blobStream.on("finish", async () => {
      try {
        const options = {
          version: "v4",
          action: "read",
          expires: Date.now() + 60 * 60 * 1000,
        };

        const [signedUrl] = await blob.getSignedUrl(options);

        res.status(200).json({
          message: "File uploaded successfully!",
          url: signedUrl,
          gcsFileName,
        });
      } catch (error) {
        console.error("Error generating signed URL:", error);
        res.status(500).send("Error generating signed URL.");
      }
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).send("Internal server error.");
  }
};

export const getSignedUrl = async (req, res) => {
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const file = storage.bucket(BUCKET_NAME).file(fileName);
    
    // Options for the signed URL
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour expiration
    };

    // Get the signed URL
    const [url] = await file.getSignedUrl(options);

    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate signed URL", details: error.message });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).send("File name is required.");
    }

    const file = storage.bucket(BUCKET_NAME).file(fileName);

    await file.delete();
    res.status(200).send("File deleted successfully.");
  } catch (error) {
    res.status(500).send("Failed to delete file.");
  }
};