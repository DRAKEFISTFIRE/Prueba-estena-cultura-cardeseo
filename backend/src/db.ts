import pg from "pg";
import { env } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  ssl: env.NODE_ENV === "production"
    ? { rejectUnauthorized: true }
    : false
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  return pool.query<T>(text, values);
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await fn(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}