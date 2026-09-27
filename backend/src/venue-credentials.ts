import { pool } from "./db.js";
import { env } from "./config.js";

export type VenueCredentials = Record<string, string>;

export async function encryptCredentials(creds: VenueCredentials): Promise<Buffer> {
  const result = await pool.query<{ encrypted: Buffer }>(
    `SELECT pgp_sym_encrypt($1, $2) AS encrypted`,
    [JSON.stringify(creds), env.PASS_ENCRYPTION_KEY]
  );
  return result.rows[0]!.encrypted;
}

export async function decryptCredentials(encrypted: Buffer): Promise<VenueCredentials> {
  const result = await pool.query<{ decrypted: string }>(
    `SELECT pgp_sym_decrypt($1, $2) AS decrypted`,
    [encrypted, env.PASS_ENCRYPTION_KEY]
  );
  return JSON.parse(result.rows[0]!.decrypted);
}