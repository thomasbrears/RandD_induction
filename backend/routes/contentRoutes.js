import express from "express";
import { getWebsiteContent, updateWebsiteContent } from "../controllers/contentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getWebsiteContent); // Public route to fetch content
router.put("/update", authMiddleware, updateWebsiteContent); // Protected route to update content

export default router;