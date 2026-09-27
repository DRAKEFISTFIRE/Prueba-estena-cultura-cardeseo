import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { query, transaction } from "../db.js";
import { generateRegistrationCode, hashRegistrationCode, normalizeRegistrationCode } from "../security.js";
import { audit } from "../audit.js";
import { sendRegistrationCodeEmail } from "../email.js";

export async function issueCode(request: FastifyRequest, reply: FastifyReply) {
  const body = z.object({
    email: z.string().email()
  }).parse(request.body);

  // En producción, proteger esta ruta con RBAC de administración + mTLS/VPN/SSO.
  const code = generateRegistrationCode();
  const normalized = normalizeRegistrationCode(code);

  await query(
    `INSERT INTO registration_codes(code_hash,code_last4,status,created_by)
     VALUES ($1,$2,'active','admin')`,
    [hashRegistrationCode(normalized), normalized.slice(-4)]
  );

  await sendRegistrationCodeEmail(body.email, code);

  await audit({
    actorType: "admin",
    action: "registration_code_issued",
    entityType: "registration_code",
    metadata: { recipient: body.email }
  });

  return reply.code(201).send({ ok: true });
}

export async function reissueCode(request: FastifyRequest, _reply: FastifyReply) {
  const body = z.object({
    oldCode: z.string().min(12),
    email: z.string().email()
  }).parse(request.body);

  const oldNormalized = normalizeRegistrationCode(body.oldCode);
  const oldHash = hashRegistrationCode(oldNormalized);

  const newCode = generateRegistrationCode();
  const newNormalized = normalizeRegistrationCode(newCode);

  await transaction(async client => {
    const old = await client.query<{ id: string }>(
      `SELECT id FROM registration_codes WHERE code_hash=$1 FOR UPDATE`,
      [oldHash]
    );

    if (old.rows[0]) {
      await client.query(
        `UPDATE registration_codes SET status='revoked', revoked_at=now()
         WHERE id=$1`,
        [old.rows[0].id]
      );
    }

    await client.query(
      `INSERT INTO registration_codes(code_hash,code_last4,status,created_by)
       VALUES ($1,$2,'active','admin')`,
      [hashRegistrationCode(newNormalized), newNormalized.slice(-4)]
    );
  });

  await sendRegistrationCodeEmail(body.email, newCode);
  return { ok: true };
}