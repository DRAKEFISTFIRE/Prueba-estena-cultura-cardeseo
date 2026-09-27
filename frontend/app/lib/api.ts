import { getSession } from "./session";

export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = getSession();

  const headers = new Headers(init.headers);

  // Solo declaramos JSON si de verdad hay body — si no, Fastify
  // rechaza la petición con "Body cannot be empty when content-type
  // is set to 'application/json'" (ej. POST .../confirm sin body).
  if (init.body !== undefined && init.body !== null) {
    headers.set("content-type", "application/json");
  }

  if (session) {
    headers.set("authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${API}${path}`, { ...init, headers });
  const data = await response.json().catch(() => null);

  return { response, data };
}