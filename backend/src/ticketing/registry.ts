import { pool } from "../db.js";
import type { TicketingAdapter, TicketingProvider } from "./types.js";
import { internalAdapter } from "../adapters/internal.adapter.js";
import { redirectAdapter } from "../adapters/redirect.adapter.js";
import { createGenericHttpAdapter } from "../adapters/generic-http.adapter.js";
import { decryptCredentials } from "../venue-credentials.js";

/**
 * Resuelve el adaptador de taquilla para una venue concreta, leyendo
 * su configuración de venue_integrations. Con esto, dar de alta el
 * teatro #N cuando lleguen sus credenciales es un INSERT/UPDATE en
 * BD, no un archivo de código nuevo — salvo que su API tenga una
 * forma tan distinta que necesite un adaptador propio.
 */
export async function getTicketingAdapterForVenue(venueId: string | null): Promise<TicketingAdapter> {
  if (!venueId) {
    return internalAdapter;
  }

  const result = await pool.query<{
    provider: TicketingProvider;
    base_url: string | null;
    auth_type: "none" | "api_key" | "basic" | "oauth2";
    credentials_encrypted: Buffer | null;
    reserve_endpoint: string | null;
    confirm_endpoint: string | null;
    status: string;
  }>(
    `SELECT provider, base_url, auth_type, credentials_encrypted,
            reserve_endpoint, confirm_endpoint, status
     FROM venue_integrations WHERE venue_id = $1`,
    [venueId]
  );

  const row = result.rows[0];

  if (!row || row.provider === "internal") {
    return internalAdapter;
  }

  if (row.provider === "redirect") {
    return redirectAdapter;
  }

  if (row.status !== "active") {
    throw new Error(
      `La integración de taquilla "${row.provider}" para esta venue está en estado ` +
      `"${row.status}", no "active". Faltan credenciales/configuración por completar.`
    );
  }

  if (!row.base_url || !row.reserve_endpoint || !row.confirm_endpoint) {
    throw new Error(
      `Integración "${row.provider}" marcada como "active" pero incompleta: falta ` +
      `base_url, reserve_endpoint o confirm_endpoint en venue_integrations.`
    );
  }

  const credentials = row.credentials_encrypted
    ? await decryptCredentials(row.credentials_encrypted)
    : {};

  return createGenericHttpAdapter({
    provider: row.provider,
    baseUrl: row.base_url,
    authType: row.auth_type,
    credentials,
    reserveEndpoint: row.reserve_endpoint,
    confirmEndpoint: row.confirm_endpoint
  });
}

/**
 * Fallback simple para actividades que todavía no tienen venue_id
 * asignado (dato legado). Solo cubre los dos modos que no necesitan
 * credenciales; cualquier otro provider sin venue_id es un error de
 * datos que hay que corregir asignando la venue correspondiente.
 */
export function getTicketingAdapter(provider: string): TicketingAdapter {
  if (provider === "internal") return internalAdapter;
  if (provider === "redirect") return redirectAdapter;

  throw new Error(
    `Provider "${provider}" sin venue_id asociado no puede resolver credenciales. ` +
    `Asigna venue_id a la actividad y configura venue_integrations.`
  );
}