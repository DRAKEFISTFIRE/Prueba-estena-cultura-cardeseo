import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { query } from "../db.js";

/**
 * Auth mínima: header x-admin-key contra process.env.ADMIN_API_KEY.
 * Esto NO es RBAC real ni sustituye a Payload CMS — es un candado
 * de un solo nivel para poder gestionar venues mientras no exista
 * el backoffice completo. Cuando llegue Payload, esto se retira.
 */
function requireAdminKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const key = request.headers["x-admin-key"];

  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) {
    reply.code(401).send({ error: "No autoritzat" });
    return false;
  }

  return true;
}

const TICKETING_PROVIDERS = ["internal", "onebox", "koobin", "janto", "redirect"] as const;

export async function listVenues(request: FastifyRequest, reply: FastifyReply) {
  if (!requireAdminKey(request, reply)) return;

  const result = await query(
    `SELECT id, name, district, contact_email, contact_phone, ticketing_provider, created_at
     FROM venues ORDER BY name ASC`
  );

  return result.rows;
}

export async function createVenue(request: FastifyRequest, reply: FastifyReply) {
  if (!requireAdminKey(request, reply)) return;

  const body = z.object({
    name: z.string().min(2).max(160),
    district: z.string().min(2).max(80),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(40).optional(),
    ticketingProvider: z.enum(TICKETING_PROVIDERS).default("internal")
  }).parse(request.body);

  const result = await query<{ id: string }>(
    `INSERT INTO venues(name, district, contact_email, contact_phone, ticketing_provider)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [body.name, body.district, body.contactEmail ?? null, body.contactPhone ?? null, body.ticketingProvider]
  );

  return reply.code(201).send({ id: result.rows[0]!.id });
}

export async function updateVenue(request: FastifyRequest, reply: FastifyReply) {
  if (!requireAdminKey(request, reply)) return;

  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  const body = z.object({
    name: z.string().min(2).max(160).optional(),
    district: z.string().min(2).max(80).optional(),
    contactEmail: z.string().email().nullable().optional(),
    contactPhone: z.string().max(40).nullable().optional(),
    ticketingProvider: z.enum(TICKETING_PROVIDERS).optional()
  }).parse(request.body);

  const result = await query(
    `UPDATE venues SET
       name = COALESCE($2, name),
       district = COALESCE($3, district),
       contact_email = COALESCE($4, contact_email),
       contact_phone = COALESCE($5, contact_phone),
       ticketing_provider = COALESCE($6, ticketing_provider),
       updated_at = now()
     WHERE id = $1
     RETURNING id`,
    [id, body.name, body.district, body.contactEmail, body.contactPhone, body.ticketingProvider]
  );

  if (!result.rows[0]) {
    return reply.code(404).send({ error: "Venue no trobat" });
  }

  return { ok: true };
}