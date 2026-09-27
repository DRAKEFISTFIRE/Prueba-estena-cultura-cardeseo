import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { query } from "../db.js";

export async function listActivities(request: FastifyRequest, _reply: FastifyReply) {
  const queryParams = z.object({
    district: z.string().optional(),
    discipline: z.string().optional(),
    locale: z.enum(["ca", "es"]).default("ca")
  }).parse(request.query);

  const result = await query(
    `SELECT id,external_id,venue_name,title_ca,title_es,description_ca,description_es,
            district,discipline,starts_at,ends_at,remaining,provider,provider_url
     FROM activities
     WHERE status='published'
       AND ($1::text IS NULL OR district=$1)
       AND ($2::text IS NULL OR discipline=$2)
       AND starts_at >= now()
     ORDER BY starts_at ASC`,
    [queryParams.district ?? null, queryParams.discipline ?? null]
  );

  return result.rows.map(row => ({
    ...row,
    title: queryParams.locale === "es" ? row.title_es : row.title_ca,
    description: queryParams.locale === "es" ? row.description_es : row.description_ca
  }));
}

export async function getActivity(request: FastifyRequest, reply: FastifyReply) {
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  const result = await query(
    `SELECT * FROM activities WHERE id=$1 AND status='published'`,
    [id]
  );

  if (!result.rows[0]) {
    return reply.code(404).send({ error: "Actividad no encontrada" });
  }

  return result.rows[0];
}