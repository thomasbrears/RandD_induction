import express from "express";
import { 
  assignInductionToUser,
  getUserInductions,
  getUserInductionById,
  updateUserInduction,
  deleteUserInduction,
  getUsersByInduction,
  getInductionStats,
  getUserInductionResults,
  getInductionResults,
  getResultsStats,
  sendInductionReminder,
  exportInductionResultsToExcel,
  exportInductionResultsToPDF,
  exportStaffInductionResultsToPDF,
  exportStaffInductionResultsToExcel
} from "../controllers/userInductionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/assign", authMiddleware, assignInductionToUser);
router.get("/by-induction", authMiddleware, getUsersByInduction);
router.get("/stats", authMiddleware, getInductionStats);
router.get("/results-stats", authMiddleware, getResultsStats);
router.get("/results/:id", authMiddleware, getUserInductionResults);
router.get("/induction-results/:inductionId", authMiddleware, getInductionResults);
router.post("/send-reminder/:id", authMiddleware, sendInductionReminder);
router.get("/user/:userId", authMiddleware, getUserInductions);
router.get("/:id", authMiddleware, getUserInductionById);
router.put("/:id", authMiddleware, updateUserInduction);
router.delete("/:id", authMiddleware, deleteUserInduction);
router.get("/export-excel/:inductionId", authMiddleware, exportInductionResultsToExcel);
router.get('/export-pdf/:inductionId', authMiddleware, exportInductionResultsToPDF);
router.get("/export-excel/staff/:userInductionId", authMiddleware, exportStaffInductionResultsToExcel);
router.get('/export-pdf/staff/:userInductionId', authMiddleware, exportStaffInductionResultsToPDF);

export default router;