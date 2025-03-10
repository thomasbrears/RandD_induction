import express from "express";
import { submitContactForm, getAllContacts, getContactById, updateContactStatus, deleteContact } from "../controllers/ContactController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route for submitting contact form
router.post("/submit", submitContactForm);

// private routes
router.get("/", authMiddleware, getAllContacts);  // Fetch all contacts
router.get("/:id", authMiddleware, getContactById);  // Get contact by ID
router.patch("/:id/status", authMiddleware, updateContactStatus);  // Update contact status
router.delete("/:id", authMiddleware, deleteContact);  // Delete contact

export default router;