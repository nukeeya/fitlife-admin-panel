-- =============================================================================
-- FITLIFE ENTERPRISE GYM MANAGEMENT SYSTEM - DATABASE SCHEMA (PostgreSQL / MySQL)
-- =============================================================================

-- 1. ROLES & PERMISSIONS (System Management & Access Control)
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Super Admin', 'Branch Manager', 'Receptionist', 'Trainer', 'Accountant'
    description TEXT,
    can_apply_discount BOOLEAN DEFAULT FALSE,
    max_discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    can_approve_members BOOLEAN DEFAULT FALSE,
    can_manage_lockers BOOLEAN DEFAULT TRUE,
    can_manage_finances BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL, -- e.g., 'members', 'accounts', 'attendance', 'discounts'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'approve'
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SUBSCRIPTION PLANS & FEATURES
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g. 'Basic', 'Standard', 'Premium', 'Elite VIP'
    code VARCHAR(30) UNIQUE NOT NULL,
    billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
    duration_days INT DEFAULT 30,
    base_price NUMERIC(10, 2) NOT NULL, -- Original Base Price
    vat_percentage NUMERIC(5, 2) DEFAULT 5.00,
    is_popular BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_features (
    id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_name VARCHAR(150) NOT NULL,
    is_included BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS plan_lockers (
    id SERIAL PRIMARY KEY,
    plan_id INT REFERENCES subscription_plans(id) ON DELETE CASCADE,
    locker_zone VARCHAR(50) NOT NULL, -- 'Standard Zone', 'Executive Zone', 'VIP Suite'
    is_complimentary BOOLEAN DEFAULT FALSE,
    additional_fee NUMERIC(10, 2) DEFAULT 0.00
);

-- 3. TRAINERS & EMPLOYEES
CREATE TABLE IF NOT EXISTS trainers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL, -- 'Strength & Conditioning', 'Cardio & HIIT', 'Yoga', 'CrossFit', 'Nutrition'
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    rating NUMERIC(2, 1) DEFAULT 5.0,
    active_clients INT DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    monthly_salary NUMERIC(10, 2) DEFAULT 0.00,
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    employee_code VARCHAR(30) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'Front Desk Manager', 'Floor Supervisor', 'Accountant', etc.
    department VARCHAR(50) NOT NULL, -- 'Reception', 'Operations', 'Finance', 'Maintenance'
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    joined_date DATE NOT NULL,
    monthly_salary NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'On Leave', 'Terminated'
    avatar VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_payrolls (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- '2026-08'
    base_salary NUMERIC(10, 2) NOT NULL,
    bonus NUMERIC(10, 2) DEFAULT 0.00,
    deductions NUMERIC(10, 2) DEFAULT 0.00,
    net_paid NUMERIC(10, 2) NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. LOCKER MANAGEMENT
CREATE TABLE IF NOT EXISTS lockers (
    id SERIAL PRIMARY KEY,
    locker_number VARCHAR(20) UNIQUE NOT NULL,
    zone VARCHAR(50) NOT NULL, -- 'Zone A', 'Zone B', 'Zone VIP'
    type VARCHAR(30) DEFAULT 'Standard', -- 'Standard', 'Digital', 'VIP Executive'
    status VARCHAR(20) DEFAULT 'Available', -- 'Available', 'Occupied', 'Maintenance'
    monthly_fee NUMERIC(10, 2) DEFAULT 500.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MEMBERS & ONLINE APPLICATIONS
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    member_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., 'FLM-8041'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(20) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    emergency_contact VARCHAR(20),
    address TEXT,
    avatar VARCHAR(255),
    
    -- Subscription & Locker details
    plan_id INT REFERENCES subscription_plans(id),
    trainer_id INT REFERENCES trainers(id) ON DELETE SET NULL,
    locker_id INT REFERENCES lockers(id) ON DELETE SET NULL,
    
    -- Status & Dates
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Inactive', 'Expiring', 'Expired'
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    total_visits INT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locker_assignments (
    id SERIAL PRIMARY KEY,
    locker_id INT REFERENCES lockers(id) ON DELETE CASCADE,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS member_applications (
    id SERIAL PRIMARY KEY,
    application_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., 'APP-9921'
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    gender VARCHAR(10),
    desired_plan_id INT REFERENCES subscription_plans(id),
    fitness_goal VARCHAR(100),
    medical_conditions TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
    rejection_reason TEXT,
    approved_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. DYNAMIC DISCOUNT ENGINE & INVOICES / PAYMENTS
CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'flat'
    discount_value NUMERIC(10, 2) NOT NULL, -- e.g. 15.00 for 15% or 500.00 for 500 BDT
    discount_amount NUMERIC(10, 2) NOT NULL, -- Calculated monetary discount in currency
    reason_note TEXT, -- e.g. 'Seasonal Promo', 'Referral', 'Management Approval'
    applied_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'INV-2026-0042'
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    plan_id INT REFERENCES subscription_plans(id),
    discount_id INT REFERENCES discounts(id) ON DELETE SET NULL,
    
    base_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_payable NUMERIC(10, 2) NOT NULL, -- Actual discounted revenue
    
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    due_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Paid', -- 'Paid', 'Partial', 'Due'
    payment_method VARCHAR(30) DEFAULT 'CASH', -- 'CASH', 'bKASH', 'CARD', 'BANK'
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INT REFERENCES invoices(id) ON DELETE CASCADE,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- 'CASH', 'bKASH', 'CARD', 'BANK'
    transaction_reference VARCHAR(100),
    collected_by INT REFERENCES users(id),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Equipment Maintenance', 'Utilities', 'Salaries', 'Supplements', 'Marketing', 'Rent'
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) DEFAULT 'BANK',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    approved_by INT REFERENCES users(id),
    receipt_doc VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ATTENDANCE SYSTEM
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NOT NULL,
    check_out_time TIME,
    status VARCHAR(20) DEFAULT 'In', -- 'In', 'Out'
    method VARCHAR(30) DEFAULT 'Manual Admin', -- 'RFID Card', 'Biometric', 'Manual Admin', 'Barcode'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. SMS CAMPAIGNS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS sms_settings (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) DEFAULT 'Greenweb Bangladesh',
    api_key VARCHAR(255),
    sender_id VARCHAR(50) DEFAULT 'FITLIFE',
    remaining_balance INT DEFAULT 1420,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'All Members', 'Active Only', 'Expiring Members', 'Custom List'
    message TEXT NOT NULL,
    recipient_count INT NOT NULL,
    cost_credits INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Sent', -- 'Draft', 'Sent', 'Scheduled'
    sent_by INT REFERENCES users(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. ADVERTISEMENTS & MARKETING
CREATE TABLE IF NOT EXISTS advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    banner_url VARCHAR(255) NOT NULL,
    target_url VARCHAR(255),
    position VARCHAR(50) DEFAULT 'Dashboard Header', -- 'Dashboard Header', 'Member Mobile App', 'Locker TV Display'
    impressions INT DEFAULT 0,
    clicks INT DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active', -- 'Active', 'Scheduled', 'Expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. AI WORKOUT & DIET PLANS
CREATE TABLE IF NOT EXISTS ai_workout_plans (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    plan_title VARCHAR(150) NOT NULL,
    fitness_goal VARCHAR(100) NOT NULL, -- 'Hypertrophy', 'Fat Loss', 'Strength', 'Endurance'
    experience_level VARCHAR(50) NOT NULL, -- 'Beginner', 'Intermediate', 'Advanced'
    days_per_week INT DEFAULT 4,
    routine_json JSONB NOT NULL, -- Array of days with exercise names, sets, reps, rest
    ai_generated_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_diet_plans (
    id SERIAL PRIMARY KEY,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    plan_title VARCHAR(150) NOT NULL,
    target_goal VARCHAR(100) NOT NULL, -- 'Muscle Building', 'Fat Loss Shred', 'Balanced Wellness'
    daily_calories INT NOT NULL,
    protein_grams INT NOT NULL,
    carbs_grams INT NOT NULL,
    fats_grams INT NOT NULL,
    meals_json JSONB NOT NULL, -- Array of meal times, ingredients, calories
    dietary_preference VARCHAR(50) DEFAULT 'Non-Veg', -- 'Non-Veg', 'Vegetarian', 'Keto', 'High Protein'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. JOB POSTINGS & RECRUITMENT
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    job_title VARCHAR(150) NOT NULL,
    department VARCHAR(50) NOT NULL, -- 'Fitness', 'Reception', 'Maintenance', 'Management'
    job_type VARCHAR(30) DEFAULT 'Full Time', -- 'Full Time', 'Part Time', 'Contract'
    salary_range VARCHAR(50),
    vacancies INT DEFAULT 1,
    description TEXT,
    requirements TEXT,
    status VARCHAR(20) DEFAULT 'Open', -- 'Open', 'Closed', 'Draft'
    posted_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS job_applications (
    id SERIAL PRIMARY KEY,
    job_id INT REFERENCES job_postings(id) ON DELETE CASCADE,
    candidate_name VARCHAR(100) NOT NULL,
    candidate_phone VARCHAR(20) NOT NULL,
    candidate_email VARCHAR(150) NOT NULL,
    resume_url VARCHAR(255),
    experience_years NUMERIC(3, 1),
    status VARCHAR(20) DEFAULT 'Applied', -- 'Applied', 'Screened', 'Interview', 'Hired', 'Rejected'
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- =============================================================================
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_attendances_date ON attendances(attendance_date);
CREATE INDEX idx_attendances_member ON attendances(member_id);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_member ON invoices(member_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_lockers_status ON lockers(status);

-- =============================================================================
-- REAL-TIME ANALYTICS VIEWS
-- =============================================================================
CREATE OR REPLACE VIEW vw_dashboard_metrics AS
SELECT
    (SELECT COUNT(*) FROM members) AS total_members,
    (SELECT COUNT(*) FROM members WHERE status = 'Active') AS active_members,
    (SELECT COUNT(*) FROM members WHERE status = 'Inactive' OR status = 'Expired') AS inactive_members,
    (SELECT COUNT(*) FROM member_applications WHERE status = 'Pending') AS pending_applications,
    (SELECT COUNT(*) FROM subscription_plans WHERE status = 'Active') AS total_plans,
    (SELECT COUNT(*) FROM employees WHERE status = 'Active') AS total_employees,
    (SELECT remaining_balance FROM sms_settings LIMIT 1) AS remaining_sms,
    (SELECT COALESCE(SUM(net_payable), 0) FROM invoices WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_sales,
    (SELECT COALESCE(SUM(net_payable), 0) FROM invoices WHERE invoice_date = CURRENT_DATE) AS today_sales_invoice,
    (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE payment_date::date = CURRENT_DATE) AS today_sales_payment,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_expense,
    (SELECT COUNT(*) FROM members WHERE DATE_TRUNC('month', joined_date) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_admissions,
    (SELECT COUNT(*) FROM members WHERE expiry_date = CURRENT_DATE) AS expiring_today,
    (SELECT COUNT(*) FROM attendances WHERE attendance_date = CURRENT_DATE AND status = 'In') AS present_members_now;
