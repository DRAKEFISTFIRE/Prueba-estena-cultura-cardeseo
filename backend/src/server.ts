import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { env } from "./config.js";
import { startJobs } from "./jobs.js";
import { authRoutes } from "./routes/auth.routes.js";
import { activitiesRoutes } from "./routes/activities.routes.js";
import { reservationsRoutes } from "./routes/reservations.routes.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { webhooksRoutes } from "./routes/webhooks.routes.js";
import { adminVenuesRoutes } from "./routes/admin-venues.routes.js";

const app = Fastify({
  logger: true,
  trustProxy: true
});

await app.register(helmet);
await app.register(cors, {
  origin: env.APP_BASE_URL,
  credentials: true
});

app.get("/health", async () => ({ ok: true, service: "estrena-cultura-api" }));

await app.register(authRoutes);
await app.register(activitiesRoutes);
await app.register(reservationsRoutes);
await app.register(adminRoutes);
await app.register(webhooksRoutes);
await app.register(adminVenuesRoutes);

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);

  return reply.code(400).send({
    error: error instanceof Error ? error.message : "Error"
  });
});

await startJobs();
await app.listen({ port: env.PORT, host: "0.0.0.0" });