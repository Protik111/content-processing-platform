import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync.js";
import { ContentService } from "./content.services.js";
import sendResponse from "../../../shared/sendResponse.js";
import type { IAuthRequest } from "../../../shared/types.js";

// Upload file and create a content job
const uploadContent = catchAsync(async (req: IAuthRequest, res: Response) => {
  const { type } = req.body;
  const filePath = req.file!.path;
  
  // Using a dummy userId for now since authentication middleware is not yet implemented
  const userId = req.user?.id || "dummy-user-id";

  const result = await ContentService.createContentJob({
    filePath,
    type,
    userId,
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
