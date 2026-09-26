---
name: regenerate-api-client
description: Regenerate the billing API client in src/api/generated/. Use when the billing API has changed, or when a field the API returns is missing from the client.
---

1. Run `SPEC_URL=https://billing.example.com/staging/openapi.json make api-client`.
2. Run `npm run format -- src/api/generated`. The generator's output fails the lint rules until it is formatted.
3. Run `npm test -- src/api`. If a test fails, stop and report the failure.

Done when `npm run lint` reports no problems and the API tests pass.
