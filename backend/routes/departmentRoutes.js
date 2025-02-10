import express from "express";
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment } from "../controllers/departmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Department routes
router.get("/", authMiddleware, getAllDepartments);  // Fetch all departments
router.post("/", authMiddleware, createDepartment);  // Add new department
router.put("/:id", authMiddleware, updateDepartment); // Update department
router.delete("/:id", authMiddleware, deleteDepartment); // Delete department

export default router;
