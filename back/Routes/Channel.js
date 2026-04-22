import express from "express";
import {
    deleteChannelById,
    getChannelById
} from "../Controllers/ChannelControllers.js";
import { authenticate } from "../middleware/authentificationJwt.js";

const router = express.Router();

router.get ("/:channelId", authenticate, getChannelById);

router.delete ("/:channelId", authenticate, deleteChannelById);

export default router;