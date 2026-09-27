export type BackofficeRole =
  | "internal_admin"
  | "venue"
  | "icub";

export interface BackofficeUser {
  role: BackofficeRole;
  venueId?: string;
}
