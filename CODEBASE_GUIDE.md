# FitLife Codebase Guide

A complete map of the **FitLife Gym Management Admin Panel** — what it is, how it's wired, and where everything lives.

---

## 1. What this project is

An admin panel for managing a gym (members, admissions, invoices, attendance, lockers, staff, SMS, ads, jobs, reports) plus an **evidence-based AI fitness module** (workout regime generator, diet/macro planner, PDF export).

Two apps live in this repo:

| App | Path | Purpose |
| --- | --- | --- |
| **Admin panel** (main app) | `/` (root) | Internal staff dashboard for running the gym |
| **Admission form** (secondary app) | `/admission-form/` | Public-facing member signup form (separate Vite app, own `package.json`) |

Other notable root items:

- `database/schema.sql` — full Supabase (PostgreSQL) schema: RBAC tables, members, invoices, discounts, lockers, attendance, SMS, AI plans, recruitment, RLS policies, seed data. Run the whole file in the Supabase SQL Editor (it is destructive — drops & recreates everything).
- `database/migrations/` — additive, non-destructive migrations run *after* `schema.sql` (e.g. `001_shop_products.sql` creates + seeds the `shop_products` table used by the `/gym-shop` page).
- `scratch/verify_fitness_engine.mjs` — a standalone script to sanity-check the fitness calculation engine.
- `BACKEND_ARCHITECTURE.md` — a spec of the *intended* REST API / discount engine / RBAC model (aspirational blueprint, not the current code).
- `vercel.json` — SPA rewrite for client-side routing on Vercel.

---

## 2. Tech stack

- **React 19** + **Vite 8** (SPA, no SSR)
- **react-router-dom v7** — client-side routing
- **Supabase JS v2** — auth only (see §4 for the data caveat)
- **Recharts** — dashboard charts
- **lucide-react** — icons
- **Oxlint** — linting (`npm run lint`)
- Plain **CSS** (`App.css`, `index.css`) with CSS variables — no Tailwind, no CSS modules

Env vars (`.env`, all `VITE_`-prefixed, baked into the client bundle):

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) | Supabase anon key |

---

## 3. Big picture architecture

```
main.jsx
  └── App.jsx
        ├── ErrorBoundary            (crash guard around everything)
        ├── AuthProvider             (Supabase auth state)
        ├── ThemeProvider            (dark/light, colors, nav style → CSS vars)
        ├── GymDataProvider          (ALL business data + actions, Supabase-backed)
        └── BrowserRouter
              ├── /login, /reset-password        (public)
              └── <ProtectedRoute> → <Layout>
                    ├── Sidebar / HorizontalNav  (based on theme navStyle)
                    ├── Header                   (global actions: admission, check-in, customizer)
                    ├── <Outlet>                 (21 pages)
                    ├── CustomizerDrawer         (theme settings panel)
                    └── MemberAdmissionModal, QuickCheckInModal (global modals)
```

Three React contexts wrap the entire app (order matters: Auth → Theme → GymData):

| Context | File | Responsibility |
| --- | --- | --- |
| `AuthContext` | `src/context/AuthContext.jsx` | `useAuth()` → `{ user, loading, signIn, signUp, signOut, resetPassword, updatePassword }`. Wraps Supabase auth. `signOut()` also **wipes all `fitlife-*` localStorage keys** (see `clearLocalCaches`). |
| `ThemeContext` | `src/context/ThemeContext.jsx` | `useTheme()` → theme settings (dark/light, primary color, bg, nav style `vertical`/`horizontal-*`, LTR/RTL, boxed layout). Writes `data-*` attributes + CSS variables (`--primary`, `--bg-base`, …) onto `<html>`. Persists to `fitlife-theme-settings`. Exports `COLOR_PRESETS`, `BG_PRESETS_DARK/LIGHT`. |
| `GymDataContext` | `src/context/GymDataContext.jsx` | **The heart of the app.** `useGymData()` → every entity array (members, plans, lockers, trainers, employees, invoices, expenses, attendance, roles, SMS, ads, jobs, diet/workout plans) + all mutation actions (see §5). |

### Data flows through Supabase

`GymDataContext` loads **all business data from Supabase** (per `database/schema.sql`) via `src/lib/supabaseData.js`:

1. `fetchAllData()` runs all table queries in parallel and maps snake_case rows to the camelCase shapes the UI consumes (mappers: `mapPlan`, `mapMemberBase`, `mapLocker`, …).
2. Every mutation action uses an **optimistic-update pattern** (`commit({ optimistic, persist, reloadAll })`): local state changes immediately, the DB write fires, then the affected data reloads. On DB error the state is rolled back by reloading from the server.
3. While loading (`loading: true`) or on connection failure (`loadError`), slices fall back to empty seeds — check `.env` (`VITE_SUPABASE_URL`/key) if data never appears.
4. `useGymData()` also exposes `refresh()` to force a full reload.

Write conventions: members are stored `first_name`/`last_name` (split from the UI's full `name`), discounts are normalized into the `discounts` table (invoices only carry `discount_amount`), payments get a `payments` receipt row, and branding persists to the `app_settings` key/value table. Sign-out no longer destroys business data (it's in the DB); `src/utils/localBackup.js` remains only to recover legacy localStorage-era data.

### Auth flow

- `Login.jsx` / `ResetPassword.jsx` use `useAuth()` against Supabase email/password auth.
- `ProtectedRoute.jsx` shows a spinner while `loading`, redirects to `/login` if no user, otherwise renders `<Outlet/>`.
- Roles: there is a `roles` array (Super Admin, Branch Manager, Receptionist, Personal Trainer, Accountant) with discount/approval permissions, but the "current role" is just a hardcoded state `currentUserRole = 'Super Admin'` in GymDataContext — not derived from the authenticated user.

---

## 4. Routing map (`App.jsx`)

| Route | Page component | Domain |
| --- | --- | --- |
| `/dashboard` | `Dashboard.jsx` | 14-metric overview, charts, activity |
| `/members`, `/members/:id` | `Members.jsx`, `MemberDetails.jsx` | Member list & 360° profile |
| `/admissions` | `Admissions.jsx` | New member admission form |
| `/approvals` | `ApprovalManagement.jsx` | Review online applications (approve/reject) |
| `/lockers` | `LockerManagement.jsx` | Locker zones, assign/release |
| `/trainers` | `Trainers.jsx` | Coach roster |
| `/employees` | `Employees.jsx` | Staff directory |
| `/accounts` | `Accounts.jsx` | Invoices, expenses, P&L (largest finance page) |
| `/attendance` | `Attendance.jsx` | Check-in/out, bulk entry |
| `/payments` | `Payments.jsx` | Payment collection |
| `/memberships` | `Memberships.jsx` | Plan overview |
| `/sms` | `SMSManagement.jsx` | SMS campaigns & balance |
| `/subscription-plans` | `SubscriptionPlans.jsx` | Plan CRUD + features |
| `/advertisements` | `Advertisements.jsx` | Banner ads, impressions/clicks |
| `/gym-shop` | `GymShop.jsx` | Shop inventory: gym wear + food, stock/pricing CRUD |
| `/ai-workouts` | `AIWorkoutManagement.jsx` | AI workout regime generator (819 lines) |
| `/diet-plans` | `DietPlans.jsx` | AI diet/macro planner (859 lines — biggest page) |
| `/job-postings` | `JobPosting.jsx` | Recruitment vacancies |
| `/reports` | `Reports.jsx` | Revenue vs expense, exports |
| `/system`, `/system-roles` | `SystemManagement.jsx` | RBAC matrix, branding, role permissions |

---

## 5. `GymDataContext` — the data layer

The single source of truth. Key exports from `useGymData()`:

**Read state:** `branding, members, applications, plans, lockers, trainers, employees, invoices, expenses, attendance, roles, smsCampaigns, smsBalance, ads, jobs, dietPlans, workoutPlans, progressLogs, shopProducts`

**Derived (useMemo):** `stats`, `analytics`, `pendingApprovals`, and `getAnalytics()` (the 14 dashboard metrics incl. real-time sales/attendance computed from invoices/attendance).

**Actions (all mutate state optimistically + persist to Supabase):**

| Action | What it does |
| --- | --- |
| `calculatePricing({basePrice, discountType, discountValue, vatPercent})` | **Dynamic Discount Engine** — percentage or flat discount (clamped), then VAT, returns `{discountAmount, priceAfterDiscount, taxAmount, netPayable}` (rounded). Mirrors the formula in `BACKEND_ARCHITECTURE.md`. |
| `canRoleApplyDiscount()` | Checks `currentUserRole` against the roles matrix |
| `addMember({...})` | Creates member **and** auto-generates an invoice with discount/VAT math; optionally occupies a locker |
| `approveApplication` / `rejectApplication` | Convert an online application into a member (or reject with reason) |
| `checkInMember` / `checkOutMember` / `bulkCheckIn` | Attendance records; increments member visits |
| `collectPayment({invoiceId, amount, method})` | Applies a payment to an invoice, recomputes Paid/Partial/Due |
| `addExpense` | Logs an expense approved by current role |
| `assignLocker` / `releaseLocker` | Locker ↔ member assignment |
| `sendSMS({title, recipientType, message})` | Creates campaign, decrements `smsBalance` |
| `updateRolePermission(roleId, field, value)` | Edit RBAC matrix at runtime |
| `saveDietPlan` / `deleteDietPlan`, `saveWorkoutPlan` / `deleteWorkoutPlan`, `logMemberProgress` | AI fitness module persistence |
| `updateBranding` / `resetBranding` | White-label gym name/logo/contact (also sets `document.title`) |
| `saveShopProduct` / `deleteShopProduct` | Gym Shop inventory CRUD against `shop_products` (return the commit result so callers can surface `{error}`) |

Implementation notes:

- All state is derived from a single `raw` object of DB rows (`setRaw`), memoized per slice. Optimistic writes insert temp rows with negative IDs (`-Date.now()`) until `reloadAll` replaces them with real DB rows.
- IDs come from Postgres identity columns; the DB trigger auto-fills `members.member_code` (`FLM-000123`). Invoice numbers are generated client-side as `INV-<year>-<timestamp6>`.
- Dates are real: member joined/expiry, invoice and attendance dates use `todayStr()` (actual current date). "Expiring today" logic compares against the real date.
- `sendSMS` is now **async** (returns a promise; SMSManagement awaits it), as are `addMember`, `collectPayment`, `checkInMember`, and the other mutations.

---

## 6. The fitness/AI module (domain logic worth knowing)

This is the most algorithmically rich part of the codebase and is fully client-side (no external AI API — "AI" = rule-based evidence-backed engines).

### `src/utils/fitnessCalculations.js` (~286 lines)
Scientific nutrition math with cited references (Mifflin-St Jeor, ACSM, ISSN, Morton 2018):
- `ACTIVITY_MULTIPLIERS` (1.2–1.9), `GOAL_CONFIG` per goal (Fat Loss / Muscle Gain / Recomp / Strength / Endurance / Maintenance): calorie adjustment, protein g/kg, fat %, weekly rate.
- `calculateBMI(weightKg, heightCm)` with WHO categories & colors, plus BMR/TDEE/macro targets further down the file.

### `src/utils/workoutEngine.js` (~400 lines)
`EXERCISE_LIBRARY` — each entry has muscles, equipment, tier (compound/isolation), tempo notation, technique cues, `alternatives[]` (for substitutions / joint issues), and `jointStress`. Beyond line ~120: split templates (PPL, Upper/Lower, Full Body), volume distribution, double-progression rules, and session adaptations (30-min crunch, joint discomfort, equipment busy).

### `src/data/bangladeshiFoods.js` (~369 lines)
`BANGLADESHI_FOODS` — local food DB (English + Bangla names, per-serving macros) from FAO/USDA sources, used to build realistic Deshi meal plans; includes a substitution registry consumed by `FoodSubstitutionModal`.

### `src/data/fitnessResearchSources.js`
`FITNESS_RESEARCH_DATABASE` — the peer-reviewed citations (Morton, Schoenfeld, Helms…) with `keyTakeaway` and `appliedInSystem` explaining how each study feeds the calculators. Surfaced in `ResearchPipelineModal`.

### `src/utils/planPdfGenerator.js` (~502 lines)
`generateFitnessPlanPDF({type: 'diet'|'workout'|'complete', profile, metrics, dietPlan, workoutPlan, researchSources, branding})` — builds a styled HTML document (A4 print CSS, gym branding, plan tables, bibliography) and opens the browser print dialog → save as PDF.

### Fitness UI flow
`IntakeProfileModal.jsx` (655 lines — member intake: goals, activity, measurements) → calculations → plan generation → `DietPlans.jsx` / `AIWorkoutManagement.jsx` review & save → PDF export. `FoodSubstitutionModal.jsx` swaps foods by category/macros; `ResearchPipelineModal.jsx` shows the evidence behind a recommendation.

---

## 7. Directory reference

```
src/
├── main.jsx                  # React root
├── App.jsx                   # Providers + route table
├── App.css / index.css       # All styling (CSS variables, themes)
├── lib/supabase.js           # Singleton Supabase client (auth + data)
│   └── supabaseData.js       # Data layer: fetchAllData(), snake_case→camelCase mappers, db.* write helpers
├── context/                  # AuthContext, ThemeContext, GymDataContext
├── data/
│   ├── gymData.js            # Legacy static mock data (charts, tables) — partially superseded by GymDataContext
│   ├── bangladeshiFoods.js   # Food DB for diet engine
│   └── fitnessResearchSources.js
├── utils/
│   ├── fitnessCalculations.js
│   ├── workoutEngine.js
│   ├── planPdfGenerator.js
│   └── localBackup.js        # Legacy: recover localStorage-era fitlife-* data (business data is in Supabase now)
├── components/
│   ├── Layout.jsx            # Shell: Sidebar/Header/HorizontalNav/Outlet + global modals
│   ├── Sidebar.jsx / HorizontalNav.jsx / Header.jsx
│   ├── ProtectedRoute.jsx    # Auth gate
│   ├── ErrorBoundary.jsx
│   ├── CustomizerDrawer.jsx  # Theme customizer UI
│   ├── MemberAdmissionModal.jsx  # Global admission flow (uses addMember + discount engine)
│   ├── QuickCheckInModal.jsx # Fast check-in search
│   ├── ApprovalModal.jsx     # Approve application w/ discount + payment
│   ├── common/               # Modal.jsx, ConfirmDialog.jsx (reusable primitives)
│   └── fitness/              # IntakeProfileModal, FoodSubstitutionModal, ResearchPipelineModal
└── pages/                    # 21 route pages (see §4)
```

---

## 8. Conventions & gotchas

- **No TypeScript** — plain JSX/JS. There are `@types/*` dev deps only for editor support.
- **No test suite** — only `scratch/verify_fitness_engine.mjs` as an ad-hoc checker. Tests detected: none.
- **Lint** with `npm run lint` (Oxlint; config in `.oxlintrc.json`).
- **Currency** is BDT (৳ / Taka); member codes are `FLM-80xx`, invoices `INV-2026-xxxx`, employees `EMP-1xx`, applications `APP-99xx`.
- **Naming**: contexts export both a Provider and a `use*()` hook that throws outside the provider.
- **Icons** always from `lucide-react`; **charts** from `recharts`.
- **Theme colors** come from CSS variables — never hardcode colors in new components; use `var(--primary)`, `var(--bg-card)`, `var(--text-primary)`, etc.
- **localStorage keys** starting with `fitlife-` are legacy (theme settings still persist there; business data lives in Supabase). Sign-out only wipes the legacy keys.
- **Discount rule of thumb**: any price-changing UI must go through `calculatePricing()` and ideally respect `canRoleApplyDiscount()` so behavior matches the RBAC spec.
- So the app is DB-backed end-to-end. `BACKEND_ARCHITECTURE.md` describes a Node/Express API that is **not needed** — Supabase client-side access with RLS replaces it.
- `admission-form/` is an independent Vite app with its own deps/build — cd into it to run; it does write to Supabase (`admission_submissions`), unlike the admin panel.

---

## 9. Quick start

```bash
npm install
cp .env.example .env      # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
npm run lint              # Oxlint
npm run build             # production build → dist/
```

To run the secondary admission app: `cd admission-form && npm install && npm run dev`.

To (re)create the backend: paste `database/schema.sql` into the Supabase SQL Editor (destructive — wipes existing data).
