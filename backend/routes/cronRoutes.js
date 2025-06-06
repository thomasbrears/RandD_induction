import express from "express";
import { updateOverdueInductions, checkQualificationExpiries } from "../controllers/cronController.js";

const router = express.Router();

router.get("/update-overdue", updateOverdueInductions);

router.get("/check-qualification-expiries", checkQualificationExpiries);

export default router;
