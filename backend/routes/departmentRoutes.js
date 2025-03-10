import express from "express";
import { getAllDepartments, createDepartment, updateDepartment, deleteDepartment, addEmailFieldToDepartments } from "../controllers/departmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Department routes
router.get("/", authMiddleware, getAllDepartments);  // Fetch all departments
router.post("/", authMiddleware, createDepartment);  // Add new department
router.put("/:id", authMiddleware, updateDepartment); // Update department
router.delete("/:id", authMiddleware, deleteDepartment); // Delete department

// Migration route - add email to existing departments
router.post("/migrate/add-email", authMiddleware, addEmailFieldToDepartments);

export default router;
