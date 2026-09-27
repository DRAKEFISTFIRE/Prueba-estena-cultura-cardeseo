# Estrena Cultura — código base

Este paquete contiene una base funcional para:

- Next.js App Router
- TypeScript
- PostgreSQL
- API Fastify
- pg-boss
- códigos personales con dígito de control
- HMAC de códigos
- activación de tutor
- reemisión con revocación
- email SMTP
- catálogo
- reserva doble con bloqueo transaccional
- idempotencia
- adaptadores de Onebox/Koobin/Janto como interfaces + mock
- pase firmado
- libro mayor append-only
- auditoría
- Docker Compose
- Playwright + axe-core
- base de control de acceso para Payload CMS

## Arranque local

1. Copia `.env.example` a `.env`.
2. Ejecuta `docker compose up -d postgres mailpit`.
3. Instala dependencias de raíz, backend y frontend.
4. Ejecuta `npx tsx backend/src/migrate.ts`.
5. Arranca backend y frontend.

Mailpit queda disponible en `http://localhost:8025`.

## Importante

Esto es un esqueleto de implementación, no una certificación ENS ni un sistema listo para
producción. Para el lanzamiento real hay que completar, como mínimo:

- SSO/MFA y RBAC de backoffices.
- Payload CMS completo.
- conectores reales de cada taquilla y sus contratos.
- manejo de holds/compensaciones.
- conciliación diaria y liquidaciones mensuales.
- monitorización, alertas, backups y pruebas de restauración.
- gestión profesional de secretos.
- RGPD/DPIA/retención/borrado.
- controles ENS, hardening, pentest y revisión independiente.
- rate limiting, anti-abuso y protección de credenciales.
- generación de QR y validación de puerta si se usa emisión propia.
- internacionalización completa CA/ES.
- pruebas de carga.
- pruebas con usuarios reales.
