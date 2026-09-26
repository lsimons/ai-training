# Agent instructions for the shop frontend

- Node 20. Install with `npm ci`.
- Run the tests with `npm test`, and `npm run lint` before you commit.
- Commit messages follow Conventional Commits.
- Change files under `src/api/generated/` only by regenerating the client. A hook blocks direct edits.
- Amounts from the billing API are integer cents. Show them with `formatMoney()` from `src/lib/money.ts`.
- Before a page calls the billing API, read `docs/examples/billing-call.md` and follow it.
- Pages live in `src/pages/`, shared components in `src/components/`.
