import express from "express";
import { createUser, deleteUser, getAllUser, getUser, updateUser } from "../Controllers/UserController.js";

const router = express.Router();

router.get ("/User", getAllUser);
router.get ("/User/:id", getUser);
router.post("/User", (req, res, next) => {
  console.log("Route User POST déclenchée !");
  next();
}, createUser);

router.put ("/User/:id", updateUser);
router.delete ("/User/:id", deleteUser);

export default router ;