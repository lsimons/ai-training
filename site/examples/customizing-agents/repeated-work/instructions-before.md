# Agent instructions for the shop frontend

- Node 20. Install with `npm ci`.
- Run the tests with `npm test`, and `npm run lint` before you commit.
- Commit messages follow Conventional Commits.
- Never edit files under `src/api/generated/`. They are generated from the billing API spec.
- The API client is generated from the billing API's OpenAPI spec, and when the billing API changes you need to regenerate it, which is done with the api-client target in the Makefile, but that target needs the SPEC_URL variable set to the spec of the right environment (usually staging), and afterwards the generated files don't pass our lint rules, so format them with the format script before you run the API tests, and don't commit until those pass.
- Pages live in `src/pages/`, shared components in `src/components/`.
