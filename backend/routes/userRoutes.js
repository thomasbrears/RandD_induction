import express from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAssignedInductions,
} from "../controllers/userController.js";

const router = express.Router();

// User routes
router.get("/", getAllUsers);
router.get("/get-user", getUser);
router.post("/create-new-user", createUser);
router.put("/update-user", updateUser);
router.delete("/delete-user", deleteUser);
router.get("/get-assigned-inductions", getAssignedInductions);

export default router;
