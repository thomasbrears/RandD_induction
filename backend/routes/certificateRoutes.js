import express from "express";
import { generateCertificate, verifyCertificate } from "../controllers/certificateController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to generate a PDF certificate
// Protected by auth middleware
router.get("/generate/:userInductionId", authMiddleware, generateCertificate);

// Public route to verify a certificate 
// (no auth required as this could be used by external parties to verify certificates)
router.get("/verify/:certificateId", verifyCertificate);

export default router;
