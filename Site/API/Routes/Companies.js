import express from "express";
import { createCompanies, deleteCompanies, getAllCompanies, getCompanies, updateCompanies } from "../Controllers/CompaniesController.js";

const router = express.Router();

router.get ("/Companies", getAllCompanies);
router.get ("/Companies/:id", getCompanies);
router.post ("/Companies", createCompanies);
router.put ("/Companies/:id", updateCompanies);
router.delete ("/Companies/:id", deleteCompanies);

export default router ;