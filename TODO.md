# FitLife Portal — TODO

**Rules**
1. Work on one task at a time: the one under **Now**.
2. New ideas go to **Later**. Don't start them mid-task.
3. Commit when a task is finished, then move the next item up into **Now**.

---

## Now

- [ ] **ZKTeco SenseFace 3A** (face + fingerprint, door lock, AC push / ADMS mode): scans reach the database
  - [x] Device probe `tools/device-probe/` to see what the machine sends (5 Nov 2026)
  - [ ] At the gym: run the probe; photos of System Info and Cloud Server Setting; collect `probe-log.jsonl`
  - [ ] Migration `022`: `devices`, `members.device_user_id`, `device_punches` (raw, no duplicates), scans → `attendance`; attendance date/time defaults in Dhaka time (now UTC)
  - [ ] Receiver: Supabase Edge Function, plus a relay for the fixed `/iclock/...` paths (Pages Function if the device can use HTTPS; plain HTTP needs a custom domain with "Always Use HTTPS" off); only registered serial numbers accepted
  - [ ] App: real Devices page; Device user ID on members; replace the simulated `RemoteEnrollModal`
  - Fingerprints and faces are enrolled on the machine and stay there; the database only links device user number → member

---

## Next (needed before delivery, in order)

### Stop fake data appearing on real screens
- [x] **Member Details**: load history from real invoices/payments, attendance and AI plans; show "Member not found" instead of a demo member (28 Oct 2026)
  - [x] Features & Perks tab: use the plan's real features (`plan_features`), not the hardcoded list (30 Oct 2026)
  - [x] Renew Subscription: saves through `renew_membership()` (migration `015`): invoice + payment + new expiry in one transaction (29 Oct 2026)
  - [x] Emergency relationship and medical conditions: migration `016` adds them to members, approval copies them from the application, editable on the profile; RFID removed from the Profile tab (30 Oct 2026)
  - [x] "Collected By" on payments: show the staff name (`payments.collected_by` → `users.name`) (30 Oct 2026)
- [x] **Monthly revenue split**: paid amounts only, one equal part per membership month, VAT excluded; migration `014` (`invoices.service_start`) run and checked with test data (29 Oct 2026)
  - [x] Payment dates: use Dhaka time, not UTC (`toDhakaDate()`; a payment between 00:00 and 06:00 landed on the previous day) (4 Nov 2026)
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
- [x] **Day passes / trials**: migrations `018` (invoices/payments can belong to a visitor, `plans.kind`) and `019` (`sell_day_pass()`); Sell Pass on Visitor Entry; Day-Pass Packages tab under Subscription Plans replaces the demo One-Day Trial tab (2 Nov 2026)
  - [ ] Edit a plan's or package's price (today: add a new one and remove the old)
- [x] **Job applicants**: staff add applicants (phone / walk-in / social media) to `job_applications`; migration `020` (notes, 'Shortlisted' stage, email optional); Post Vacancy saves; demo candidates removed (4 Nov 2026)
- [ ] **WhatsApp Business messaging (replaces SMS)**: the client connects their WhatsApp Business account and sends promotions, info and reminders (expiry, dues)
  - Official WhatsApp Business Platform (Cloud API) only; unofficial WhatsApp Web tools risk a number ban
  - Client needs: Meta Business account (ideally verified), WhatsApp Business account, phone number on the API, payment method on Meta (charged per message; check the current Bangladesh rates first)
  - Promotions and reminders use Meta-approved message templates; members must opt in (checkbox on the admission form, stored per member)
  - Sending and delivery updates go through a Supabase Edge Function; the access token never reaches the browser
  - Connect once together with the client and save the phone number ID and token in settings (one-click "Embedded Signup" only if this is sold to more gyms)
  - Rebuild the SMS Management page as WhatsApp (templates, campaigns, message log); check whether `sms_campaigns` can be reused

### Real defaults in forms
- [x] **Approval form**: starts on full payment at the plan's price; partial keeps an empty amount and a required due date (not in the past); the agreement note is only saved when something is due; no demo plan fallback (5 Nov 2026)
  - [x] Payment list: "Visa / Mastercard POS" sent `Bank Card`, which the database rejected; now uses `PAYMENT_METHODS` from `financeConfig.js` like the renewal form (4 Nov 2026)
- [ ] **Reports export**: branch name from settings, not "Dhanmondi"

### Cleanup
- [ ] Delete the unused `src/pages/Admissions.jsx`
- [ ] Remove leftover "mock" / "demo" text (Financial Reports, Monthly Closing "Demo Adjustment")
- [ ] Decide: keep or remove the Revenue Simulator
- [ ] Fix the lint warnings

### Keep within Supabase Pro limits
- [ ] **Compress photos before upload**: resize to about 400×400 px / 100–200 KB in the browser, in both the admin portal and the admission form (currently up to 15 MB, stored as-is)

### Testing
- [ ] Empty database test: no fake names anywhere
- [ ] Full flow: admission form → approve → payment → check-in; reload and confirm everything is saved
- [ ] Log in as each role (Super Admin, Branch Manager, Receptionist, Trainer, Accountant); test accounts `*@fitlife.test` created (7 Nov 2026)
  - [x] Refused updates/deletes showed "removed"/"saved": `requireChanged()` now treats 0 changed rows as refused (7 Nov 2026)
  - [ ] Role toggles (System Management) and branding fail without a message
  - [ ] Decide with the client what Trainers may do (today the same as Receptionist: members, payments, coaches)
- [ ] Phone, tablet and desktop; light and dark mode

### Deploy & handover
- [ ] **Move hosting to Cloudflare Pages** (Vercel Hobby is not for commercial use)
  - [x] Repo ready: `.node-version`, README deploy steps (7 Nov 2026)
  - [ ] Pages projects for the admin portal and the admission form, with environment variables
  - [ ] Supabase Auth Site URL and redirect URLs set to the new address; test login and password reset
  - [ ] Check the full flow on the new addresses, then delete the Vercel projects and `vercel.json` files
- [ ] Supabase Auth redirect URLs set to the live domain
- [ ] **Custom email sending (SMTP)** for password-reset emails, e.g. a free Resend account; Supabase's built-in sender only allows a few emails per hour
- [ ] Buy Supabase Pro **before the client enters real data**, then confirm daily backups appear under Database → Backups
- [ ] Create the client's Super Admin account; enter the real gym name, plans, prices and payment methods
- [ ] Clear out test data
- [ ] Give the client logins, live URLs and a short guide

---

## Later (not needed for delivery)

- [ ] **Rebuild locker management** (removed from the app on 29 Oct 2026 because it was faulty). The database still has `lockers`, `locker_assignments`, `members.locker_id` and the `p_locker_id` parameter of `create_member_with_invoice()`; the old screens are in git history before this commit. Include: assign at admission, extend on renewal, release on expiry
- [ ] **Public job apply form**: candidates apply themselves (e.g. on the admission-form site); needs an anonymous-insert rule on `job_applications` and spam protection. For now staff enter applicants (4 Nov 2026)
- [ ] **Block expired members at the door**: sync membership start/expiry to the SenseFace user's StartTime/EndTime (AC push commands); add members to the machine from the app
- [ ] "Upcoming" status for members whose start date is in the future
- [ ] Ask for confirmation before deleting a device
- [ ] Split the large JavaScript bundle
- [ ] Remove leftover folders on disk: `gym shop/`, `scratch/`, `vite-dev.log`
