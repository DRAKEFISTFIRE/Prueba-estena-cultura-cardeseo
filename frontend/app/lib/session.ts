export type Session = {
  token: string;
  expiresAt: number | null;
};

const STORAGE_KEY = "estrena_token";
export const SESSION_EVENT = "estrena:session-changed";

function decodeToken(token: string): Session | null {
  const parts = token.split(".");

  // Token opaco (no JWT): lo damos por válido tal cual venga del backend
  if (parts.length !== 3) {
    return { token, expiresAt: null };
  }

  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
        .padEnd(Math.ceil(parts[1].length / 4) * 4, "=")
    );

    const expiresAt =
      typeof payload.exp === "number" ? payload.exp * 1000 : null;

    if (expiresAt && expiresAt <= Date.now()) {
      return null;
    }

    return { token, expiresAt };
  } catch {
    // JWT con forma pero payload ilegible: lo tratamos igualmente como sesión válida
    return { token, expiresAt: null };
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = localStorage.getItem(STORAGE_KEY);

  if (!token) {
    return null;
  }

  const session = decodeToken(token);

  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SESSION_EVENT));
    return null;
  }

  return session;
}

export function setSession(token: string) {
  localStorage.setItem(STORAGE_KEY, token);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/**
 * El backend puede devolver el token de sesión bajo distintos nombres
 * de campo según el endpoint; centralizamos la búsqueda aquí.
 */
export function extractToken(data: unknown): string | null {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.token === "string") return obj.token;
    if (typeof obj.accessToken === "string") return obj.accessToken;
    if (typeof obj.jwt === "string") return obj.jwt;
  }

  return null;
}