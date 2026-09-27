import type { FastifyInstance } from "fastify";
import { issueCode, reissueCode } from "../controllers/admin.controller.js";

export async function adminRoutes(app: FastifyInstance) {
  app.post("/v1/admin/registration-codes", issueCode);
  app.post("/v1/admin/registration-codes/reissue", reissueCode);
}