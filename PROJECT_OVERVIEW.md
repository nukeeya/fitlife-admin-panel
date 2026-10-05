# FitLife Admin Panel Project Overview

## Project Summary
FitLife is a gym management admin panel built for managing memberships, member admissions, trainer and employee records, attendance, billing, SMS, inventory, and AI-assisted fitness planning. The application is a React 19 + Vite single-page app with Supabase as the data layer and a public admission form app included in the same repository.

## Primary Goals
- Manage gym operations from one admin dashboard
- Track members, plans, attendance, and payments
- Support staff and trainer administration
- Review online applications and approvals
- Provide business insights via reports and metrics
- Offer AI-based workout and diet plan generation

## Tech Stack
- Frontend: React 19, Vite, React Router
- Charts: Recharts
- Icons: Lucide React
- Data & auth: Supabase
- Styling: Custom CSS variables and component styling
- Linting: Oxlint

## Key Features
- Dashboard with KPI metrics and charts
- Member management and profile views
- Admission and approval workflow
- Membership plans and subscription management
- Attendance and payment tracking
- Locker, employee, and trainer management
- SMS campaigns and job posting management
- Gym shop inventory and sales tracking
- AI workout and diet plan generation
- Reports and system configuration

## Application Structure
The project is organized around a main admin panel app at the repository root and a separate admission form app under `admission-form/`.

### Main Admin App
- `src/pages/` — page-level screens and business features
- `src/components/` — reusable UI and layout components
- `src/context/` — global providers for auth, theme, and data state
- `src/lib/` — integration logic and Supabase helpers
- `src/data/` — shared data and static resources
- `src/utils/` — helper functions and utilities

### Important Pages
- `Dashboard` — overview metrics and analytics
- `Members` and `MemberDetails` — member records and profile information
- `Admissions` — new member intake
- `Approvals` — approval/rejection for applications
- `Attendance` — check-ins and attendance log
- `Accounts` — invoices, expenses, and financial records
- `Memberships` and `SubscriptionPlans` — plan configuration
- `AIWorkoutManagement` — AI-generated workout regimens
- `DietPlans` — nutrition and macro planning
- `Reports` — operational and revenue insights
- `SystemManagement` — roles and app settings

## Project Architecture
The app uses a central data provider to manage most business logic and database reads/writes. A few global contexts wrap the application:

- `AuthContext` — handles Supabase authentication and session state
- `ThemeContext` — handles app theme and layout customization
- `GymDataContext` — central source of business data and mutations

This pattern keeps the UI connected to a consistent state layer while still allowing optimistic updates and refresh behavior across the app.

## Database and Backend Context
The project is designed to use Supabase with a SQL schema under `database/schema.sql` and migration files in `database/migrations/`.

Key data domains include:
- members and applications
- attendance and lockers
- plans and memberships
- trainers and employees
- invoices, expenses, and payments
- SMS and marketing assets
- AI diet/workout plans
- shop products and sales records

## Environment Setup
Create a local environment file from `.env.example` and configure the required variables:

```bash
npm install
cp .env.example .env
npm run dev
```

Required variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY`

These values are meant to be public client-side variables because the app is a Vite frontend, and Supabase RLS should remain enabled.

## Available Scripts
```bash
npm run dev       # start development server
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # run lint checks
```

## Notes
- This is a frontend-heavy admin panel with a Supabase-backed data model.
- The app includes both internal operational management and a public signup flow.
- The repository also contains architecture and backend planning documents such as `CODEBASE_GUIDE.md` and `BACKEND_ARCHITECTURE.md` for deeper project context.

## Repository Snapshot
- Main app: root directory
- Public form app: `admission-form/`
- Database schema: `database/`
- Documentation: root-level markdown guides
- Build output: `dist/`

This file provides a concise, high-level project summary for the FitLife admin panel and its operational scope.
