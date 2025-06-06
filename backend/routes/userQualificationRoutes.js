import express from "express";
import multer from "multer";
import {
  uploadUserQualification,
  getUserQualifications,
  updateUserQualification,
  deleteUserQualification,
  getAllUserQualifications,
  requestQualificationFromUser,
  getQualificationRequests
} from "../controllers/userQualificationController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// User qualification routes
router.post("/upload", upload.single("file"), uploadUserQualification);
router.get("/", getUserQualifications);
router.put("/:id", upload.single("file"), updateUserQualification);
router.delete("/:id", deleteUserQualification);

// Manager routes
router.get("/all", getAllUserQualifications);
router.post("/request", requestQualificationFromUser);
router.get("/requests", getQualificationRequests);

export default router;