import express from "express";
import { ContentController } from "./content.controllers.js";
import multer from "multer";
import validateRequest from "../../middlewares/validateRequest.js";
import { ContentValidation } from "./content.validations.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post(
  "/",
  authenticate as any,
  upload.single("file"),
  validateRequest(ContentValidation.uploadContentZodSchema),
  ContentController.uploadContent
);

router.get("/:id", authenticate as any, ContentController.getContentJob);

export const contentRoutes = router;
