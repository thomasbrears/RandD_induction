import express from "express";
import {
  getAllInductions,
  createInduction,
  getInductionById,
  updateInductionById,
  deleteInduction,
} from "../controllers/inductionController.js";

const router = express.Router();

// Induction routes
router.get("/", getAllInductions);
router.post("/create-induction", createInduction);
router.get("/get-induction", getInductionById);
router.put("/update-induction",updateInductionById);
router.delete("/delete-induction", deleteInduction);

export default router;