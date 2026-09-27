"use client";

import { FormEvent, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function ActivarPage() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await fetch(`${API}/v1/auth/activate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        email: form.get("email"),
        fullName: form.get("fullName"),
        password: form.get("password")
      })
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "No se ha podido activar la cuenta.");
      return;
    }

    localStorage.setItem("estrena_token", data.token);
    setMessage("Cuenta activada correctamente.");
  }

  return (
    <main>
      <h1>Activar cuenta</h1>
      <p>Introduce el código que has recibido por correo postal.</p>

      <form onSubmit={submit}>
        <label>
          Código
          <input name="code" autoComplete="one-time-code" required />
        </label>
        <br />
        <label>
          Nombre y apellidos del tutor
          <input name="fullName" autoComplete="name" required />
        </label>
        <br />
        <label>
          Correo electrónico
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <br />
        <label>
          Contraseña
          <input name="password" type="password" minLength={12} autoComplete="new-password" required />
        </label>
        <br />
        <button type="submit">Activar cuenta</button>
      </form>

      <p role="status">{message}</p>
    </main>
  );
}
