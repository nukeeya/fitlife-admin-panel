# FitLife Gym Shop

Standalone customer storefront for Cloudflare Pages. Product listings come from the same Supabase `shop_products` table used by the admin panel. Active product changes are synchronized with Supabase Realtime and a one-minute refresh fallback. The storefront does not read internal product costs.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the existing FitLife Supabase project URL and public anon/publishable key. Never use a service-role key in this site.
3. From this directory, run `npm install`, then `npm run dev`.

## Supabase setup

Apply `supabase/001_shop_products.sql` if the shop products table has not been created yet, then apply `supabase/007_public_gym_shop.sql` in the Supabase SQL editor. The new migration allows public read access only to active products and selected public columns; customer requests are accepted through a database function that recalculates prices from the live catalogue. Orders are visible to authenticated staff in the admin panel under **Gym Shop → Customer Orders**.

## Cloudflare Pages

Create a Pages project from the standalone storefront repository. Leave the root directory set to the repository root. Use:

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

Cloudflare Pages serves this Vite single-page app from `index.html`; no custom `_redirects` rule is needed. Vite embeds the public URL and anon key at build time; these are public credentials and protected by the database RLS policies.

Customer orders are requests, not paid/confirmed transactions. Staff should contact the customer to confirm delivery and payment.
