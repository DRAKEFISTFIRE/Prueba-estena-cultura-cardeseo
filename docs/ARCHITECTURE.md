# Estrena Cultura — arquitectura base

## Flujo principal

1. Administración importa/crea un código personal.
2. El código se almacena únicamente como HMAC; nunca en claro en PostgreSQL.
3. El tutor introduce el código + datos de cuenta.
4. El código pasa a `used`; una reemisión revoca el anterior.
5. El tutor consulta el catálogo.
6. Al reservar se bloquea la actividad con `FOR UPDATE` y se descuentan exactamente 2 plazas.
7. Se llama al adaptador de taquilla.
8. La confirmación es idempotente.
9. Se genera un pase firmado con `jti`.
10. Se añade un asiento append-only al libro mayor.
11. Se envía el pase por email.
12. Todas las acciones relevantes se auditan.

## Integraciones de taquilla

Cada proveedor debe implementar `TicketingAdapter`:

- Onebox
- Koobin
- Janto
- otros

El adaptador no debe cambiar la semántica interna de reserva. La aplicación mantiene su propia
idempotencia, auditoría y libro mayor.

Si un proveedor no tiene API:
- usar redirección firmada si el flujo lo permite;
- o un conector específico autorizado;
- nunca automatizar credenciales de usuario final sin autorización contractual/técnica.

## Sobreventa

La reserva hace:

- `SELECT ... FOR UPDATE`
- comprueba `remaining >= 2`
- descuenta 2
- crea una reserva con `idempotency_key`

En producción conviene añadir un estado de "hold" y expiración si el proveedor externo no confirma
de inmediato. El hold debe tener compensación para devolver el cupo cuando la reserva externa falle.

## Seguridad

Antes de producción:

- SSO/MFA para backoffice.
- gestión de secretos con KMS/secret manager.
- TLS extremo a extremo.
- WAF/rate limiting.
- CSP estricta.
- logs centralizados y alertas.
- backups cifrados + restauraciones probadas.
- retención y borrado RGPD.
- minimización de datos.
- DPIA/registro de tratamientos.
- segregación de entornos.
- revisión ENS por responsable de seguridad.
- pentest.
