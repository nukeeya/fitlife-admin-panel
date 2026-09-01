# FITLIFE ENTERPRISE GYM MANAGEMENT SYSTEM
## Full-Stack Backend Architecture & API Technical Specification

This document provides the complete structural blueprint, service design, REST API endpoints, Role-Based Access Control (RBAC), and Dynamic Discount Engine business logic for the FitLife Enterprise Gym Management System.

---

## 1. System Architecture & Component Diagram

```
+-----------------------------------------------------------------------------------+
|                           FRONTEND CLIENT (Vite + React 19)                       |
|  - Theme & Customizer Context (Dark/Light, Colors, Nav Styles, LTR/RTL, Boxed)    |
|  - Reactive Gym Store (Members, Approvals, Lockers, Billing, Staff, SMS, AI Plans)|
|  - Dynamic Discount Calculator (Live Real-Time % / Flat, VAT, Discount Reasons)   |
+-----------------------------------------------------------------------------------+
                                         │
                         HTTP REST / JSON (JWT Bearer Token)
                                         ▼
+-----------------------------------------------------------------------------------+
|                        EXPRESS.JS / NODE.JS API SERVER                            |
|-----------------------------------------------------------------------------------|
| Middlewares:                                                                      |
|   ├── authMiddleware.js       (JWT Token Verification & Session Recovery)         |
|   ├── rbacMiddleware.js       (Role-Based Permission Matrix Enforcement)          |
|   └── discountGuard.js        (Discount Privilege & Max % Limit Validator)        |
|                                                                                   |
| Controllers & Routers:                                                            |
|   ├── /api/v1/auth            (Login, Profile, Role Assignment)                   |
|   ├── /api/v1/dashboard       (14 Metrics, Live In/Out Telemetry, Charts)         |
|   ├── /api/v1/members         (CRUD, Dynamic Discount Engine, Profile 360)        |
|   ├── /api/v1/applications    (Online Admissions, Review, Discount Approval)      |
|   ├── /api/v1/lockers         (Assigned Lockers, Zones, Availability, Release)    |
|   ├── /api/v1/trainers        (Coaches, Client Roster, Specialty, Ratings)        |
|   ├── /api/v1/employees       (Staff Directory, Departments, Payroll Overview)    |
|   ├── /api/v1/accounts        (Invoices, Payment Collection, Expenses, P&L Sheet) |
|   ├── /api/v1/attendance      (Daily Present/Absent, Individual, Bulk Check-in)   |
|   ├── /api/v1/sms             (Campaign Broadcaster, Greenweb SMS API Gateway)    |
|   ├── /api/v1/plans           (Packages, Feature Matrix, Locker Bundles)          |
|   ├── /api/v1/ads             (Marketing Banners, Impressions, Click Telemetry)   |
|   ├── /api/v1/ai-workouts     (AI Workout Regime Generator & Client Assignment)   |
|   ├── /api/v1/ai-diets        (AI Macro & Calorie Meal Schedule Synthesizer)      |
|   ├── /api/v1/jobs            (Recruitment Vacancies & Candidate Pipeline)        |
|   ├── /api/v1/reports         (Revenue vs Expense, Retention Cohorts, CSV Export) |
|   └── /api/v1/roles           (RBAC Matrix, Max Discount Limits, Feature Access)  |
+-----------------------------------------------------------------------------------+
                                         │
                             Database Connection Pool
                                         ▼
+-----------------------------------------------------------------------------------+
|                     POSTGRESQL / MYSQL RELATIONAL DATABASE                        |
|  - Tables: users, roles, members, invoices, discounts, lockers, attendances...    |
|  - Triggers & Views: vw_dashboard_metrics, vw_daily_attendance_summary            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Dynamic Discount Engine Business Logic & Service

The dynamic discount engine calculates net revenue according to the following mathematical model:

$$\text{DiscountAmount} = \begin{cases} 
\min\left(\text{BasePrice} \times \frac{\text{DiscountValue}}{100}, \text{BasePrice}\right) & \text{if Type} = \text{'percentage'} \\
\min(\text{DiscountValue}, \text{BasePrice}) & \text{if Type} = \text{'flat'}
\end{cases}$$

$$\text{PriceAfterDiscount} = \text{BasePrice} - \text{DiscountAmount}$$
$$\text{TaxAmount} = \text{PriceAfterDiscount} \times \frac{\text{VATPercent}}{100}$$
$$\text{NetPayable} = \text{round}(\text{PriceAfterDiscount} + \text{TaxAmount})$$

### Backend Discount Middleware Implementation (`discountGuard.js`):
```javascript
export const validateDiscountPrivilege = (req, res, next) => {
  const { discountType, discountValue } = req.body;
  const userRole = req.user.role; // Attached from authMiddleware

  if (!discountValue || Number(discountValue) <= 0) {
    return next(); // No discount applied, proceed
  }

  if (!userRole.canApplyDiscount) {
    return res.status(403).json({
      success: false,
      message: `Access Denied: Role '${userRole.name}' does not have authority to grant discounts.`,
    });
  }

  if (discountType === 'percentage' && Number(discountValue) > userRole.maxDiscountPercent) {
    return res.status(403).json({
      success: false,
      message: `Discount limit exceeded: Maximum allowed for '${userRole.name}' is ${userRole.maxDiscountPercent}%.`,
    });
  }

  next();
};
```

---

## 3. Complete REST API Endpoints Specification

### A. Dashboard & Telemetry
- `GET /api/v1/dashboard/metrics`: Returns all 14 summary widget counters (Total members, Active/Inactive, Pending Reg, Plan counter, Live present/check-in/out, SMS balance, Staff count, Monthly sales, Today invoice sales, Today payment sales, Monthly expense, New admissions, Expiring today).
- `GET /api/v1/dashboard/activity-logs`: Returns `{ membersIn: [...], membersOut: [...] }`.

### B. Member Management & Dynamic Admission
- `GET /api/v1/members`: Query members with filters (`status`, `planId`, `search`, `page`, `limit`).
- `POST /api/v1/members/admission`: Create member with Dynamic Discount Engine. Automatically creates invoice with discounted net amount and triggers initial payment.
- `GET /api/v1/members/:id`: Full 360-degree profile (invoices, visits, attendance, assigned coach/locker).

### C. Approval Management
- `GET /api/v1/applications`: Pending online registrations.
- `POST /api/v1/applications/:id/approve`: Approve applicant with customized package & discount.
- `POST /api/v1/applications/:id/reject`: Reject with reason note.

### D. Accounts & Financials
- `GET /api/v1/accounts/invoices`: List of all issued invoices with discount breakdown.
- `POST /api/v1/accounts/payments`: Record payment receipt (bKASH, Cash, Card, Bank).
- `GET /api/v1/accounts/expenses`: Logged operational expenses.
- `POST /api/v1/accounts/expenses`: Add new expense.
- `GET /api/v1/accounts/balance-sheet`: Monthly Profit & Loss aggregation.

### E. Attendance System
- `POST /api/v1/attendance/check-in`: Record member check-in (RFID, Biometric, Manual).
- `POST /api/v1/attendance/:id/check-out`: Record checkout time.
- `POST /api/v1/attendance/bulk-check-in`: Bulk check in array of member IDs.
- `GET /api/v1/attendance/summary`: Daily/Weekly flow summary.

### F. Lockers, SMS, AI & System Roles
- `GET /api/v1/lockers`: Assigned lockers and locker zones.
- `POST /api/v1/lockers/:id/assign`: Assign member to locker.
- `POST /api/v1/sms/broadcast`: Dispatch SMS campaign and decrement credits.
- `POST /api/v1/ai/generate-workout`: AI workout split regime.
- `POST /api/v1/ai/generate-diet`: AI nutrition & macro plan.
- `GET /api/v1/roles`: RBAC matrix and discount limits.
- `PATCH /api/v1/roles/:id`: Update role permissions.
