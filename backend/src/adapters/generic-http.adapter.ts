import type { TicketingAdapter, ReserveInput, ReserveResult, ConfirmResult, TicketingProvider } from "../ticketing/types.ts";
import type { VenueCredentials } from "../venue-credentials.js";

type GenericConfig = {
  provider: TicketingProvider;
  baseUrl: string;
  authType: "none" | "api_key" | "basic" | "oauth2";
  credentials: VenueCredentials;
  reserveEndpoint: string;
  confirmEndpoint: string;
};

function buildAuthHeaders(config: GenericConfig): Record<string, string> {
  switch (config.authType) {
    case "api_key":
      // Convención asumida: header "X-Api-Key". Si el teatro real usa
      // otro nombre de header, es el único cambio necesario aquí.
      return { "X-Api-Key": config.credentials.apiKey ?? "" };

    case "basic": {
      const raw = `${config.credentials.username}:${config.credentials.password}`;
      return { Authorization: `Basic ${Buffer.from(raw).toString("base64")}` };
    }

    case "oauth2":
      // Placeholder: el flujo real de OAuth2 (client_credentials,
      // refresh, etc.) depende de cada plataforma y hay que
      // implementarlo cuando llegue la documentación concreta.
      return { Authorization: `Bearer ${config.credentials.accessToken ?? ""}` };

    default:
      return {};
  }
}

/**
 * Adaptador genérico por configuración: NO asume la forma exacta del
 * request/response de ninguna taquilla real. Envía un payload
 * razonable y espera un campo `id` o `reservationId` en la respuesta.
 * Cuando llegue la documentación real de un proveedor, lo correcto es
 * revisar si su forma encaja aquí o si necesita mapeo específico
 * (en cuyo caso se añade un `adapters/<provider>.adapter.ts` propio
 * que reemplace a este solo para esa venue).
 */
export function createGenericHttpAdapter(config: GenericConfig): TicketingAdapter {
  return {
    provider: config.provider,

    async reserve(input: ReserveInput): Promise<ReserveResult> {
      const response = await fetch(`${config.baseUrl}${config.reserveEndpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...buildAuthHeaders(config)
        },
        body: JSON.stringify({
          activityId: input.externalActivityId,
          quantity: input.quantity,
          idempotencyKey: input.idempotencyKey,
          purchaserEmail: input.purchaserEmail
        })
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Fallo al reservar en taquilla externa "${config.provider}" (${response.status}): ${text}`
        );
      }

      const data = await response.json();
      const providerReservationId = data.id ?? data.reservationId;

      if (!providerReservationId) {
        throw new Error(
          `La respuesta de la taquilla "${config.provider}" no incluye un id de reserva reconocible. ` +
          `Revisar el formato real y ajustar el mapeo en generic-http.adapter.ts.`
        );
      }

      return { providerReservationId };
    },

    async confirm(providerReservationId: string): Promise<ConfirmResult> {
      const response = await fetch(
        `${config.baseUrl}${config.confirmEndpoint}/${providerReservationId}/confirm`,
        {
          method: "POST",
          headers: buildAuthHeaders(config)
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Fallo al confirmar en taquilla externa "${config.provider}" (${response.status}): ${text}`
        );
      }

      return { confirmed: true };
    }
  };
}