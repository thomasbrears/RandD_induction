import express from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  //updateUserInductions,
  deleteUser,
  deactivateUser,
  reactivateUser,
  getAssignedInductions,
} from "../controllers/userController.js";

const router = express.Router();

// User routes
router.get("/", getAllUsers);
router.get("/get-user", getUser);
router.post("/create-new-user", createUser);
router.put("/update-user", updateUser);
//router.put("/update-user-inductions", updateUserInductions);
router.delete("/delete-user", deleteUser);
router.post("/deactivate-user", deactivateUser);
router.post("/reactivate-user", reactivateUser);
router.get("/get-assigned-inductions", getAssignedInductions);

export default router;
