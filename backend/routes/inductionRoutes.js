import express from "express";
import {
  getAllInductions,
  createInduction,
  getInductionById,
} from "../controllers/inductionController.js";

const router = express.Router();

// Induction routes
router.get("/", getAllInductions);
router.post("/create-induction", createInduction);
router.get("/get-induction", getInductionById);

export default router;