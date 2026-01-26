import express from "express";
import { createPeople, deletePeople, getAllPeople, getPeople, updatePeople } from "../Controllers/PeopleController.js";

const router = express.Router();

router.get ("/People", getAllPeople);
router.get ("/People/:id", getPeople);
router.post("/People", (req, res, next) => {
  console.log("🔥 Route People POST déclenchée !");
  next();
}, createPeople);

router.put ("/People/:id", updatePeople);
router.delete ("/People/:id", deletePeople);

export default router ;