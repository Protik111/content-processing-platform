import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import ApiError from "../errors/ApiError.js";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorMessages: { path: string | number; message: string }[] = [];

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorMessages = error.issues.map((issue) => ({
      path: issue.path[issue.path.length - 1] as string | number,
      message: issue.message,
    }));
  } else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  } else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: "",
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
