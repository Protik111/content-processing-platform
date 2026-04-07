import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync.js";
import { ContentService } from "./content.services.js";
import sendResponse from "../../../shared/sendResponse.js";
import type { IAuthRequest } from "../../../shared/types.js";

// Upload file and create a content job
const uploadContent = catchAsync(async (req: IAuthRequest, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: 400,
      success: false,
      message: "No file uploaded",
    });
  }

  if (!req.user?.id) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "User not authenticated",
    });
  }

  const { type } = req.body; // e.g., 'SUMMARY' or 'TEXT_EXTRACTION'
  const filePath = req.file.path;

  const result = await ContentService.createContentJob({
    filePath,
    type,
    userId: req.user.id,
  });

  sendResponse<{ jobId: string }>(res, {
    statusCode: 202,
    success: true,
    message: "Content job created",
    data: { jobId: result },
  });
});

export const ContentController = {
  uploadContent,
};
