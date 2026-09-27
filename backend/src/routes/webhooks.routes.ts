import type { FastifyInstance } from "fastify";
import { handleWebhook } from "../controllers/webhooks.controller.js";

export async function webhooksRoutes(app: FastifyInstance) {
  app.post("/v1/webhooks/:provider", handleWebhook);
}