import express from "express";
import { getAllCertificateTypes, createCertificateType, updateCertificateType, deleteCertificateType } from "../controllers/certificateTypeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllCertificateTypes);      // Fetch all certificate types
router.post("/", authMiddleware, createCertificateType);      // Add new certificate type
router.put("/:id", authMiddleware, updateCertificateType);    // Update certificate type
router.delete("/:id", authMiddleware, deleteCertificateType); // Delete certificate type

export default router;