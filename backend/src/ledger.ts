import pg from "pg";
import { query } from "./db.js";

export async function appendLedgerEntry(input: {
  reservationId: string;
  entryType: string;
  amountCents: number;
  currency?: string;
  payload?: Record<string, unknown>;
}, client?: pg.PoolClient) {
  const text = `INSERT INTO ledger_entries
    (reservation_id, entry_type, amount_cents, currency, payload)
    VALUES ($1,$2,$3,$4,$5) RETURNING *`;

  const values = [
    input.reservationId,
    input.entryType,
    input.amountCents,
    input.currency ?? "EUR",
    JSON.stringify(input.payload ?? {})
  ];

  return client ? client.query(text, values) : query(text, values);
}
