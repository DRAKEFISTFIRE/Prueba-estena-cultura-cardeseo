import { SignJWT } from "jose";
import type { TicketingAdapter, ReserveInput, ReserveResult, ConfirmResult } from "../ticketing/types.ts";
import { env } from "../config.js";

const key = new TextEncoder().encode(env.JWT_SECRET);

export const redirectAdapter: TicketingAdapter = {
  provider: "redirect",

  async reserve(input: ReserveInput): Promise<ReserveResult> {
    const redirectToken = await new SignJWT({
      type: "estrena-cultura-redirect",
      externalActivityId: input.externalActivityId,
      quantity: input.quantity,
      idempotencyKey: input.idempotencyKey,
      purchaserEmail: input.purchaserEmail
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(key);
    return { providerReservationId: redirectToken };
  },

  async confirm(_providerReservationId: string): Promise<ConfirmResult> {
  
    return { confirmed: true };
  }
};