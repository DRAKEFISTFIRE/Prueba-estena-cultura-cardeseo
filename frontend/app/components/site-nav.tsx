"use client";

import Link from "next/link";
import { useSession } from "../lib/use-session";
import { clearSession } from "../lib/session";
import { routes } from "../lib/routes";

export function SiteNav() {
  const { session, ready } = useSession();

  return (
    <nav className="site-nav">
      <Link className="brand" href={routes.home}>
        Estrena Cultura
      </Link>

      {ready && (
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
      )}
    </nav>
  );
}