import { pool } from "./db.js";
import { env } from "./config.js";

/**
 * Cifra/descifra el token del pase usando pgcrypto (pgp_sym_encrypt),
 * con la clave en env.PASS_ENCRYPTION_KEY — NUNCA hardcodeada ni la
 * misma que JWT_SECRET. Añade PASS_ENCRYPTION_KEY a tu .env con un
 * valor largo y aleatorio distinto de cualquier otro secreto.
 */
export async function encryptPassToken(token: string): Promise<Buffer> {
  const result = await pool.query<{ encrypted: Buffer }>(
    `SELECT pgp_sym_encrypt($1, $2) AS encrypted`,
    [token, env.PASS_ENCRYPTION_KEY]
  );
  return result.rows[0]!.encrypted;
}

export async function decryptPassToken(encrypted: Buffer): Promise<string> {
  const result = await pool.query<{ decrypted: string }>(
    `SELECT pgp_sym_decrypt($1, $2) AS decrypted`,
    [encrypted, env.PASS_ENCRYPTION_KEY]
  );
  return result.rows[0]!.decrypted;
}