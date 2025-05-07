import express from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  deactivateUser,
  reactivateUser,
} from "../controllers/userController.js";

const router = express.Router();

// User routes
router.get("/", getAllUsers);
router.get("/get-user", getUser);
router.post("/create-new-user", createUser);
router.put("/update-user", updateUser);
router.delete("/delete-user", deleteUser);
router.post("/deactivate-user", deactivateUser);
router.post("/reactivate-user", reactivateUser);

export default router;
