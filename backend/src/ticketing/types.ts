export type TicketingProvider = "onebox" | "koobin" | "janto" | "internal" | "redirect";

export type ReserveInput = {
  externalActivityId: string;
  quantity: number;
  idempotencyKey: string;
  purchaserEmail: string;
};

export type ReserveResult = {
  providerReservationId: string;
};

export type ConfirmResult = {
  confirmed: true;
};

export interface TicketingAdapter {
  readonly provider: TicketingProvider;
  reserve(input: ReserveInput): Promise<ReserveResult>;
  confirm(providerReservationId: string): Promise<ConfirmResult>;
}