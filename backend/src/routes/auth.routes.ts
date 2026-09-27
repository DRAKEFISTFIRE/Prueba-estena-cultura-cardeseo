import type { FastifyInstance } from "fastify";
import { requestCode, activate, login } from "../controllers/auth.controller.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/v1/auth/request-code", requestCode);
  app.post("/v1/auth/activate", activate);
  app.post("/v1/auth/login", login);
}