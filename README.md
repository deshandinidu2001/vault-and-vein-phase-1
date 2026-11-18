# Vault & Vein

Vault & Vein is a storefront for fine cut and polished gemstones, inspired by Sri Lanka’s gemstone heritage. Phase 1 is a frontend preview with a 12-stone sample catalogue, a shortlist cart, and enquiry and contact forms.

## Run locally

Use Node.js 22 LTS or newer and npm. From the project directory, install the locked dependencies and start the preview.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Replace the preview images

- Edit `src/config/hero.ts` for the five hero slides.
- Edit `src/config/images.ts` for collection, engagement, care, closing and About photos.
- Each slot has a desktop path, mobile path, alt text, zoom and crop origin. Store replacements under `public/images/` and use paths starting at `/images/`.
- The supplied sapphire opens the hero. The generated [editorial images](docs/editorial-images.md) illustrate collection themes and the craft behind a stone. Use separate photography for individual listings.
- Sample stone illustrations and models use the cut and tint from `src/data/stones.ts`. The original brand JPEGs are in `public/brand/`.

## Edit store settings

Edit `src/config/site.ts` for public email, international WhatsApp number, business hours, map, reply time, the illustrative LKR to USD rate, shipping and return notes, FAQ and policy copy. Contact details and the return window are intentionally blank until supplied. Set `NEXT_PUBLIC_SITE_URL` to the eventual public URL for canonical links and the sitemap.

Sample prices, origins, treatments, availability and report flags are illustrative. The forms show a local confirmation and reset without sending a message. The cart stores its shortlist in the browser.

## Phase 2

Phase 2 adds Supabase storage, database and row security, checkout and stone reservations, PayHere payments and webhooks, Resend emails, rate-limited enquiry and contact APIs, and an admin panel. Keep data access behind `src/lib/data.ts` when introducing live inventory. `.env.example` lists the planned variable names with empty values.

## Checks to run later

- Lint with `npm run lint`.
- Check TypeScript with `npm run typecheck`.
- Check the production build with `npm run build`.
- Review the mobile layout and keyboard flow, including both carousels, gallery, filters, cart, forms, reduced motion and the static gem viewer fallback.
