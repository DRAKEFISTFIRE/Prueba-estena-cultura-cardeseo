import { randomUUID } from "node:crypto";
import type { TicketingAdapter, ReserveInput, ReserveResult, ConfirmResult } from "../ticketing/types.js";

export const internalAdapter: TicketingAdapter = {
  provider: "internal",

  async reserve(_input: ReserveInput): Promise<ReserveResult> {
    // Emisión propia: no hay sistema externo que reserve cupo por nosotros,
    // el cupo ya se descontó en la transacción de /v1/reservations.
    return { providerReservationId: `internal-${randomUUID()}` };
  },

  async confirm(_providerReservationId: string): Promise<ConfirmResult> {
    // La confirmación real (QR firmado) la emite issueSignedPass() en el controller,
    // aquí solo confirmamos que no hay taquilla externa que rechazar.
    return { confirmed: true };
  }
};