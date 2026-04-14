import express from "express";
import { ContentController } from "./content.controllers.js";
import multer from "multer";
import validateRequest from "../../middlewares/validateRequest.js";
import { ContentValidation } from "./content.validations.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

const ALLOWED_MIME_TYPES = ["text/plain", "text/csv", "text/html", "text/markdown", "application/json"];

const upload = multer({
  dest: "uploads/",
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only text files are allowed.`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});


router.post(
  "/",
  authenticate as any,
  upload.single("file"),
  validateRequest(ContentValidation.uploadContentZodSchema),
  ContentController.uploadContent
);

router.get("/", authenticate as any, ContentController.getAllContentJobs);

router.get("/:id", authenticate as any, ContentController.getContentJob);

export const contentRoutes = router;
