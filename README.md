# ehr-api-portal

Patient portal **BFF and API gateway** reference implementation in TypeScript (Hono).
Demonstrates how a browser or mobile client can talk to one edge API that enforces context, limits abuse, and aggregates mock clinical services.

- **Versioned gateway** = `/api/v1/*` entrypoint with CORS for local development
- **Patient request context** = scoped access via `X-Patient-Id` (demo default: `pt-8842`)
- **Cross-cutting middleware** = request IDs, per-patient rate limits, structured error bodies
- **BFF aggregate** = `GET /portal/home` loads dashboard data in one round trip
- **Service fan-out** = health record route calls mock vitals, lab, and chart services in parallel
- **Mutations** = care-plan task updates with validation and in-memory persistence
- **Shared types** = `@ehr-portal/shared` DTOs for API responses and any client you add locally
