import { z } from "zod";

const uploadContentZodSchema = z.object({
  body: z.object({
    type: z.enum(["TEXT_EXTRACTION", "SUMMARY"]),
  }),
  file: z.object({
    path: z.string(),
  }),
});

export const ContentValidation = {
  uploadContentZodSchema,
};
