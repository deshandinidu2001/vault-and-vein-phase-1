# Vault & Vein

Vault & Vein is a storefront for cut and polished gemstones. It includes a catalogue, a shortlist cart, enquiry forms, hosted PayHere checkout, and a store admin panel.

## Run the preview

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The catalogue shows published inventory from the database. Without a database, it shows an empty state. Forms validate and display a preview confirmation, and online payment and admin sign-in are disabled.

## Connect Neon and create an admin

1. Run `neon deploy` from the linked project to pull the pooled `DATABASE_URL`, direct `DATABASE_URL_UNPOOLED`, and `NEON_AUTH_BASE_URL` into the local environment file. For manual setup, copy both connection strings from the Neon **Connect** dialog into `.env.local`. `DIRECT_URL` is also accepted for a manually configured direct connection. Use the database owner when applying migrations. Create a dedicated Postgres login with no ownership, role-management or RLS-bypass privileges and grant it membership in `vault_store_runtime` after migration. Use its pooled URL for `DATABASE_URL` locally and in the Cloudflare Worker secret. Place `DATABASE_URL_UNPOOLED` in the ignored `.env.migrations.local` file or supply it to the migration job. Next.js loads the runtime credentials from `.env.local`.
2. Run `npm ci` to generate Prisma Client, then run `npm run db:deploy` to apply the schema. Migrations are run explicitly so that a preview build cannot change a production database.
### Set up admin sign-in with email and password

1. In the Neon project and branch that serve the store, open **Better Auth > Configure Auth**. Enable email/password sign-in and email verification codes. Use the same branch's Auth URL for `NEON_AUTH_BASE_URL`.
2. Generate a random `NEON_AUTH_COOKIE_SECRET` of at least 32 characters. Keep it server-side. Use the same secret across deployments that share the store PIN database.

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

3. Run `npm run db:deploy` for the store database. In **Better Auth > Users**, make sure `vault8vein@gmail.com` exists. Create it there if needed.
4. In Neon, trust the storefront origin under **Domains** and enable **Revoke sessions on password reset**. Configure an email provider for production delivery. [Neon password recovery](https://neon.com/docs/auth/guides/password-reset)
5. Open `/vault8@vein@8/login`. Choose **Set or reset password** if you need a store password, then enter the code from your email. Sign in with the verified store email and the store password. Set an 8–12 digit PIN if prompted. Enter it after signing in and when returning from the storefront.
6. Open **Account security** from the admin panel to change your password or PIN. The password change signs out your other Neon sessions and returns this browser to sign-in. Changing the PIN requires a separate email code.

### Move an existing catalogue

Use a fresh Neon branch after applying the Prisma migrations. For the final transfer, pause source writes and let pending payments settle before taking the snapshot. Obtain the legacy direct PostgreSQL connection string from the database provider and set it as `LEGACY_DATABASE_URL` in the local shell. With PostgreSQL client tools `pg_dump` and `psql` on PATH, run `npm run db:import-legacy`. It copies catalogue data, filter settings, image references, orders, payment records and inbox messages into the new database in a single restore transaction. Provision admin accounts in Neon Auth separately. Existing Supabase or password-based store admin accounts do not carry over to Managed Better Auth. Check catalogue and order counts before changing the Vercel connection. Keep the original database available until the transfer is verified.


## Upload product photos

In your Cloudinary console, copy the cloud name, API key and API secret for your product environment into `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the server environment. Restart the app. Upload JPEG, PNG or WebP files up to 3 MB each. You can upload the initial photo when adding a listing, then open **Edit listing → Product photos** to manage up to eight photos. Use **Set as cover** to choose the image for Inventory, the shop, the cart and the product gallery.

## Enable PayHere checkout

1. Deploy the application to an HTTPS domain that PayHere can reach and set the root URL as `NEXT_PUBLIC_SITE_URL`.
2. Configure a PayHere sandbox merchant for that domain. Set `PAYHERE_MODE=sandbox`, `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, and `SHIPPING_LKR`. The shipping value is a whole LKR amount, including `0` for free delivery. Checkout supports LKR payments and delivery within Sri Lanka.
3. Publish a test listing for the sandbox check. Verify checkout using PayHere’s test payment details. Check that PayHere reaches `/api/payhere/notify`, the order status page confirms the payment, and the stone is listed as sold. Check unsuccessful payment and cancellation, too.
4. Set shop contact details and delivery and return terms in `src/config/site.ts` before selling. Use `PAYHERE_MODE=live` and the approved live merchant credentials when the sandbox checks are complete.

With PayHere enabled, customers can choose **Buy now** for an available stone or check out from the cart. Checkout holds each unique stone for 20 minutes. The database sets and confirms the checkout total. The order status page updates after a verified PayHere notification. Late payments and chargebacks appear as **Review** in the Orders tab. Reconcile those cases in PayHere before arranging dispatch. Mark an order as shipped only after dispatch.

## Images and store details

- Update the five home slides in `src/config/hero.ts` and the editorial slots in `src/config/images.ts`. Upload actual listing photos from the admin inventory.
- Set the store's email, hours, map, currency estimate, policies, and site copy in `src/config/site.ts`. Set the WhatsApp number with `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Contact and enquiry messages are visible in the admin inbox.

## Verify

```sh
npm run lint
npm run typecheck
node ./node_modules/@playwright/test/cli.js install chromium --only-shell
npm test
```

On Windows, set `NODE_USE_SYSTEM_CA=1` in the current shell if Node cannot verify the TLS certificates for browser or font downloads. Playwright checks the storefront on desktop and mobile Chromium. A separate local fixture exercises admin and checkout through the application using the same migrations, the Prisma PostgreSQL driver, a local Neon Auth fixture and an intercepted PayHere form submission. The database suite checks access boundaries, reservations and payment transitions. Run the hosted PayHere sandbox check with your merchant and Neon project.
