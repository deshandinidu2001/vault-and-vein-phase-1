# Vault & Vein

Vault & Vein is a storefront for cut and polished gemstones. It includes a catalogue, a shortlist cart, enquiry forms, hosted PayHere checkout, and a store admin panel.

## Run the preview

Use Node.js 22.18 or newer and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without Supabase, the store uses the 12 sample listings. Forms validate and display a preview confirmation. Online payment and admin sign-in are disabled in preview mode.

## Connect the backend

1. Create or select a Supabase project. Apply the pending SQL files in `supabase/migrations/` in filename order. If Shop filters is already set up, apply `202611190004_product_galleries_and_gem_types.sql` to enable galleries and Gem type creation.
2. Copy `.env.example` to `.env.local`. Set the Supabase project URL, publishable or anon key, and service-role key. Set the service-role key on the server only. The database starts with an empty catalogue.
3. In Supabase Auth, create a user with a confirmed email and a password. Disable public sign-ups if the project is dedicated to this store. Use the Auth user ID to grant access:

   ```sql
   insert into public.admin_users (user_id) values ('ACCOUNT_UUID');
   ```

4. Sign in at `/admin/login`. Use Inventory to create, publish, edit, or remove available listings. Removing a listing keeps its order history. Use Shop filters to add and show or hide Gem types and manage the other shop filters. Hiding an individual Gem type also hides its listings. The admin Inbox holds submitted messages, and Orders shows payment configuration and shipment status.

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

On Windows, set `NODE_USE_SYSTEM_CA=1` in the current shell if Node cannot verify the TLS certificates for browser or font downloads. Playwright checks the sample storefront on desktop and mobile Chromium. A separate local fixture exercises admin and checkout through the application using the same migrations, simulated Supabase API responses, and an intercepted PayHere form submission. The database suite checks access boundaries, reservations and payment transitions. Run the hosted PayHere sandbox check with your merchant and Supabase project.
