# FitLife — Gym Management Admin Panel

Admin panel for gym management built with React 19, Vite, React Router, Recharts, and Supabase.

## Tech stack

- **Frontend:** React 19 + Vite, react-router-dom, recharts, lucide-react
- **Backend/DB:** Supabase — full schema, RLS policies, and seed data in
  `database/schema.sql` (run the whole file in the Supabase SQL Editor)
- **Linting:** Oxlint (`npm run lint`)

For an existing Supabase project, apply the SQL files in `database/migrations`
in numeric order. Apply `008_admission_plan_details.sql` before deploying the
admission form update. Apply `009_coffee_shop_pos.sql` after `001_shop_products.sql`
to enable authenticated Coffee Shop sales. The migration adds a dedicated `Cafe`
product category. Checkout records walk-in sales and deducts stock in one
database transaction. Apply `010_coffee_shop_transfer.sql` to retire the Gym
Shop: Food products become coffee shop menu items, Gym Wear is moved over as
Archived, and the public storefront and online orders only accept coffee shop
items. Manage the menu under Coffee Shop → Menu & Stock and online orders under
Coffee Shop → Online Orders.

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
npm run dev            # http://localhost:5173
```

Required environment variables (all `VITE_`-prefixed, so they are baked into the
client bundle — keep Supabase RLS enabled and never put a service-role key here):

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (`VITE_SUPABASE_ANON_KEY` also supported) |

`.env` is gitignored. Never commit real keys.

## Deploying (Cloudflare Workers)

Both apps run as Cloudflare Workers serving static files, each connected to its
own GitHub repo; every push deploys that app.

| | Admin portal | Admission form |
| --- | --- | --- |
| GitHub repo / branch | `nukeeya/fitlife-admin-panel` / `main` | `nukeeya/admission-form` / `master` |
| Address | https://fitlife-admin-panel.marufaman037.workers.dev | https://admission-form.marufaman037.workers.dev |
| Build command | `npm run build` | `npm run build` |
| Output directory | `dist` | `dist` |

- **Environment variables** (Worker → Settings → Variables and Secrets, build
  variables): `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. They are
  built into the bundle, so a change needs a new deploy.
- Node version comes from `.node-version` (22).
- Client-side routes (`/members/12`, `/reset-password`) are served by
  `index.html`; Cloudflare set this up automatically.
- Supabase → Authentication → URL Configuration: Site URL is the admin
  portal's address, and `<admin address>/reset-password` is a Redirect URL.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |
