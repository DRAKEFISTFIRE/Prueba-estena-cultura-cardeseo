"use client";

import Link from "next/link";
import { useSession } from "./lib/use-session";
import { clearSession } from "./lib/session";
import { routes } from "./lib/routes";

export default function HomePage() {
  const { session, ready } = useSession();

  if (!ready) {
    return null;
  }

  return (
    <>
      <nav className="site-nav">
        <Link className="brand" href={routes.home}>
          Estrena Cultura
        </Link>

        <ul className="nav-links">
          {session ? (
            <>
              <li>
                <Link href={routes.activities}>Activitats</Link>
              </li>

              <li>
                <Link href={routes.tickets}>Les meves entrades</Link>
              </li>

              <li>
                <Link href={routes.reservations}>Les meves reserves</Link>
              </li>

              <li>
                <button
                  type="button"
                  className="link-inline"
                  onClick={clearSession}
                >
                  Sortir
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href={routes.login}>Entrar</Link>
              </li>

              <li>
                <Link className="ticket-link" href={routes.register}>
                  Registrar-me
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <main className="home">
        {session ? (
          <>
            <section className="hero">
              <span className="eyebrow">ESTRENA CULTURA</span>

              <h1>Benvingut a Estrena Cultura.</h1>

              <p className="lead">
                El teu espai personal per descobrir activitats,
                gestionar reserves i consultar les teves entrades.
              </p>
            </section>

            <section className="home-grid">
              <Link
                className="home-card home-card-primary"
                href={routes.activities}
              >
                <span className="home-card-icon">🎭</span>

                <div>
                  <h2>Veure activitats</h2>

                  <p>
                    Descobreix la programació cultural
                    disponible i reserva les teves entrades.
                  </p>
                </div>

                <span className="home-card-arrow">→</span>
              </Link>

              <Link className="home-card" href={routes.tickets}>
                <span className="home-card-icon">🎟️</span>

                <div>
                  <h2>Les meves entrades</h2>

                  <p>
                    Consulta les entrades i els passis
                    que tens disponibles.
                  </p>
                </div>

                <span className="home-card-arrow">→</span>
              </Link>

              <Link className="home-card" href={routes.reservations}>
                <span className="home-card-icon">📋</span>

                <div>
                  <h2>Les meves reserves</h2>

                  <p>
                    Consulta les activitats que has
                    reservat i el seu estat.
                  </p>
                </div>

                <span className="home-card-arrow">→</span>
              </Link>

              <Link className="home-card" href={routes.profile}>
                <span className="home-card-icon">👤</span>

                <div>
                  <h2>El meu perfil</h2>

                  <p>Gestiona les dades del teu compte.</p>
                </div>

                <span className="home-card-arrow">→</span>
              </Link>
            </section>

            <section className="home-section">
              <div>
                <span className="eyebrow">LA TEVA EXPERIÈNCIA</span>

                <h2>Descobreix alguna cosa nova.</h2>

                <p>
                  Explora les activitats culturals disponibles
                  i reserva la teva propera experiència.
                </p>
              </div>

              <Link className="btn" href={routes.activities}>
                Explorar activitats
              </Link>
            </section>
          </>
        ) : (
          <>
            <section className="hero hero-public">
              <span className="eyebrow">ESTRENA CULTURA</span>

              <h1>
                La cultura
                <br />
                és per a tothom.
              </h1>

              <p className="lead">
                Descobreix activitats culturals, reserva les
                teves entrades i viu noves experiències.
              </p>

              <div className="hero-actions">
                <Link className="btn" href={routes.register}>
                  Crear compte
                </Link>

                <Link className="btn-secondary" href={routes.login}>
                  Ja tinc compte
                </Link>
              </div>
            </section>

            <section className="home-grid">
              <div className="home-card">
                <span className="home-card-icon">🎭</span>

                <div>
                  <h2>Activitats</h2>

                  <p>Consulta la programació cultural disponible.</p>
                </div>
              </div>

              <div className="home-card">
                <span className="home-card-icon">🎟️</span>

                <div>
                  <h2>Entrades</h2>

                  <p>Reserva dues entrades per activitat.</p>
                </div>
              </div>

              <div className="home-card">
                <span className="home-card-icon">✨</span>

                <div>
                  <h2>La teva experiència</h2>

                  <p>Gestiona les teves reserves des del teu compte.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}