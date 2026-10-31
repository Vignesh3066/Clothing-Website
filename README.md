# FORM — clothing storefront frontend

Stage 1 of the clothing store. Temporary FORM branding, sample prices and generated product photography. React, TypeScript, CSS, Vite, and Lucide icons.

## Run locally

Requires Node.js 22.18+ or 24+.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` checks TypeScript and creates `dist/`. `npm run preview` serves the production build. `npm test` checks cart recovery, product variants, quantities, totals, and shipping.

## Included

- Animated product showcase with manual controls, pause, and reduced-motion support.
- Collection category filters and price sorting.
- Three product detail pages, color previews, sizes, size guide, quantities.
- Persistent local shopping bag with quantity changes and removal.
- Validated checkout form and demo order confirmation.
- Responsive layouts, accessible controls, and native modal focus handling.

Routes use URL hashes so refreshes work on static hosting. Edit products in `src/data.ts`, views in `src/App.tsx`, and appearance in `src/styles.css`.

## Preview limitations

No backend, payment processing, email, real stock, or shipment creation is connected. Checkout data stays in memory and is never sent to a server. Only cart product choices are saved in localStorage. Demo confirmation disappears after reload. Color variations are visual CSS previews, not photographs of real stock. Final prices, measurements, policies, branding, and contact information must be supplied before launch. Google Fonts is the only external frontend resource.

The next stages add Workers/D1/R2, admin access and inventory, then Razorpay webhooks, emails, and deployment. Server-side price, stock, and payment verification must replace the sample checkout before accepting real orders.

## Product imagery

The three transparent sample garments in `public/images` were generated with the built-in Imagegen tool. Prompts are recorded in `ASSETS.md`. They represent sample products only.

## Animated fitting room

Open a product and click Try on beside its image. A garment flies onto a sample model; the fitting room supports all three garments, replay, closing with Escape, and reduced motion. Model previews show the original sample colors. This visual preview does not estimate customer fit. See TRY-ON-ASSETS.md for asset prompts and implementation details.

