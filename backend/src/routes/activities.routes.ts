import type { FastifyInstance } from "fastify";
import { listActivities, getActivity } from "../controllers/activities.controller.js";

export async function activitiesRoutes(app: FastifyInstance) {
  app.get("/v1/activities", listActivities);
  app.get("/v1/activities/:id", getActivity);
}