import express from "express";
import { ContentController } from "./content.controllers.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), ContentController.uploadContent);

export default router;
export const contentRoutes = router;
