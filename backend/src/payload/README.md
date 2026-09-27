Payload CMS is intentionally kept as a separate admin surface from the public API.

Create a Payload application using the same PostgreSQL database and define:
- Users: internal_admin, venue, icub
- Venues
- Activities
- Providers
- Sync runs
- Audit events (read-only)
- Reconciliation reports

The access functions in access.ts are the base policy. For venue users, add a venueId constraint
so they can only read/write records belonging to their own venue. ICUB should receive read-only
access. Internal admins can manage configuration and integrations.

Do not expose Payload's admin endpoint publicly without SSO/MFA, network restrictions and the
appropriate security controls for the final ENS/RGPD deployment.
