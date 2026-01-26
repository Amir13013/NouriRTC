import express from "express";
import { createApplications, deleteApplications, getAllApplications, getApplications, updateApplications } from "../Controllers/ApplicationsController.js";

const router = express.Router();

router.get ("/Applications", getAllApplications);
router.get ("/Applications/:id", getApplications);
router.post ("/Applications", createApplications);
router.put ("/Applications/:id", updateApplications);
router.delete ("/Applications/:id", deleteApplications);

export default router ;