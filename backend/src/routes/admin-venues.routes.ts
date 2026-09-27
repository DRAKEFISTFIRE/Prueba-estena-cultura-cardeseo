import type { FastifyInstance } from "fastify";
import { listVenues, createVenue, updateVenue } from "../controllers/admin-venues.controller.js";

export async function adminVenuesRoutes(app: FastifyInstance) {
  app.get("/v1/admin/venues", listVenues);
  app.post("/v1/admin/venues", createVenue);
  app.patch("/v1/admin/venues/:id", updateVenue);
}