import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

const validateRequest =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
        file: req.file,
      });
      return next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
