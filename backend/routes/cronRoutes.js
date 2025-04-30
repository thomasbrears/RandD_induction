import express from "express";
import { updateOverdueInductions } from "../controllers/cronController.js";

const router = express.Router();

/**
 * @route GET /api/cron/update-overdue
 * @description Updates induction statuses to "overdue" when due dates pass
 * @access Restricted by API key (no auth middleware)
 * @query {string} apiKey - Secret API key for authentication
 */
router.get("/update-overdue", updateOverdueInductions);

export default router;
