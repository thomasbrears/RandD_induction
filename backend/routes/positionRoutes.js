import express from "express";
import { getAllPositions, createPosition, updatePosition, deletePosition } from "../controllers/positionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Position routes
router.get("/", authMiddleware, getAllPositions);  // Fetch all positions
router.post("/", authMiddleware, createPosition); // Add new position
router.put("/:id", authMiddleware, updatePosition); // Update position
router.delete("/:id", authMiddleware, deletePosition); // Delete position

export default router;
