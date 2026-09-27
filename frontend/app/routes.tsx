"use client";

import { useRouter } from "next/navigation";
import { routes } from "./lib/routes";

export { routes };

export function useAppRoutes() {
  const router = useRouter();

  return {
    ...routes,

    goHome: () => router.push(routes.home),
    goLogin: () => router.push(routes.login),
    goRegister: () => router.push(routes.register),
    goActivities: () => router.push(routes.activities),
    goTickets: () => router.push(routes.tickets),
    goReservations: () => router.push(routes.reservations),
    goProfile: () => router.push(routes.profile),

    back: () => router.back(),
    refresh: () => router.refresh()
  };
}