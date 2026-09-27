"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./use-session";
import { routes } from "../routes";

/**
 * Úsalo al principio de cualquier página privada:
 *   const { session, ready } = useRequireAuth();
 *   if (!ready || !session) return null;
 */
export function useRequireAuth() {
  const { session, ready } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session) {
      router.replace(routes.login);
    }
  }, [ready, session, router]);

  return { session, ready };
}