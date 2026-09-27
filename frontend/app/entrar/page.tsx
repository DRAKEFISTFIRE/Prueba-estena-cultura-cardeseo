"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/use-session";
import { extractToken, setSession } from "../lib/session";
import { formatApiError } from "../lib/api-errors";
import { routes } from "../lib/routes";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Tone = "error" | "success" | "info";

export default function EntrarPage() {
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { session, ready } = useSession();

  useEffect(() => {
    if (ready && session) {
      router.replace(routes.home);
    }
  }, [ready, session, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch(`${API}/v1/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: formatApiError(data, "Correu o contrasenya incorrectes."),
          tone: "error"
        });
        return;
      }

      const token = extractToken(data);

      if (!token) {
        setMessage({
          text: "No hem rebut cap sessió vàlida del servidor.",
          tone: "error"
        });
        return;
      }

      setSession(token);
      router.replace(routes.home);
    } catch {
      setMessage({
        text: "No hem pogut connectar amb el servidor.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  if (!ready || session) {
    return null;
  }

  return (
    <>
      <nav className="site-nav">
        <Link className="brand" href={routes.home}>
          Estrena Cultura
        </Link>

        <ul className="nav-links">
          <li>
            <Link className="ticket-link" href={routes.register}>
              Crear compte
            </Link>
          </li>
        </ul>
      </nav>

      <main className="panel panel--login">
        <span className="login-tag">Benvingut de nou</span>

        <h1>Entra al teu compte</h1>

        <p className="lead">
          Introdueix les teves dades per accedir a les teves
          entrades i reserves.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Correu electrònic</label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contrasenya</label>

            <div className="field-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="field-toggle"
                onClick={() => setShowPassword(value => !value)}
                aria-label={
                  showPassword ? "Amagar contrasenya" : "Mostrar contrasenya"
                }
              >
                {showPassword ? "Amagar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="field-row">
            <span />

            <button
              type="button"
              className="field-forgot"
              disabled={loading}
              onClick={() =>
                setMessage({
                  text: "Contacta amb l'organització per recuperar l'accés.",
                  tone: "info"
                })
              }
            >
              Has oblidat la contrasenya?
            </button>
          </div>

          <button className="btn btn--block" type="submit" disabled={loading}>
            {loading ? "Entrant…" : "Entrar"}
          </button>
        </form>

        {message && (
          <p className="form-message" data-tone={message.tone} role="status">
            {message.text}
          </p>
        )}

        <p className="panel-footer-note">
          Encara no tens compte? <Link href={routes.register}>Registra&apos;t</Link>
        </p>
      </main>
    </>
  );
}