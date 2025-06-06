import express from "express";
import { runDailyCronJobs, updateOverdueInductions, checkQualificationExpiries } from "../controllers/cronController.js";

const router = express.Router();

/**
 * @route GET /api/cron/daily-jobs
 * @description Runs all daily cron jobs (overdue inductions + qualification expiries)
 * @access Restricted by API key (no auth middleware)
 * @query {string} apiKey - Secret API key for authentication
 */
router.get("/daily-jobs", runDailyCronJobs);

/**
 * @route GET /api/cron/update-overdue
 * @description Updates induction statuses to "overdue" when due dates pass (legacy endpoint)
 * @access Restricted by API key (no auth middleware)
 * @query {string} apiKey - Secret API key for authentication
 */
router.get("/update-overdue", updateOverdueInductions);

/**
 * @route GET /api/cron/check-qualifications
 * @description Checks for expiring/expired qualifications and sends notifications (legacy endpoint)
 * @access Restricted by API key (no auth middleware)
 * @query {string} apiKey - Secret API key for authentication
 */
router.get("/check-qualifications", checkQualificationExpiries);

export default router;