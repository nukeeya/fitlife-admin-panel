# FitLife Portal — TODO

**Rules**
1. Work on one task at a time: the one under **Now**.
2. New ideas go to **Later**. Don't start them mid-task.
3. Commit when a task is finished, then move the next item up into **Now**.

---

## Now

- [x] **Check the database foundation** (backups moved to Deploy & handover: they need Supabase Pro)
  - [x] Migration `013` (membership start date) run and verified (26 Oct 2026)
  - [x] Confirm migrations `001`–`012` have all been run on the Supabase project (28 Oct 2026)
  - [x] Merge branch `portal-updates` into `main` and deploy (26 Oct 2026)

---

## Next (needed before delivery, in order)

### Stop fake data appearing on real screens
- [x] **Member Details**: load history from real invoices/payments, attendance and AI plans; show "Member not found" instead of a demo member (28 Oct 2026)
  - [x] Features & Perks tab: use the plan's real features (`plan_features`), not the hardcoded list (30 Oct 2026)
  - [x] Renew Subscription: saves through `renew_membership()` (migration `015`): invoice + payment + new expiry in one transaction (29 Oct 2026)
  - [x] Emergency relationship and medical conditions: migration `016` adds them to members, approval copies them from the application, editable on the profile; RFID removed from the Profile tab (30 Oct 2026)
  - [x] "Collected By" on payments: show the staff name (`payments.collected_by` → `users.name`) (30 Oct 2026)
- [x] **Monthly revenue split**: paid amounts only, one equal part per membership month, VAT excluded; migration `014` (`invoices.service_start`) run and checked with test data (29 Oct 2026)
  - [ ] Payment dates: use Dhaka time, not UTC (a payment between 00:00 and 06:00 lands on the previous day, and on the 1st in the previous month)
- [x] **Empty tables** (Members, Trainers, Employees): show an empty list with "Add your first…", not demo records (29 Oct 2026)
- [x] **Failed loads**: show an error with a Retry button instead of demo data, on Members, Trainers and Employees (`DataState`, `loadErrors`) (29 Oct 2026)
  - [ ] Use `DataState` on the other list pages too (Attendance, Finance, Applications, Diet/Workout plans…)
- [x] **Dashboard**: calculate the male/female percentages (currently fixed at 72% / 28%) (29 Oct 2026)
  - [x] Trend arrows from real data; Today Collected / Monthly Revenue now count payments by payment date (29 Oct 2026)
  - [ ] Member status is not updated automatically when a membership expires or starts (Dashboard counts rely on it)
  - [x] Peak Hours chart: check-ins per hour over the last 30 days (30 Oct 2026)
  - [x] Weekly chart: no made-up fallback; check-ins and revenue (payments) as two charts (30 Oct 2026)
- [x] Remove the demo records from `FALLBACK_DATA` and delete `src/data/mockProfiles.js` (also `src/data/gymData.js`) (29 Oct 2026)

### Connect the pages that have no database
- [x] **Visitor Entry**: new `visitors` table (migration `017`); dates default to today; handled-by set by the database (30 Oct 2026)
- [ ] **Day passes / trials**: real prices and payments through Finance (Visitor Entry no longer records fees; the One-Day Trial tab under Subscription Plans is still demo data)
- [ ] **Job applicants**: use the existing `job_applications` table
- [ ] **WhatsApp Business messaging (replaces SMS)**: the client connects their WhatsApp Business account and sends promotions, info and reminders (expiry, dues)
  - Official WhatsApp Business Platform (Cloud API) only; unofficial WhatsApp Web tools risk a number ban
  - Client needs: Meta Business account (ideally verified), WhatsApp Business account, phone number on the API, payment method on Meta (charged per message; check the current Bangladesh rates first)
  - Promotions and reminders use Meta-approved message templates; members must opt in (checkbox on the admission form, stored per member)
  - Sending and delivery updates go through a Supabase Edge Function; the access token never reaches the browser
  - Connect once together with the client and save the phone number ID and token in settings (one-click "Embedded Signup" only if this is sold to more gyms)
  - Rebuild the SMS Management page as WhatsApp (templates, campaigns, message log); check whether `sms_campaigns` can be reused

### Real defaults in forms
- [ ] **Approval form**: first payment, due date and notes based on the chosen plan, not demo values
  - [ ] Payment list: "Visa / Mastercard POS" sends `Bank Card`, which the database rejects; use `PAYMENT_METHODS` from `financeConfig.js` like the renewal form
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
- [ ] Full flow: admission form → approve → payment → check-in; reload and confirm everything is saved
- [ ] Log in as each role (Super Admin, Branch Manager, Receptionist, Trainer, Accountant)
- [ ] Phone, tablet and desktop; light and dark mode

### Deploy & handover
- [ ] Vercel environment variables for the admin portal and the admission form
- [ ] Supabase Auth redirect URLs set to the live domain
- [ ] **Custom email sending (SMTP)** for password-reset emails, e.g. a free Resend account; Supabase's built-in sender only allows a few emails per hour
- [ ] Buy Supabase Pro **before the client enters real data**, then confirm daily backups appear under Database → Backups
- [ ] Create the client's Super Admin account; enter the real gym name, plans, prices and payment methods
- [ ] Clear out test data
- [ ] Give the client logins, live URLs and a short guide

---

## Later (not needed for delivery)

- [ ] **Rebuild locker management** (removed from the app on 29 Oct 2026 because it was faulty). The database still has `lockers`, `locker_assignments`, `members.locker_id` and the `p_locker_id` parameter of `create_member_with_invoice()`; the old screens are in git history before this commit. Include: assign at admission, extend on renewal, release on expiry
- [ ] **ZKTeco biometric integration**: first get the device model from Menu → System Info; then connect the Devices page to a `devices` table. Decide then how a member links to the device (RFID card number, device user ID) and add that column to `members`
- [ ] "Upcoming" status for members whose start date is in the future
- [ ] Ask for confirmation before deleting a device
- [ ] Split the large JavaScript bundle
- [ ] Remove leftover folders on disk: `gym shop/`, `scratch/`, `vite-dev.log`
