import express from "express";
import multer from "multer";

import{
    uploadFile,
    getSignedUrl,
    deleteFile
} from "../controllers/fileController.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

// File routes
router.post("/upload-file", (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "File too large. Max size is 10MB." });
      } else if (err) {
        return res.status(500).json({ error: "Upload failed.", details: err.message });
      }
      next();
    });
  }, uploadFile);
  
router.get("/signed-url", getSignedUrl);
router.delete("/delete-file", deleteFile);

export default router;