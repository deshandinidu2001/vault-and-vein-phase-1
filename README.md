# Vault & Vein

Vault & Vein is a storefront for cut and polished gemstones. It includes a catalogue, a shortlist cart, enquiry forms, hosted PayHere checkout, and a store admin panel.

## Run the preview

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without a database, the store uses the 12 sample listings. Forms validate and display a preview confirmation. Online payment and admin sign-in are disabled in preview mode.

## Connect Neon and create an admin

1. Create a Neon project or branch for this store. In the **Connect** dialog, copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL` in `.env.local`. Use the database owner when applying migrations. Set the pooled URL as a server-only environment variable in Vercel. Keep the direct URL in the migration environment.
2. Run `npm ci` to generate Prisma Client, then run `npm run db:deploy` to apply the schema. Migrations are run explicitly so that a preview build cannot change a production database.
### Enable admin sign-in

1. In Neon, enable **Managed Better Auth** on the branch used by `DATABASE_URL`. Open **Auth → Configuration** and copy the Auth URL into `NEON_AUTH_BASE_URL` in `.env.local`. [Neon Next.js guide](https://neon.com/docs/auth/quick-start/nextjs-api-only)
2. Generate a cookie secret from PowerShell and save it as `NEON_AUTH_COOKIE_SECRET`.

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
   ```

3. Create your Neon Auth account with a password of 12 to 128 characters. If the account already exists, copy its user ID from **Auth → Users** and skip the creation command. For local provisioning, enable **Allow Localhost** on the development branch. If `NEXT_PUBLIC_SITE_URL` is set, add that origin to Neon's trusted domains.

   ```powershell
   $env:VAULT_ADMIN_PASSWORD = Read-Host -MaskInput "New admin password"
   npm.cmd run admin:create -- owner@example.com
   Remove-Item Env:VAULT_ADMIN_PASSWORD
   ```

4. Check the account in **Auth → Users**, then set `NEON_ADMIN_USER_IDS` to its exact user ID. Use comma-separated IDs if several store admins need access. Restart the app and sign in at `/admin/login`. Approving an ID grants access to the store dashboard. A password change revokes the account's other sessions.
5. For Vercel, add `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, and `NEON_ADMIN_USER_IDS` as server environment variables on the deployment that uses the corresponding Neon branch. Trust the deployment's origin in Neon and redeploy.

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

- Update the five home slides in `src/config/hero.ts` and the editorial slots in `src/config/images.ts`. The images and gem viewers illustrate colour and cut.
- Set the store's email, hours, map, currency estimate, policies, and site copy in `src/config/site.ts`. Set the WhatsApp number with `NEXT_PUBLIC_WHATSAPP_NUMBER`.
- Contact and enquiry messages are visible in the admin inbox.

## Verify

```sh
npm run lint
npm run typecheck
node ./node_modules/@playwright/test/cli.js install chromium --only-shell
npm test
```

On Windows, set `NODE_USE_SYSTEM_CA=1` in the current shell if Node cannot verify the TLS certificates for browser or font downloads. Playwright checks the sample storefront on desktop and mobile Chromium. A separate local fixture exercises admin and checkout through the application using the same migrations, the Prisma PostgreSQL driver, a local Neon Auth fixture and an intercepted PayHere form submission. The database suite checks access boundaries, reservations and payment transitions. Run the hosted PayHere sandbox check with your merchant and Neon project.
