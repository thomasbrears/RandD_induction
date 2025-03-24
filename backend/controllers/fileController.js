import { bucket } from "../gcs.js";

export const uploadFile = async (req, res) => {
  try {
    const { file } = req;

    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Generate a unique filename (you can customize this if needed)
    const gcsFileName = `${Date.now()}_${file.originalname}`;
    
    // Upload the file to Google Cloud Storage
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

    blobStream.on("finish", () => {
      // Get the file URL after upload
      const fileUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFileName}`;

      // You can now store this URL in Firebase Firestore or another database
      res.status(200).json({
        message: "File uploaded successfully!",
        fileUrl,
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).send("Internal server error.");
  }
};