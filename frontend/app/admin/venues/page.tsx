"use client";

import { FormEvent, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Venue = {
  id: string;
  name: string;
  district: string;
  contact_email: string | null;
  ticketing_provider: string;
};

export default function AdminVenuesPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(key: string) {
    const response = await fetch(`${API}/v1/admin/venues`, {
      headers: { "x-admin-key": key }
    });

    if (!response.ok) {
      setError("Clau incorrecta o error de servidor.");
      setAuthed(false);
      return;
    }

    setVenues(await response.json());
    setAuthed(true);
    setError(null);
  }

  async function createVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await fetch(`${API}/v1/admin/venues`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({
        name: form.get("name"),
        district: form.get("district"),
        ticketingProvider: form.get("ticketingProvider")
      })
    });

    if (response.ok) {
      (event.target as HTMLFormElement).reset();
      load(adminKey);
    }
  }

  if (!authed) {
    return (
      <main className="panel">
        <h1>Backoffice — Venues</h1>
        <p className="lead">
          Aquest és un panell mínim, no és Payload CMS. Introdueix la
          clau d&apos;administració.
        </p>

        <div className="field">
          <label htmlFor="adminKey">Clau d&apos;admin</label>
          <input
            id="adminKey"
            type="password"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
          />
        </div>

        <button className="btn" type="button" onClick={() => load(adminKey)}>
          Entrar
        </button>

        {error && (
          <p className="form-message" data-tone="error">{error}</p>
        )}
      </main>
    );
  }

  return (
    <main className="home">
      <h1>Venues ({venues.length})</h1>

      <form onSubmit={createVenue} className="panel" style={{ margin: "24px 0" }}>
        <div className="field">
          <label htmlFor="name">Nom del teatre/sala</label>
          <input id="name" name="name" required />
        </div>

        <div className="field">
          <label htmlFor="district">Districte</label>
          <input id="district" name="district" required />
        </div>

        <div className="field">
          <label htmlFor="ticketingProvider">Plataforma de taquilla</label>
          <select id="ticketingProvider" name="ticketingProvider" defaultValue="internal">
            <option value="internal">Internal (propi)</option>
            <option value="onebox">Onebox</option>
            <option value="koobin">Koobin</option>
            <option value="janto">Janto</option>
          </select>
        </div>

        <button className="btn" type="submit">Crear venue</button>
      </form>

      <div className="ticket-list">
        {venues.map(v => (
          <div key={v.id} className="activity-ticket">
            <div>
              <h3>{v.name}</h3>
              <p className="activity-meta">{v.district}</p>
              <p className="activity-meta">Taquilla: {v.ticketing_provider}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}