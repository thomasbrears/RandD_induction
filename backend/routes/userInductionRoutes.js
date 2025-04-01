import express from "express";
import { 
  assignInductionToUser,
  getUserInductions,
  getUserInductionById,
  updateUserInduction,
  deleteUserInduction,
  getUsersByInduction,
  getInductionStats
} from "../controllers/userInductionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/assign", authMiddleware, assignInductionToUser);
router.get("/user/:userId", authMiddleware, getUserInductions);
router.get("/:id", authMiddleware, getUserInductionById);
router.put("/:id", authMiddleware, updateUserInduction);
router.delete("/:id", authMiddleware, deleteUserInduction);
router.get("/by-induction", authMiddleware, getUsersByInduction);
router.get("/stats", authMiddleware, getInductionStats);

export default router;