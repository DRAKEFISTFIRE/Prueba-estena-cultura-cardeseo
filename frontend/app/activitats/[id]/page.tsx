"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteNav } from "../../components/site-nav";
import { useRequireAuth } from "../../lib/use-require-auth";
import { apiFetch } from "../../lib/api";
import { formatApiError } from "../../lib/api-errors";
import { routes } from "../../lib/routes";

type ActivityDetail = {
  id: string;
  title_ca: string;
  description_ca: string;
  venue_name: string;
  district: string;
  discipline: string;
  starts_at: string;
  remaining: number;
};

type Tone = "error" | "success" | "info";

export default function ActivityDetailPage() {
  const { session, ready } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (!ready || !session || !params.id) return;

    let cancelled = false;

    async function load() {
      const { response, data } = await apiFetch(`/v1/activities/${params.id}`);

      if (cancelled) return;

      if (!response.ok) {
        setLoadError(formatApiError(data, "No hem trobat aquesta activitat."));
        return;
      }

      setActivity(data as ActivityDetail);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ready, session, params.id]);

  async function reserve() {
    if (!activity) return;

    setReserving(true);
    setMessage(null);

    try {
      const { response, data } = await apiFetch("/v1/reservations", {
        method: "POST",
        body: JSON.stringify({
          activityId: activity.id,
          idempotencyKey: crypto.randomUUID()
        })
      });

      if (!response.ok) {
        setMessage({
          text: formatApiError(data, "No hem pogut fer la reserva."),
          tone: "error"
        });
        return;
      }

      setMessage({
        text: "Reserva creada. Ja la pots confirmar des de «Les meves reserves».",
        tone: "success"
      });

      setTimeout(() => router.push(routes.reservations), 1200);
    } catch {
      setMessage({
        text: "No hem pogut connectar amb el servidor.",
        tone: "error"
      });
    } finally {
      setReserving(false);
    }
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <>
      <SiteNav />

      <main className="panel" style={{ maxWidth: 620 }}>
        {loadError && (
          <p className="form-message" data-tone="error" role="status">
            {loadError}
          </p>
        )}

        {!loadError && !activity && <p className="lead">Carregant activitat…</p>}

        {activity && (
          <>
            <div className="activity-discipline">{activity.discipline}</div>
            <h1>{activity.title_ca}</h1>

            <p className="lead">{activity.description_ca}</p>

            <p className="activity-meta">
              📍 {activity.venue_name} · {activity.district}
            </p>

            <p className="activity-meta">
              🗓️{" "}
              {new Date(activity.starts_at).toLocaleString("ca-ES", {
                dateStyle: "long",
                timeStyle: "short"
              })}
            </p>

            <p className="activity-meta" style={{ marginBottom: 24 }}>
              🎟️ {activity.remaining} places lliures
            </p>

            <button
              className="btn btn--block"
              type="button"
              onClick={reserve}
              disabled={reserving || activity.remaining < 2}
            >
              {reserving
                ? "Reservant…"
                : activity.remaining < 2
                  ? "Sense places suficients"
                  : "Reservar 2 entrades"}
            </button>

            {message && (
              <p className="form-message" data-tone={message.tone} role="status">
                {message.text}
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}