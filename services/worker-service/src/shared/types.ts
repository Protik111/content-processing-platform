import { Request } from "express";

export interface IAuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}
