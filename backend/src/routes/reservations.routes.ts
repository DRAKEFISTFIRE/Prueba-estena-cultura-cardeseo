import type { FastifyInstance } from "fastify";
import {
  createReservation,
  confirmReservation,
  listMyReservations,
  getPass
} from "../controllers/reservations.controller.js";

export async function reservationsRoutes(app: FastifyInstance) {
  app.get("/v1/reservations", listMyReservations);
  app.post("/v1/reservations", createReservation);
  app.post("/v1/reservations/:id/confirm", confirmReservation);
  app.get("/v1/reservations/:id/pass", getPass);
}