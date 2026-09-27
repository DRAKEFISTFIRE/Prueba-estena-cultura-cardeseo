// koobin.adapter.ts
import type { TicketingAdapter, ReserveInput, ReserveResult, ConfirmResult } from "../ticketing/types.js";

function notConfigured(provider: string): never {
  throw new Error(
    `Adaptador de taquilla "${provider}" no configurado todavía. ` +
    `Faltan credenciales/API de este proveedor — ver ticketing/adapters/${provider}.adapter.ts`
  );
}

export const koobinAdapter: TicketingAdapter = {
  provider: "koobin",

  async reserve(_input: ReserveInput): Promise<ReserveResult> {
    notConfigured("koobin");
  },

  async confirm(_providerReservationId: string): Promise<ConfirmResult> {
    notConfigured("koobin");
  }
};