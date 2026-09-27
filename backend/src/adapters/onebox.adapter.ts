import type { TicketingAdapter, ReserveInput, ReserveResult, ConfirmResult } from "../ticketing/types.js";

function notConfigured(provider: string): never {
  throw new Error(
    `Adaptador de taquilla "${provider}" no configurado todavía. ` +
    `Faltan credenciales/API de este proveedor — ver ticketing/adapters/${provider}.adapter.ts`
  );
}

export const oneboxAdapter: TicketingAdapter = {
  provider: "onebox",

  async reserve(_input: ReserveInput): Promise<ReserveResult> {
    notConfigured("onebox");
  },

  async confirm(_providerReservationId: string): Promise<ConfirmResult> {
    notConfigured("onebox");
  }
};