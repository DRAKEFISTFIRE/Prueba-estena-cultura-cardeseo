"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/use-session";
import { extractToken, setSession } from "../lib/session";
import { formatApiError, errorTargetsField } from "../lib/api-errors";
import { routes } from "../lib/routes";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const RESEND_COOLDOWN = 60;

type Step = "email" | "code" | "details" | "done";
type Tone = "error" | "success" | "info";

export default function RegistrePage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const { session, ready } = useSession();

  // Si ya hay sesión activa, no tiene sentido quedarse en /registre
  useEffect(() => {
    if (ready && session) {
      router.replace(routes.home);
    }
  }, [ready, session, router]);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown(value => value - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const submittedEmail = String(form.get("email") ?? "");

    try {
      const response = await fetch(`${API}/v1/auth/request-code`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: submittedEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: formatApiError(data, "No hem pogut enviar el codi."),
          tone: "error"
        });
        return;
      }

      setEmail(submittedEmail);
      setCooldown(RESEND_COOLDOWN);
      setMessage({
        text: `Hem enviat un codi a ${submittedEmail}.`,
        tone: "success"
      });
      setStep("code");
    } catch {
      setMessage({
        text: "No hem pogut connectar amb el servidor.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API}/v1/auth/request-code`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: formatApiError(data, "No hem pogut reenviar el codi."),
          tone: "error"
        });
        return;
      }

      setCooldown(RESEND_COOLDOWN);
      setMessage({
        text: "T'hem enviat un altre codi. El codi anterior ja no és vàlid.",
        tone: "info"
      });
    } catch {
      setMessage({
        text: "No hem pogut connectar amb el servidor.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  function continueWithCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const submittedCode = String(form.get("code") ?? "").trim();

    if (!submittedCode) {
      setMessage({
        text: "Introdueix el codi d'activació.",
        tone: "error"
      });
      return;
    }

    setActivationCode(submittedCode);
    setStep("details");
  }

  async function completeRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);

    const fullName = String(form.get("fullName") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const response = await fetch(`${API}/v1/auth/activate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          code: activationCode,
          fullName,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          text: formatApiError(data, "No hem pogut activar el compte."),
          tone: "error"
        });

        // Només tornem al pas del codi si l'error és realment sobre el codi
        if (errorTargetsField(data, "code")) {
          setStep("code");
        }

        return;
      }

      const token = extractToken(data);

      if (!token) {
        setMessage({
          text: "Compte creat correctament. Ja pots iniciar sessió.",
          tone: "success"
        });
        setStep("done");
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
            <Link className="ticket-link" href={routes.login}>
              Ja tinc compte
            </Link>
          </li>
        </ul>
      </nav>

      <main className="panel">
        <div className="ticket-steps">
          <div
            className="ticket-step"
            data-state={step === "email" ? "active" : "done"}
          >
            Correu
          </div>

          <div
            className="ticket-step"
            data-state={
              step === "code"
                ? "active"
                : step === "details" || step === "done"
                  ? "done"
                  : undefined
            }
          >
            Codi
          </div>

          <div
            className="ticket-step"
            data-state={
              step === "details"
                ? "active"
                : step === "done"
                  ? "done"
                  : undefined
            }
          >
            Dades
          </div>
        </div>

        {step === "email" && (
          <>
            <h1>Activa el teu compte</h1>

            <p className="lead">
              Introdueix el teu correu electrònic i t&apos;hi enviarem un codi
              d&apos;activació.
            </p>

            <form onSubmit={requestCode}>
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

              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Enviant…" : "Enviar el codi"}
              </button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <h1>Revisa el teu correu</h1>

            <p className="lead">
              Hem enviat un codi d&apos;activació a <strong>{email}</strong>.
              Introdueix-lo aquí sota.
            </p>

            <form onSubmit={continueWithCode}>
              <div className="field">
                <label htmlFor="code">Codi d&apos;activació</label>

                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="text"
                  autoComplete="one-time-code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="ABCD-EFGH-JKLM"
                  required
                />

                <span className="field-hint">
                  Introdueix el codi complet. Els guions són opcionals.
                </span>
              </div>

              <button className="btn" type="submit" disabled={loading}>
                Continuar
              </button>
            </form>

            <p style={{ marginTop: 16 }}>
              <button
                type="button"
                className="link-inline"
                onClick={resendCode}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0
                  ? `Reenviar codi (${cooldown}s)`
                  : "Reenviar codi"}
              </button>
            </p>
          </>
        )}

        {step === "details" && (
          <>
            <h1>Completa el teu perfil</h1>

            <p className="lead">
              Ara crea les teves dades d&apos;accés per activar el compte.
            </p>

            <form onSubmit={completeRegistration}>
              <div className="field">
                <label htmlFor="fullName">Nom i cognoms</label>

                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="password">Contrasenya</label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={12}
                  autoComplete="new-password"
                  required
                />

                <span className="field-hint">Mínim 12 caràcters.</span>
              </div>

              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Creant compte…" : "Crear compte"}
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <>
            <h1>Compte activat</h1>

            <p className="lead">
              Ja pots explorar la programació i reservar les teves dues
              entrades.
            </p>

            <Link className="btn" href={routes.login}>
              Iniciar sessió
            </Link>
          </>
        )}

        {message && (
          <p className="form-message" data-tone={message.tone} role="status">
            {message.text}
          </p>
        )}
      </main>
    </>
  );
}