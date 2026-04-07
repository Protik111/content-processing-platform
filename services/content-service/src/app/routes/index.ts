import express from "express";
import { contentRoutes } from "../modules/content/content.routes.js";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/content",
    route: contentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
