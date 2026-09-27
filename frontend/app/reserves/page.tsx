"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { SiteNav } from "../components/site-nav";
import { useRequireAuth } from "../lib/use-require-auth";
import { apiFetch } from "../lib/api";
import { formatApiError } from "../lib/api-errors";

type Reservation = {
  id: string;
  status: string;
  quantity: number;
  confirmed_at: string | null;
  title_ca: string;
  venue_name: string;
  starts_at: string;
};

export default function EntradesPage() {
  const { session, ready } = useRequireAuth();
  const [tickets, setTickets] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrById, setQrById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ready || !session) return;

    let cancelled = false;

    async function load() {
      const { response, data } = await apiFetch("/v1/reservations");

      if (cancelled) return;

      if (!response.ok) {
        setError(formatApiError(data, "No hem pogut carregar les entrades."));
        return;
      }

      const confirmed = (data as Reservation[]).filter(r => r.status === "confirmed");
      setTickets(confirmed);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [ready, session]);

  async function showQr(reservationId: string) {
    if (qrById[reservationId]) return;

    const { response, data } = await apiFetch(`/v1/reservations/${reservationId}/pass`);

    if (!response.ok) {
      setError(formatApiError(data, "No hem pogut recuperar el pase."));
      return;
    }

    const dataUrl = await QRCode.toDataURL(data.token, { width: 220, margin: 1 });
    setQrById(prev => ({ ...prev, [reservationId]: dataUrl }));
  }

  if (!ready || !session) {
    return null;
  }

  return (
    <>
      <SiteNav />

      <main className="home">
        <section className="hero" style={{ padding: "48px 0 32px", color: "var(--paper)" }}>
          <span className="eyebrow">ENTRADES</span>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>Les meves entrades</h1>
        </section>

        {error && (
          <p className="form-message" data-tone="error" role="status">
            {error}
          </p>
        )}

        {!error && !tickets && <p className="lead">Carregant entrades…</p>}

        {tickets && tickets.length === 0 && (
          <p className="lead">
            Encara no tens cap entrada confirmada.
          </p>
        )}

        {tickets && tickets.length > 0 && (
          <div className="ticket-list">
            {tickets.map(t => (
              <div key={t.id} className="activity-ticket">
                <div>
                  <div className="activity-discipline">
                    {t.quantity} {t.quantity === 1 ? "entrada" : "entrades"}
                  </div>
                  <h3>{t.title_ca}</h3>
                  <p className="activity-meta">{t.venue_name}</p>
                  <p className="activity-meta">
                    {new Date(t.starts_at).toLocaleString("ca-ES", {
                      dateStyle: "long",
                      timeStyle: "short"
                    })}
                  </p>

                  {qrById[t.id] ? (
                    <img
                      src={qrById[t.id]}
                      alt="Codi QR de l'entrada"
                      style={{ marginTop: 12, border: "2.5px solid var(--ink)", borderRadius: 4 }}
                    />
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      style={{ marginTop: 12, padding: "10px 16px", fontSize: "0.85rem" }}
                      onClick={() => showQr(t.id)}
                    >
                      Mostrar QR
                    </button>
                  )}
                </div>

                <div className="tear" />

                <div className="activity-seats">
                  <span className="activity-status" data-available="true">
                    Confirmada
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}