import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { query, transaction } from "../db.js";
import { verifySession } from "../security.js";
import { audit } from "../audit.js";
import { sendPassEmail } from "../email.js";
import { appendLedgerEntry } from "../ledger.js";
import { getTicketingAdapterForVenue } from "../ticketing/registry.js";
import { issueSignedPass } from "../passes.js";
import { encryptPassToken, decryptPassToken } from "../pass-crypto.js";

function requireAuth(request: FastifyRequest, reply: FastifyReply): string | null {
  const auth = request.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!auth) {
    reply.code(401).send({ error: "No autenticado" });
    return null;
  }

  return auth;
}

export async function createReservation(request: FastifyRequest, reply: FastifyReply) {
  const auth = requireAuth(request, reply);
  if (!auth) return;

  const { userId } = await verifySession(auth);

  const body = z.object({
    activityId: z.string().uuid(),
    idempotencyKey: z.string().min(16).max(128)
  }).parse(request.body);

  const reservation = await transaction(async client => {
    const existing = await client.query(
      `SELECT * FROM reservations WHERE idempotency_key=$1`,
      [body.idempotencyKey]
    );
    if (existing.rows[0]) return existing.rows[0];

    const activity = await client.query<{
      id: string;
      external_id: string;
      provider: string;
      venue_id: string | null;
      remaining: number;
      title_ca: string;
    }>(
      `SELECT id,external_id,provider,venue_id,remaining,title_ca
       FROM activities WHERE id=$1 FOR UPDATE`,
      [body.activityId]
    );

    const a = activity.rows[0];
    if (!a) throw new Error("Actividad no encontrada");
    if (a.remaining < 2) throw new Error("No hay dos localidades disponibles");

    await client.query(
      `UPDATE activities SET remaining=remaining-2,updated_at=now() WHERE id=$1`,
      [a.id]
    );

    const inserted = await client.query(
      `INSERT INTO reservations(tutor_id,activity_id,status,quantity,idempotency_key)
       VALUES ($1,$2,'pending',2,$3) RETURNING *`,
      [userId, a.id, body.idempotencyKey]
    );

    // Resuelve el adaptador por venue (credenciales/endpoint propios
    // de ese teatro concreto) en vez de un provider global fijo.
    const adapter = await getTicketingAdapterForVenue(a.venue_id);

    const providerResult = await adapter.reserve({
      externalActivityId: a.external_id,
      quantity: 2,
      idempotencyKey: body.idempotencyKey,
      purchaserEmail: userId
    });

    const updated = await client.query(
      `UPDATE reservations
       SET provider_reservation_id=$1
       WHERE id=$2 RETURNING *`,
      [providerResult.providerReservationId, inserted.rows[0].id]
    );

    await appendLedgerEntry({
      reservationId: inserted.rows[0].id,
      entryType: "reservation_created",
      amountCents: 0,
      payload: { provider: a.provider }
    }, client);

    return updated.rows[0];
  });

  return reply.code(201).send(reservation);
}

/**
 * Lógica de confirmación compartida entre la petición HTTP directa
 * (confirmReservation) y el reintento en segundo plano vía cola
 * (retryConfirmReservation). expectedTutorId es null cuando la llama
 * el worker de la cola, porque ahí no hay usuario autenticado.
 */
async function doConfirm(reservationId: string, expectedTutorId: string | null) {
  return transaction(async client => {
    const r = await client.query<{
      id: string;
      tutor_id: string;
      activity_id: string;
      venue_id: string | null;
      provider_reservation_id: string;
      status: string;
      provider: string;
      title_ca: string;
      external_id: string;
      email: string;
    }>(
      `SELECT r.*, a.provider, a.venue_id, a.title_ca, a.external_id, t.email
       FROM reservations r
       JOIN activities a ON a.id=r.activity_id
       JOIN tutors t ON t.id=r.tutor_id
       WHERE r.id=$1 ${expectedTutorId ? "AND r.tutor_id=$2" : ""}
       FOR UPDATE`,
      expectedTutorId ? [reservationId, expectedTutorId] : [reservationId]
    );

    const row = r.rows[0];
    if (!row) throw new Error("Reserva no encontrada");
    if (row.status === "confirmed") return row;

    const adapter = await getTicketingAdapterForVenue(row.venue_id);
    await adapter.confirm(row.provider_reservation_id);

    const pass = await issueSignedPass({
      reservationId: row.id,
      activityId: row.activity_id,
      tutorId: row.tutor_id,
      quantity: 2
    });

    await client.query(
      `UPDATE reservations
       SET status='confirmed',pass_jti=$1,confirmed_at=now()
       WHERE id=$2`,
      [pass.jti, row.id]
    );

    // El token completo se guarda cifrado (BYTEA vía pgp_sym_encrypt),
    // nunca en texto plano, para poder regenerar el QR más tarde sin
    // exponer el pase en reposo.
    const encryptedToken = await encryptPassToken(pass.token);

    await client.query(
      `INSERT INTO passes(reservation_id,jti,payload,signature,token)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        row.id,
        pass.jti,
        JSON.stringify({ reservationId: row.id, activityId: row.activity_id, quantity: 2 }),
        pass.token.split(".")[2] ?? "",
        encryptedToken
      ]
    );

    await appendLedgerEntry({
      reservationId: row.id,
      entryType: "reservation_confirmed",
      amountCents: 0,
      payload: { provider: row.provider }
    }, client);

    await audit({
      actorType: "tutor",
      actorId: row.tutor_id,
      action: "reservation_confirmed",
      entityType: "reservation",
      entityId: row.id
    });

    await sendPassEmail(row.email, row.title_ca, pass.token);

    return { ...row, passToken: pass.token };
  });
}

export async function confirmReservation(request: FastifyRequest, reply: FastifyReply) {
  const auth = requireAuth(request, reply);
  if (!auth) return;

  const { userId } = await verifySession(auth);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  try {
    return await doConfirm(id, userId);
  } catch (error) {
    // Si la taquilla externa falla de forma transitoria, no rompemos
    // la petición del usuario: encolamos un reintento en segundo
    // plano y devolvemos un estado claro en vez de un 500 seco.
    request.log.error(error, "confirmReservation falló, encolando reintento");

    const { enqueueConfirmRetry } = await import("../jobs.js");
    await enqueueConfirmRetry(id);

    return reply.code(202).send({
      status: "pending_retry",
      message: "No hem pogut confirmar-ho a l'instant. Ho reintentarem automàticament."
    });
  }
}

/**
 * Invocada por el worker de pg-boss (jobs.ts) cuando reintenta una
 * confirmación que había fallado. No hay request/reply aquí.
 */
export async function retryConfirmReservation(reservationId: string) {
  await doConfirm(reservationId, null);
}

export async function listMyReservations(request: FastifyRequest, reply: FastifyReply) {
  const auth = requireAuth(request, reply);
  if (!auth) return;

  const { userId } = await verifySession(auth);

  const result = await query<{
    id: string;
    status: string;
    quantity: number;
    created_at: string;
    confirmed_at: string | null;
    pass_jti: string | null;
    activity_id: string;
    title_ca: string;
    title_es: string;
    venue_name: string;
    starts_at: string;
  }>(
    `SELECT r.id, r.status, r.quantity, r.created_at, r.confirmed_at, r.pass_jti,
            a.id AS activity_id, a.title_ca, a.title_es, a.venue_name, a.starts_at
     FROM reservations r
     JOIN activities a ON a.id = r.activity_id
     WHERE r.tutor_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );

  return result.rows;
}

export async function getPass(request: FastifyRequest, reply: FastifyReply) {
  const auth = requireAuth(request, reply);
  if (!auth) return;

  const { userId } = await verifySession(auth);
  const { id } = z.object({ id: z.string().uuid() }).parse(request.params);

  const result = await query<{ token: Buffer; status: string }>(
    `SELECT p.token, r.status
     FROM passes p
     JOIN reservations r ON r.id = p.reservation_id
     WHERE r.id = $1 AND r.tutor_id = $2`,
    [id, userId]
  );

  const row = result.rows[0];

  if (!row) {
    return reply.code(404).send({ error: "Pase no trobat" });
  }

  const token = await decryptPassToken(row.token);
  return { token };
}