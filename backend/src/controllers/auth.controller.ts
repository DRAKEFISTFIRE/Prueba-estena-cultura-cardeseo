import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { query, transaction } from "../db.js";
import {
  createSession,
  generateRegistrationCode,
  hashPassword,
  hashRegistrationCode,
  normalizeRegistrationCode,
  validCheckDigit,
  verifyPassword
} from "../security.js";
import { audit } from "../audit.js";
import { sendRegistrationCodeEmail } from "../email.js";

export async function requestCode(request: FastifyRequest, reply: FastifyReply) {
  const body = z.object({
    email: z.string().email()
  }).parse(request.body);

  const code = generateRegistrationCode();
  const normalized = normalizeRegistrationCode(code);

  await query(
    `INSERT INTO registration_codes(code_hash,code_last4,status,created_by)
     VALUES ($1,$2,'active','self-service')`,
    [hashRegistrationCode(normalized), normalized.slice(-4)]
  );

  await sendRegistrationCodeEmail(body.email, code);

  await audit({
    actorType: "system",
    action: "registration_code_requested",
    entityType: "registration_code",
    metadata: { recipient: body.email }
  });

  return reply.code(201).send({ ok: true });
}

export async function activate(request: FastifyRequest, reply: FastifyReply) {
  const body = z.object({
    code: z.string().min(12),
    email: z.string().email(),
    fullName: z.string().min(2).max(160),
    password: z.string().min(12).max(128),
    // RGPD: sin este campo en true, Zod rechaza la petición antes de
    // tocar la BD. El frontend debe mandarlo solo cuando el usuario
    // marca el checkbox de política de privacidad.
    consentAccepted: z
      .boolean()
      .refine(val => val === true, {
        message: "Cal acceptar la política de privacitat"
      })
  }).parse(request.body);

  const normalized = normalizeRegistrationCode(body.code);
  if (!validCheckDigit(normalized)) {
    return reply.code(400).send({ error: "Código no válido" });
  }

  const codeHash = hashRegistrationCode(normalized);

  const result = await transaction(async client => {
    const code = await client.query<{
      id: string;
      status: string;
    }>(
      `SELECT id,status FROM registration_codes
       WHERE code_hash=$1
       FOR UPDATE`,
      [codeHash]
    );

    const row = code.rows[0];
    if (!row || row.status !== "active") {
      throw new Error("Código no disponible");
    }

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM tutors WHERE lower(email)=lower($1)`,
      [body.email]
    );

    let tutorId = existing.rows[0]?.id;
    if (!tutorId) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO tutors(email,password_hash,full_name,consent_accepted_at)
         VALUES ($1,$2,$3,now()) RETURNING id`,
        [body.email.toLowerCase(), await hashPassword(body.password), body.fullName]
      );
      tutorId = inserted.rows[0]!.id;
    }

    await client.query(
      `UPDATE registration_codes
       SET status='used', tutor_id=$1, activated_at=now()
       WHERE id=$2`,
      [tutorId, row.id]
    );

    await client.query(
      `INSERT INTO audit_log(actor_type,actor_id,action,entity_type,entity_id,metadata)
       VALUES ('tutor',$1,'registration_activated','registration_code',$2,$3)`,
      [tutorId, row.id, JSON.stringify({ email: body.email.toLowerCase() })]
    );

    return tutorId;
  });

  const token = await createSession(result);
  return reply.send({ token });
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const body = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }).parse(request.body);

  const result = await query<{
    id: string;
    password_hash: string;
  }>(
    `SELECT id,password_hash FROM tutors WHERE lower(email)=lower($1)`,
    [body.email]
  );

  const user = result.rows[0];
  if (!user || !(await verifyPassword(user.password_hash, body.password))) {
    return reply.code(401).send({ error: "Credenciales no válidas" });
  }

  return { token: await createSession(user.id) };
}