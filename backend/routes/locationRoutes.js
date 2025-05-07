import express from "express";
import { getAllLocations, createLocation, updateLocation, deleteLocation } from "../controllers/locationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Location routes
router.get("/", authMiddleware, getAllLocations);  // Fetch all locations
router.post("/", authMiddleware, createLocation);  // Add new location
router.put("/:id", authMiddleware, updateLocation); // Update location
router.delete("/:id", authMiddleware, deleteLocation); // Delete location

export default router;