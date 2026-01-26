import express from "express";
import { createAdvertisements, deleteAdvertisements, getAllAdvertisements, updateAdvertisements, getAdvertisementsByCity, getAdvertisementsByBusinessSector } from "../Controllers/AdvertisementsController.js";

const router = express.Router();

router.get ("/Advertisements", getAllAdvertisements);
router.get ("/Advertisements/:city", getAdvertisementsByCity);
router.get ("/Advertisements/:business_sector", getAdvertisementsByBusinessSector);
router.post ("/Advertisements", createAdvertisements);
router.put ("/Advertisements/:id", updateAdvertisements);
router.delete ("/Advertisements/:id", deleteAdvertisements);

export default router ;