# FitLife — Gym Management Admin Panel

Admin panel for gym management built with React 19, Vite, React Router, Recharts, and Supabase.

## Tech stack

- **Frontend:** React 19 + Vite, react-router-dom, recharts, lucide-react
- **Backend/DB:** Supabase — full schema, RLS policies, and seed data in
  `database/schema.sql` (run the whole file in the Supabase SQL Editor)
- **Linting:** Oxlint (`npm run lint`)

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

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → import the repo**. The Vite framework
   preset is auto-detected — defaults are correct:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Under **Settings → Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` (Production + Preview).
4. Deploy. `vercel.json` already contains the SPA rewrite so client-side
   routes deep-link correctly.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |
