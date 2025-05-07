import express from "express";
import { getEmailSettings, updateEmailSettings } from "../controllers/emailSettingsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Email settings routes
router.get("/", authMiddleware, getEmailSettings);
router.put("/", authMiddleware, updateEmailSettings);

export default router;