"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteNav } from "../components/site-nav";
import { useRequireAuth } from "../lib/use-require-auth";
import { apiFetch } from "../lib/api";
import { routes } from "../lib/routes";

type Activity = {
  id: string;
  title: string;
  description: string;
  venue_name: string;
  district: string;
  discipline: string;
  starts_at: string;
  remaining: number;
};

export default function ActivitatsPage() {
  const { session, ready } = useRequireAuth();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !session) return;

    let cancelled = false;

    async function load() {
      const { response, data } = await apiFetch("/v1/activities?locale=ca");

      if (cancelled) return;

      if (!response.ok) {
        setError("No hem pogut carregar les activitats.");
        return;
      }

      setActivities(data as Activity[]);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ready, session]);

  if (!ready || !session) {
    return null;
  }

  return (
    <>
      <SiteNav />

      <main className="home">
        <section className="hero" style={{ padding: "48px 0 32px", color: "var(--paper)" }}>
          <span className="eyebrow">PROGRAMACIÓ</span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>Activitats disponibles</h1>
          <p className="lead">
            Reserva dues entrades per a qualsevol de les activitats
            culturals que trobaràs aquí sota.
          </p>
        </section>

        {error && (
          <p className="form-message" data-tone="error" role="status">
            {error}
          </p>
        )}

        {!error && !activities && <p className="lead">Carregant activitats…</p>}

        {activities && activities.length === 0 && (
          <p className="lead">
            Ara mateix no hi ha cap activitat publicada. Torna-ho a provar
            més endavant.
          </p>
        )}

        {activities && activities.length > 0 && (
          <div className="ticket-list">
            {activities.map(activity => (
              <Link
                key={activity.id}
                href={`${routes.activities}/${activity.id}`}
                className="activity-ticket"
              >
                <div>
                  <div className="activity-discipline">{activity.discipline}</div>
                  <h3>{activity.title}</h3>
                  <p className="activity-meta">{activity.venue_name} · {activity.district}</p>
                  <p className="activity-meta">
                    {new Date(activity.starts_at).toLocaleString("ca-ES", {
                      dateStyle: "long",
                      timeStyle: "short"
                    })}
                  </p>
                </div>

                <div className="tear" />

                <div className="activity-seats">
                  <span className="seat-count">{activity.remaining}</span>
                  <span className="seat-label">places lliures</span>
                  <span
                    className="activity-status"
                    data-available={activity.remaining >= 2}
                  >
                    {activity.remaining >= 2 ? "Disponible" : "Sense places"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}