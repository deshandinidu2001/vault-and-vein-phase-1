<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Vault & Vein agent guide

## Project map

- `src/app/(site)/` contains the public storefront, product pages, checkout and order status. `src/components/` contains the shared UI, and `src/config/` holds store copy, contact details and editorial image settings.
- `src/app/vault8@vein@8/` contains the store admin, including inventory, shop filters, orders, inbox and sign-in. `src/lib/admin-auth.ts` and `src/lib/admin-pin.ts` enforce the admin access rules.
- `src/app/api/` handles checkout, PayHere notifications, contact and enquiries. `src/lib/` contains server-side rules for catalogue access, stock holds, payments and Cloudinary photos.
- `prisma/schema.prisma` and `prisma/migrations/` define the Neon Postgres schema and database rules. `tests/` contains backend and Chromium tests.

## Local workflow

- Run `npm ci` to install the locked dependencies and generate Prisma Client. Use `npm run dev` to start the app.
- Change `prisma/schema.prisma` and add a migration for schema changes. Run `npm run db:generate` to refresh `src/generated/prisma/` after editing the schema. Apply migrations explicitly to the intended database with `npm run db:deploy`.
- Use `.env.example` for environment variable names. Keep credentials, PINs, verification codes, session tokens, order-access links and customer details out of commits, logs and test fixtures. Use synthetic values in fixtures.
- Verify application changes with `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`. `npm run test:backend` covers database rules. `npm run test:browser` covers the public storefront. `npm run test:configured` covers integrated admin and checkout behavior with local provider fixtures.
- Follow the [README](README.md) for environment setup and hosted payment verification. Keep public prices, policy text and claims about gem origin or certification grounded in supplied store data.

## Security-sensitive changes

- Guard each privileged read and write on the server. Preserve the verified store email and password check, current Neon session check and PIN proof in admin access. Treat the admin URL as a route identifier.
- Keep price, availability, reservation and payment decisions on the server and database. Use verified PayHere notifications to change payment status. Treat return and cancel links as navigation.
- Keep Cloudinary upload credentials server-side. Preserve upload validation, gallery limits and the separation between public image delivery and privileged listing edits.
- Update the [trust boundary diagram](docs/security/trust-boundaries.md) and [STRIDE diagram](docs/security/stride.md) when changing data flows, privileges or external integrations.
