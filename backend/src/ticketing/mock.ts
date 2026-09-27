import crypto from "node:crypto";
import type { TicketingAdapter, ReserveRequest, ReservationResult } from "./types.js";

export class MockTicketingAdapter implements TicketingAdapter {
  provider = "internal" as const;

  async reserve(request: ReserveRequest): Promise<ReservationResult> {
    return {
      providerReservationId: `MOCK-${crypto.randomUUID()}`,
      status: "reserved",
      providerPayload: {
        externalActivityId: request.externalActivityId,
        quantity: request.quantity
      }
    };
  }

  async confirm(providerReservationId: string): Promise<ReservationResult> {
    return {
      providerReservationId,
      status: "confirmed",
      providerPayload: { confirmed: true }
    };
  }
}
