import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "../config.js";
import { audit } from "../audit.js";
import { enqueueWebhookProcess } from "../jobs.js";

export async function handleWebhook(request: FastifyRequest, reply: FastifyReply) {
  const signature = request.headers["x-estrena-signature"];
  if (signature !== env.WEBHOOK_SECRET) {
    return reply.code(401).send({ error: "Invalid signature" });
  }

  const provider = z.enum(["onebox", "koobin", "janto"]).parse(
    (request.params as { provider: string }).provider
  );

  await audit({
    actorType: "provider",
    action: "webhook_received",
    entityType: "provider_webhook",
    metadata: { provider, body: request.body }
  });

  await enqueueWebhookProcess(provider, request.body);

  return { received: true };
}