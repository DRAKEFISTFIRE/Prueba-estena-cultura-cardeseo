import Link from "next/link";

export default function Home() {
  return (
    <>
      <nav className="site-nav">
        <span className="brand">Estrena Cultura</span>
        <ul className="nav-links">
          <li>
            <Link className="ticket-link" href="/activitats">Activitats</Link>
          </li>
          <li>
            <Link className="ticket-link" href="/registre">Registre</Link>
          </li>
          <li>
            <Link className="ticket-link" href="/entrar">Entrar</Link>
          </li>
        </ul>
      </nav>

      <header className="hero">
        <span className="hero-tag">Bo cultural per a joves de 14 anys</span>
        <h1>
          <span className="line">Estrena</span>
          <span className="line line--outline">cultura</span>
        </h1>
        <p className="lead">
          Tria un espectacle, activa el teu compte amb un codi que t&apos;enviem per correu
          i reserva dues entrades: la teva i la d&apos;algú que vulguis portar.
        </p>
        <div className="hero-actions">
          <Link className="btn" href="/registre">Activar el meu compte</Link>
          <Link className="btn btn--ghost" href="/activitats">Veure activitats</Link>
        </div>
      </header>

      <section className="steps">
        <div className="container">
          <h2>Com funciona</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Activa el compte</h3>
              <p>Introdueix el teu correu i rebràs un codi de sis xifres per confirmar-lo.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Tria una activitat</h3>
              <p>Teatre, música, cinema o art: explora la programació disponible aquest mes.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Reserva dues entrades</h3>
              <p>Cada bo dona dret a dues localitats. Convida qui vulguis a viure-ho amb tu.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        Estrena Cultura és un programa impulsat per entitats culturals de Barcelona.
      </footer>
    </>
  );
}