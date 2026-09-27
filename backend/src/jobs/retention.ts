import { pool } from "../db.js";

/**
 * Los datos de tutores deben borrarse una vez cumplida su finalidad
 * (consumo de las actividades marzo-abril 2027 + plazo de conciliación).
 * Este job marca para borrado a los N meses tras confirmar una reserva,
 * y borra de verdad tras ese plazo.
 *
 * IMPORTANTE: el plazo exacto (6 meses) y la base legal deben
 * confirmarse con el cliente/DPO — este valor es un placeholder
 * razonable, no una decisión legal definitiva.
 */
const RETENTION_MONTHS = 6;

export async function scheduleRetention(): Promise<void> {
  await pool.query(
    `UPDATE tutors t
     SET scheduled_deletion_at = now() + interval '${RETENTION_MONTHS} months'
     WHERE scheduled_deletion_at IS NULL
       AND EXISTS (
         SELECT 1 FROM reservations r
         WHERE r.tutor_id = t.id AND r.status = 'confirmed'
       )`
  );
}

export async function purgeExpiredTutors(): Promise<void> {
  const result = await pool.query<{ id: string }>(
    `DELETE FROM tutors
     WHERE scheduled_deletion_at IS NOT NULL
       AND scheduled_deletion_at <= now()
     RETURNING id`
  );

  if (result.rows.length > 0) {
    console.log(`[retention] Borrados ${result.rows.length} tutores por caducidad de retención`);
  }
}