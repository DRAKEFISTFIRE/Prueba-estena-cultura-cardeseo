"use client";

import { useEffect, useState } from "react";
import { getSession, Session, SESSION_EVENT } from "./session";

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function sync() {
      setSessionState(getSession());
    }

    sync();
    setReady(true);

    // Se actualiza al instante en esta pestaña (login/logout)
    window.addEventListener(SESSION_EVENT, sync);
    // Y también si cambia en otra pestaña
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { session, ready };
}