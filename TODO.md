# FitLife Portal — TODO

**Rules**
1. Work on one task at a time: the one under **Now**.
2. New ideas go to **Later**. Don't start them mid-task.
3. Commit when a task is finished, then move the next item up into **Now**.

---

## Now

- [ ] **Check the database foundation**
  - [x] Migration `013` (membership start date) run and verified (26 Oct 2026)
  - [x] Confirm migrations `001`–`012` have all been run on the Supabase project (28 Oct 2026)
  - [ ] Turn on Supabase backups, or take one export
  - [x] Merge branch `portal-updates` into `main` and deploy (26 Oct 2026)

---

## Next (needed before delivery, in order)

### Stop fake data appearing on real screens
- [x] **Member Details**: load history from real invoices/payments, attendance and AI plans; show "Member not found" instead of a demo member (28 Oct 2026)
  - [ ] Features & Perks tab: use the plan's real features (`plan_features`), not the hardcoded list
  - [ ] Renew Subscription: save through a database function (invoice + payment + new expiry); currently screen-only
  - [ ] Decide: add columns for RFID card, emergency relationship and medical notes, or remove them from the Profile tab
  - [ ] "Collected By" on payments: show the staff name (`payments.collected_by` → `users.name`)
- [ ] **Empty tables** (Members, Trainers, Employees, Lockers): show an empty list with "Add your first…", not demo records
- [ ] **Failed loads**: show an error with a Retry button instead of demo data
- [ ] **Dashboard**: calculate the male/female percentages (currently fixed at 72% / 28%)
- [ ] Remove the demo records from `FALLBACK_DATA` and delete `src/data/mockProfiles.js`

### Connect the pages that have no database
- [ ] **Visitor Entry**: new `visitors` table; dates default to today
- [ ] **Job applicants**: use the existing `job_applications` table
- [ ] **SMS**: history and balance from the database (check whether `sms_campaigns` fits first)

### Real defaults in forms
- [ ] **Approval form**: first payment, due date and notes based on the chosen plan, not demo values
- [ ] **Reports export**: branch name from settings, not "Dhanmondi"

### Cleanup
- [ ] Delete the unused `src/pages/Admissions.jsx`
- [ ] Remove leftover "mock" / "demo" text (Approval form, Financial Reports, Monthly Closing "Demo Adjustment")
- [ ] Decide: keep or remove the Revenue Simulator
- [ ] Fix the lint warnings

### Keep within Supabase Pro limits
- [ ] **Compress photos before upload**: resize to about 400×400 px / 100–200 KB in the browser, in both the admin portal and the admission form (currently up to 15 MB, stored as-is)

### Testing
- [ ] Empty database test: no fake names anywhere
- [ ] Full flow: admission form → approve → payment → check-in → locker; reload and confirm everything is saved
- [ ] Log in as each role (Super Admin, Branch Manager, Receptionist, Trainer, Accountant)
- [ ] Phone, tablet and desktop; light and dark mode

### Deploy & handover
- [ ] Vercel environment variables for the admin portal and the admission form
- [ ] Supabase Auth redirect URLs set to the live domain
- [ ] **Custom email sending (SMTP)** for password-reset emails, e.g. a free Resend account; Supabase's built-in sender only allows a few emails per hour
- [ ] Create the client's Super Admin account; enter the real gym name, plans, prices and payment methods
- [ ] Clear out test data
- [ ] Give the client logins, live URLs and a short guide

---

## Later (not needed for delivery)

- [ ] **ZKTeco biometric integration**: first get the device model from Menu → System Info; then connect the Devices page to a `devices` table
- [ ] Real SMS sending (needs an SMS provider)
- [ ] "Upcoming" status for members whose start date is in the future
- [ ] Ask for confirmation before deleting a device
- [ ] Split the large JavaScript bundle
- [ ] Remove leftover folders on disk: `gym shop/`, `scratch/`, `vite-dev.log`
