-- ============================================
-- MOCK DATA SCRIPT FOR FAKTURIO
-- User: cebotarev.dan@gmail.com
-- Clerk ID: user_37trboIbaF6Q9ePwTtDJCzn5N19
-- ============================================
-- This script will DELETE all existing data for this user and insert fresh mock data
-- Covers: Full year 2024 + Full year 2025

-- Set the user ID variable
DO $$
DECLARE
  v_user_id TEXT := 'user_37trboIbaF6Q9ePwTtDJCzn5N19';  -- Clerk User ID
  
  -- Contact IDs
  v_contact_1 UUID;
  v_contact_2 UUID;
  v_contact_3 UUID;
  v_contact_4 UUID;
  v_contact_5 UUID;
  
  -- Bank Account IDs
  v_bank_1 UUID;
  v_bank_2 UUID;
  
  -- Project IDs
  v_project_1 UUID;
  v_project_2 UUID;
  v_project_3 UUID;
  v_project_4 UUID;
  v_project_5 UUID;
  v_project_6 UUID;
  v_project_7 UUID;
  v_project_8 UUID;
  v_project_9 UUID;
  v_project_10 UUID;
  v_project_11 UUID;
  v_project_12 UUID;
  v_project_13 UUID;
  v_project_14 UUID;
  v_project_15 UUID;
  
BEGIN

-- ============================================
-- 0. DELETE ALL EXISTING DATA FOR THIS USER
-- ============================================
-- Delete in order respecting foreign key constraints
DELETE FROM time_entries WHERE user_id = v_user_id;
DELETE FROM description_suggestions WHERE user_id = v_user_id;
DELETE FROM expenses WHERE user_id = v_user_id;
DELETE FROM invoices WHERE user_id = v_user_id;
DELETE FROM projects WHERE user_id = v_user_id;
DELETE FROM contacts WHERE user_id = v_user_id;
DELETE FROM bank_accounts WHERE user_id = v_user_id;
DELETE FROM vat_settings WHERE user_id = v_user_id;
DELETE FROM profiles WHERE id = v_user_id;

RAISE NOTICE 'Deleted all existing data for user: %', v_user_id;

-- ============================================
-- 1. PROFILE
-- ============================================
INSERT INTO profiles (id, email, name, company_name, address, city, postal_code, country, phone, vat_number, canton, account_currency)
VALUES (
  v_user_id,
  'cebotarev.dan@gmail.com',
  'Daniil Chebotarev',
  'Chebotarev Digital Solutions',
  'Bahnhofstrasse 42',
  'Zürich',
  '8001',
  'Switzerland',
  '+41 44 123 45 67',
  'CHE-123.456.789',
  'ZH',
  'CHF'
);

-- ============================================
-- 2. VAT SETTINGS
-- ============================================
INSERT INTO vat_settings (user_id, mode, vat_number, allow_custom_rate, default_rate)
VALUES (v_user_id, 'additive', 'CHE-123.456.789', true, 8.1);

-- ============================================
-- 3. BANK ACCOUNTS
-- ============================================
INSERT INTO bank_accounts (id, user_id, name, iban, bic, bank_name, is_default)
VALUES 
  (gen_random_uuid(), v_user_id, 'UBS Business', 'CH93 0027 6276 1234 5678 9', 'UBSWCHZH80A', 'UBS AG', true),
  (gen_random_uuid(), v_user_id, 'PostFinance', 'CH45 0900 0000 8765 4321 0', 'POFICHBEXXX', 'PostFinance AG', false);

-- Get bank IDs
SELECT id INTO v_bank_1 FROM bank_accounts WHERE user_id = v_user_id AND is_default = true LIMIT 1;
SELECT id INTO v_bank_2 FROM bank_accounts WHERE user_id = v_user_id AND is_default = false LIMIT 1;

-- ============================================
-- 4. CONTACTS (Customers)
-- ============================================
INSERT INTO contacts (id, user_id, type, name, company_name, email, phone, address, city, postal_code, country, vat_number, notes)
VALUES 
  (gen_random_uuid(), v_user_id, 'customer', 'Hans Weber', 'Weber Consulting AG', 'hans.weber@webconsult.ch', '+41 44 234 56 78', 'Limmatstrasse 123', 'Zürich', '8005', 'Switzerland', 'CHE-111.222.333', 'Long-term client, prefers email invoices'),
  (gen_random_uuid(), v_user_id, 'customer', 'Sarah Keller', 'Keller & Partners', 'sarah@keller-partners.ch', '+41 31 345 67 89', 'Bundesgasse 10', 'Bern', '3011', 'Switzerland', 'CHE-444.555.666', 'New client since 2024'),
  (gen_random_uuid(), v_user_id, 'customer', 'Thomas Brunner', 'Brunner Tech Solutions', 'thomas@brunnertech.ch', '+41 61 456 78 90', 'Marktplatz 5', 'Basel', '4001', 'Switzerland', 'CHE-777.888.999', NULL),
  (gen_random_uuid(), v_user_id, 'customer', 'Anna Schmidt', 'Schmidt Design Studio', 'anna@schmidtdesign.ch', '+41 22 567 89 01', 'Rue du Rhône 45', 'Geneva', '1204', 'Switzerland', NULL, 'Freelance designer, flexible payment terms'),
  (gen_random_uuid(), v_user_id, 'supplier', 'Office Pro GmbH', 'Office Pro GmbH', 'orders@officepro.ch', '+41 44 678 90 12', 'Industriestrasse 50', 'Winterthur', '8400', 'Switzerland', 'CHE-222.333.444', 'Office supplies vendor');

-- Get contact IDs
SELECT id INTO v_contact_1 FROM contacts WHERE user_id = v_user_id AND name = 'Hans Weber' LIMIT 1;
SELECT id INTO v_contact_2 FROM contacts WHERE user_id = v_user_id AND name = 'Sarah Keller' LIMIT 1;
SELECT id INTO v_contact_3 FROM contacts WHERE user_id = v_user_id AND name = 'Thomas Brunner' LIMIT 1;
SELECT id INTO v_contact_4 FROM contacts WHERE user_id = v_user_id AND name = 'Anna Schmidt' LIMIT 1;
SELECT id INTO v_contact_5 FROM contacts WHERE user_id = v_user_id AND name = 'Office Pro GmbH' LIMIT 1;

-- ============================================
-- 5. PROJECTS (15 total)
-- ============================================
INSERT INTO projects (id, user_id, contact_id, name, description, status, hourly_rate, budget, currency, start_date, end_date)
VALUES 
  -- 2024 Projects (5)
  (gen_random_uuid(), v_user_id, v_contact_1, 'Corporate Branding', 'Brand identity and guidelines', 'completed', 145.00, 8500.00, 'CHF', '2024-01-15', '2024-03-30'),
  (gen_random_uuid(), v_user_id, v_contact_2, 'Newsletter System', 'Automated email marketing platform', 'completed', 155.00, 9800.00, 'CHF', '2024-02-01', '2024-05-15'),
  (gen_random_uuid(), v_user_id, v_contact_3, 'Inventory Dashboard', 'Real-time stock management system', 'completed', 140.00, 14500.00, 'CHF', '2024-04-01', '2024-07-31'),
  (gen_random_uuid(), v_user_id, v_contact_4, 'Portfolio Website', 'Designer portfolio with CMS', 'completed', 135.00, 6200.00, 'CHF', '2024-06-01', '2024-08-15'),
  (gen_random_uuid(), v_user_id, v_contact_3, 'CRM Integration', 'Salesforce integration with existing systems', 'completed', 140.00, 12000.00, 'CHF', '2024-09-01', '2024-12-15'),
  
  -- 2025 Projects (10)
  (gen_random_uuid(), v_user_id, v_contact_1, 'Website Redesign', 'Complete redesign of corporate website including CMS integration', 'completed', 150.00, 25000.00, 'CHF', '2025-01-01', '2025-06-30'),
  (gen_random_uuid(), v_user_id, v_contact_2, 'Mobile App Development', 'iOS and Android app for customer portal', 'completed', 175.00, 45000.00, 'CHF', '2025-02-01', '2025-08-31'),
  (gen_random_uuid(), v_user_id, v_contact_3, 'API Gateway', 'Centralized API management system', 'completed', 165.00, 18500.00, 'CHF', '2025-03-01', '2025-06-30'),
  (gen_random_uuid(), v_user_id, v_contact_4, 'E-commerce Platform', 'Full online shop with payment integration', 'completed', 160.00, 35000.00, 'CHF', '2025-05-01', '2025-10-31'),
  (gen_random_uuid(), v_user_id, v_contact_1, 'Data Analytics Dashboard', 'Business intelligence reporting tool', 'completed', 170.00, 22000.00, 'CHF', '2025-06-01', '2025-09-30'),
  (gen_random_uuid(), v_user_id, v_contact_2, 'Customer Portal V2', 'Enhanced customer self-service portal', 'completed', 155.00, 16000.00, 'CHF', '2025-07-01', '2025-10-15'),
  (gen_random_uuid(), v_user_id, v_contact_3, 'Microservices Migration', 'Legacy system modernization', 'completed', 175.00, 28000.00, 'CHF', '2025-08-01', '2025-11-30'),
  (gen_random_uuid(), v_user_id, v_contact_4, 'Booking System', 'Appointment scheduling platform', 'completed', 150.00, 12500.00, 'CHF', '2025-09-01', '2025-12-15'),
  (gen_random_uuid(), v_user_id, v_contact_1, 'AI Chatbot Integration', 'Customer service chatbot using GPT-4', 'active', 180.00, 18000.00, 'CHF', '2025-11-01', '2026-02-28'),
  (gen_random_uuid(), v_user_id, v_contact_2, 'Payment Gateway Upgrade', 'Multi-currency payment processing', 'active', 165.00, 15000.00, 'CHF', '2025-12-01', '2026-03-31');

-- Get project IDs
SELECT id INTO v_project_1 FROM projects WHERE user_id = v_user_id AND name = 'Corporate Branding' LIMIT 1;
SELECT id INTO v_project_2 FROM projects WHERE user_id = v_user_id AND name = 'Newsletter System' LIMIT 1;
SELECT id INTO v_project_3 FROM projects WHERE user_id = v_user_id AND name = 'Inventory Dashboard' LIMIT 1;
SELECT id INTO v_project_4 FROM projects WHERE user_id = v_user_id AND name = 'Portfolio Website' LIMIT 1;
SELECT id INTO v_project_5 FROM projects WHERE user_id = v_user_id AND name = 'CRM Integration' LIMIT 1;
SELECT id INTO v_project_6 FROM projects WHERE user_id = v_user_id AND name = 'Website Redesign' LIMIT 1;
SELECT id INTO v_project_7 FROM projects WHERE user_id = v_user_id AND name = 'Mobile App Development' LIMIT 1;
SELECT id INTO v_project_8 FROM projects WHERE user_id = v_user_id AND name = 'API Gateway' LIMIT 1;
SELECT id INTO v_project_9 FROM projects WHERE user_id = v_user_id AND name = 'E-commerce Platform' LIMIT 1;
SELECT id INTO v_project_10 FROM projects WHERE user_id = v_user_id AND name = 'Data Analytics Dashboard' LIMIT 1;
SELECT id INTO v_project_11 FROM projects WHERE user_id = v_user_id AND name = 'Customer Portal V2' LIMIT 1;
SELECT id INTO v_project_12 FROM projects WHERE user_id = v_user_id AND name = 'Microservices Migration' LIMIT 1;
SELECT id INTO v_project_13 FROM projects WHERE user_id = v_user_id AND name = 'Booking System' LIMIT 1;
SELECT id INTO v_project_14 FROM projects WHERE user_id = v_user_id AND name = 'AI Chatbot Integration' LIMIT 1;
SELECT id INTO v_project_15 FROM projects WHERE user_id = v_user_id AND name = 'Payment Gateway Upgrade' LIMIT 1;

-- ============================================
-- 6. INVOICES (full year with varied amounts)
-- ============================================
INSERT INTO invoices (user_id, contact_id, project_id, bank_account_id, invoice_number, status, currency, issued_on, due_date, paid_date, subtotal, vat_amount, vat_rate, total, from_info, to_info, items, notes, payment_terms)
VALUES 
  -- JANUARY 2024
  (v_user_id, v_contact_1, NULL, v_bank_1, '2024-001', 'paid', 'CHF', '2024-01-15', '2024-02-15', '2024-02-10',
   4200.00, 340.20, 8.1, 4540.20,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "28", "um": "hours", "description": "Website maintenance Q1", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   'Quarterly maintenance', '30 days'),

  -- FEBRUARY 2024
  (v_user_id, v_contact_4, NULL, v_bank_1, '2024-002', 'paid', 'CHF', '2024-02-20', '2024-03-20', '2024-03-18',
   1875.00, 151.88, 8.1, 2026.88,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "15", "um": "hours", "description": "UI design consultation", "pricePerUm": "125", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- MARCH 2024
  (v_user_id, v_contact_2, NULL, v_bank_1, '2024-003', 'paid', 'CHF', '2024-03-10', '2024-04-10', '2024-04-05',
   6300.00, 510.30, 8.1, 6810.30,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "36", "um": "hours", "description": "App prototype development", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   'Prototype phase completed', '30 days'),
  
  (v_user_id, v_contact_1, NULL, v_bank_1, '2024-004', 'paid', 'CHF', '2024-03-25', '2024-04-25', '2024-04-22',
   2250.00, 182.25, 8.1, 2432.25,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "15", "um": "hours", "description": "SEO optimization", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- APRIL 2024
  (v_user_id, v_contact_3, NULL, v_bank_1, '2024-005', 'paid', 'CHF', '2024-04-15', '2024-05-15', '2024-05-12',
   5600.00, 453.60, 8.1, 6053.60,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "Database optimization", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   'Performance improvements', '30 days'),

  -- MAY 2024
  (v_user_id, v_contact_4, NULL, v_bank_1, '2024-006', 'paid', 'CHF', '2024-05-08', '2024-06-08', '2024-06-03',
   3125.00, 253.13, 8.1, 3378.13,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "25", "um": "hours", "description": "Brand identity implementation", "pricePerUm": "125", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_2, NULL, v_bank_1, '2024-007', 'paid', 'CHF', '2024-05-22', '2024-06-22', '2024-06-19',
   8750.00, 708.75, 8.1, 9458.75,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "Mobile app MVP", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   'MVP delivery', '30 days'),

  -- JUNE 2024
  (v_user_id, v_contact_1, NULL, v_bank_1, '2024-008', 'paid', 'CHF', '2024-06-12', '2024-07-12', '2024-07-08',
   4500.00, 364.50, 8.1, 4864.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "E-commerce integration", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- JULY 2024
  (v_user_id, v_contact_3, NULL, v_bank_1, '2024-009', 'paid', 'CHF', '2024-07-18', '2024-08-18', '2024-08-15',
   7000.00, 567.00, 8.1, 7567.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "API development", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   'API endpoints complete', '30 days'),

  -- AUGUST 2024
  (v_user_id, v_contact_2, NULL, v_bank_1, '2024-010', 'paid', 'CHF', '2024-08-05', '2024-09-05', '2024-09-02',
   5250.00, 425.25, 8.1, 5675.25,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "App testing and QA", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- SEPTEMBER 2024
  (v_user_id, v_contact_1, NULL, v_bank_1, '2024-011', 'paid', 'CHF', '2024-09-10', '2024-10-10', '2024-10-07',
   3750.00, 303.75, 8.1, 4053.75,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "25", "um": "hours", "description": "Content migration", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_3, v_project_3, v_bank_1, '2024-012', 'paid', 'CHF', '2024-09-20', '2024-10-20', '2024-10-18',
   4200.00, 340.20, 8.1, 4540.20,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "CRM Integration - Phase 1", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   'CRM project kickoff', '30 days'),

  -- OCTOBER 2024
  (v_user_id, v_contact_4, NULL, v_bank_1, '2024-013', 'paid', 'CHF', '2024-10-08', '2024-11-08', '2024-11-05',
   2000.00, 162.00, 8.1, 2162.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "16", "um": "hours", "description": "Logo redesign", "pricePerUm": "125", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_3, v_project_3, v_bank_1, '2024-014', 'paid', 'CHF', '2024-10-25', '2024-11-25', '2024-11-22',
   5600.00, 453.60, 8.1, 6053.60,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "CRM Integration - Phase 2", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- NOVEMBER 2024
  (v_user_id, v_contact_1, NULL, v_bank_1, '2024-015', 'paid', 'CHF', '2024-11-12', '2024-12-12', '2024-12-10',
   6000.00, 486.00, 8.1, 6486.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "Holiday campaign site", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   'Black Friday campaign', '30 days'),
   
  (v_user_id, v_contact_4, NULL, v_bank_1, '2024-016', 'overdue', 'CHF', '2024-11-15', '2024-12-15', NULL,
   2500.00, 202.50, 8.1, 2702.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "20", "um": "hours", "description": "Design consultation", "pricePerUm": "125", "vat": "8.1"}]'::jsonb,
   'REMINDER: Payment overdue', '30 days'),

  -- DECEMBER 2024
  (v_user_id, v_contact_3, v_project_3, v_bank_1, '2024-017', 'paid', 'CHF', '2024-12-15', '2025-01-15', '2025-01-10',
   12000.00, 972.00, 8.1, 12972.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "1", "um": "project", "description": "CRM Integration - Final Payment", "pricePerUm": "12000", "vat": "8.1"}]'::jsonb,
   'Project completed successfully', '30 days'),
   
  (v_user_id, v_contact_2, NULL, v_bank_1, '2024-018', 'paid', 'CHF', '2024-12-20', '2025-01-20', '2025-01-15',
   3500.00, 283.50, 8.1, 3783.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "20", "um": "hours", "description": "Year-end app updates", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- JANUARY 2025
  (v_user_id, v_contact_2, v_project_2, v_bank_1, '2025-001', 'paid', 'CHF', '2025-01-05', '2025-02-05', '2025-02-02',
   8750.00, 708.75, 8.1, 9458.75,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "Mobile App - Sprint 1", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   'Sprint 1 deliverables', '30 days'),
   
  (v_user_id, v_contact_1, v_project_1, v_bank_1, '2025-002', 'paid', 'CHF', '2025-01-20', '2025-02-20', '2025-02-18',
   6000.00, 486.00, 8.1, 6486.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "Website Redesign - Phase 1", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- FEBRUARY 2025
  (v_user_id, v_contact_2, v_project_2, v_bank_1, '2025-003', 'paid', 'CHF', '2025-02-10', '2025-03-10', '2025-03-08',
   7000.00, 567.00, 8.1, 7567.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "Mobile App - Sprint 2", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_1, v_project_1, v_bank_1, '2025-004', 'paid', 'CHF', '2025-02-25', '2025-03-25', '2025-03-22',
   4500.00, 364.50, 8.1, 4864.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "Website Redesign - Phase 2", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- MARCH 2025
  (v_user_id, v_contact_3, NULL, v_bank_1, '2025-005', 'paid', 'CHF', '2025-03-12', '2025-04-12', '2025-04-10',
   3500.00, 283.50, 8.1, 3783.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "25", "um": "hours", "description": "Support and maintenance", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_2, v_project_2, v_bank_1, '2025-006', 'paid', 'CHF', '2025-03-28', '2025-04-28', '2025-04-25',
   10500.00, 850.50, 8.1, 11350.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "60", "um": "hours", "description": "Mobile App - Sprint 3", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   'Core features complete', '30 days'),

  -- APRIL 2025
  (v_user_id, v_contact_1, v_project_1, v_bank_1, '2025-007', 'paid', 'CHF', '2025-04-15', '2025-05-15', '2025-05-12',
   7500.00, 607.50, 8.1, 8107.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "Website Redesign - Phase 3", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_4, NULL, v_bank_1, '2025-008', 'paid', 'CHF', '2025-04-22', '2025-05-22', '2025-05-20',
   2500.00, 202.50, 8.1, 2702.50,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "20", "um": "hours", "description": "Branding consultation", "pricePerUm": "125", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- MAY 2025
  (v_user_id, v_contact_4, v_project_4, v_bank_1, '2025-009', 'paid', 'CHF', '2025-05-08', '2025-06-08', '2025-06-05',
   8000.00, 648.00, 8.1, 8648.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "E-commerce - Initial setup", "pricePerUm": "160", "vat": "8.1"}]'::jsonb,
   'Project kickoff', '30 days'),
   
  (v_user_id, v_contact_2, v_project_2, v_bank_1, '2025-010', 'paid', 'CHF', '2025-05-25', '2025-06-25', '2025-06-22',
   5250.00, 425.25, 8.1, 5675.25,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "Mobile App - Sprint 4", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- JUNE 2025
  (v_user_id, v_contact_1, v_project_1, v_bank_1, '2025-011', 'paid', 'CHF', '2025-06-15', '2025-07-15', '2025-07-12',
   9000.00, 729.00, 8.1, 9729.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "60", "um": "hours", "description": "Website Redesign - Final", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   'Project completed', '30 days'),
   
  (v_user_id, v_contact_4, v_project_4, v_bank_1, '2025-012', 'paid', 'CHF', '2025-06-28', '2025-07-28', '2025-07-25',
   6400.00, 518.40, 8.1, 6918.40,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "E-commerce - Product catalog", "pricePerUm": "160", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- JULY 2025
  (v_user_id, v_contact_3, NULL, v_bank_1, '2025-013', 'paid', 'CHF', '2025-07-10', '2025-08-10', '2025-08-08',
   4200.00, 340.20, 8.1, 4540.20,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "System audit and optimization", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- AUGUST 2025
  (v_user_id, v_contact_2, v_project_2, v_bank_1, '2025-014', 'paid', 'CHF', '2025-08-05', '2025-09-05', '2025-09-02',
   12250.00, 992.25, 8.1, 13242.25,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "70", "um": "hours", "description": "Mobile App - Final delivery", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   'App launch complete', '30 days'),
   
  (v_user_id, v_contact_4, v_project_4, v_bank_1, '2025-015', 'paid', 'CHF', '2025-08-22', '2025-09-22', '2025-09-20',
   8000.00, 648.00, 8.1, 8648.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "50", "um": "hours", "description": "E-commerce - Payment integration", "pricePerUm": "160", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- SEPTEMBER 2025
  (v_user_id, v_contact_1, NULL, v_bank_1, '2025-016', 'paid', 'CHF', '2025-09-12', '2025-10-12', '2025-10-10',
   3000.00, 243.00, 8.1, 3243.00,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "20", "um": "hours", "description": "Website maintenance Q3", "pricePerUm": "150", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_4, v_project_4, v_bank_1, '2025-017', 'paid', 'CHF', '2025-09-28', '2025-10-28', '2025-10-25',
   9600.00, 777.60, 8.1, 10377.60,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "60", "um": "hours", "description": "E-commerce - Checkout flow", "pricePerUm": "160", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- OCTOBER 2025
  (v_user_id, v_contact_3, NULL, v_bank_1, '2025-018', 'paid', 'CHF', '2025-10-08', '2025-11-08', '2025-11-05',
   5600.00, 453.60, 8.1, 6053.60,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "Infrastructure upgrade", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_4, v_project_4, v_bank_1, '2025-019', 'paid', 'CHF', '2025-10-25', '2025-11-25', '2025-11-22',
   11200.00, 907.20, 8.1, 12107.20,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Schmidt Design Studio", "address": "Rue du Rhône 45", "zip": "1204 Geneva"}'::jsonb,
   '[{"id": "1", "quantity": "70", "um": "hours", "description": "E-commerce - Final launch", "pricePerUm": "160", "vat": "8.1"}]'::jsonb,
   'Store live!', '30 days'),

  -- NOVEMBER 2025
  (v_user_id, v_contact_1, v_project_5, v_bank_1, '2025-020', 'paid', 'CHF', '2025-11-12', '2025-12-12', '2025-12-10',
   5400.00, 437.40, 8.1, 5837.40,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "AI Chatbot - Requirements & Setup", "pricePerUm": "180", "vat": "8.1"}]'::jsonb,
   'New project kickoff', '30 days'),
   
  (v_user_id, v_contact_2, NULL, v_bank_1, '2025-021', 'paid', 'CHF', '2025-11-28', '2025-12-28', '2025-12-23',
   4375.00, 354.38, 8.1, 4729.38,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Keller & Partners", "address": "Bundesgasse 10", "zip": "3011 Bern", "uid": "CHE-444.555.666"}'::jsonb,
   '[{"id": "1", "quantity": "25", "um": "hours", "description": "App maintenance & updates", "pricePerUm": "175", "vat": "8.1"}]'::jsonb,
   '', '30 days'),

  -- DECEMBER 2025
  (v_user_id, v_contact_1, v_project_5, v_bank_1, '2025-022', 'paid', 'CHF', '2025-12-15', '2026-01-15', '2026-01-05',
   7200.00, 583.20, 8.1, 7783.20,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "40", "um": "hours", "description": "AI Chatbot - Development", "pricePerUm": "180", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  (v_user_id, v_contact_3, NULL, v_bank_1, '2025-023', 'issued', 'CHF', '2025-12-20', '2026-01-20', NULL,
   2800.00, 226.80, 8.1, 3026.80,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Brunner Tech Solutions", "address": "Marktplatz 5", "zip": "4001 Basel", "uid": "CHE-777.888.999"}'::jsonb,
   '[{"id": "1", "quantity": "20", "um": "hours", "description": "Year-end system check", "pricePerUm": "140", "vat": "8.1"}]'::jsonb,
   '', '30 days'),
   
  -- JANUARY 2026 (current)
  (v_user_id, v_contact_1, v_project_5, v_bank_1, '2026-001', 'draft', 'CHF', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', NULL,
   5400.00, 437.40, 8.1, 5837.40,
   '{"name": "Daniil Chebotarev", "street": "Bahnhofstrasse 42", "zip": "8001 Zürich", "iban": "CH93 0027 6276 1234 5678 9"}'::jsonb,
   '{"name": "Weber Consulting AG", "address": "Limmatstrasse 123", "zip": "8005 Zürich", "uid": "CHE-111.222.333"}'::jsonb,
   '[{"id": "1", "quantity": "30", "um": "hours", "description": "AI Chatbot - Testing & Refinement", "pricePerUm": "180", "vat": "8.1"}]'::jsonb,
   '', '30 days');

-- ============================================
-- 7. EXPENSES (1/3 of invoices, unique each month)
-- ============================================
-- Invoice total ~CHF 250k, Expenses target ~CHF 80k
INSERT INTO expenses (user_id, project_id, contact_id, name, description, category, type, amount, currency, vat_amount, vat_rate, date)
VALUES 
  -- JANUARY 2024 (~2800 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'January 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-01-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q1 2024', 'Professional Services', 'recurring', 850.00, 'CHF', 0, 0, '2024-01-01'),
  (v_user_id, NULL, NULL, 'Adobe Creative Cloud', 'Annual 2024', 'Software', 'recurring', 712.80, 'CHF', 57.72, 8.1, '2024-01-05'),
  (v_user_id, v_project_1, NULL, 'Stock Photography', 'Brand images license', 'Software', 'one-time', 350.00, 'CHF', 28.35, 8.1, '2024-01-18'),
  (v_user_id, NULL, v_contact_5, 'Desk Organizer Set', 'Office organization', 'Office', 'one-time', 89.00, 'CHF', 7.21, 8.1, '2024-01-22'),
  
  -- FEBRUARY 2024 (~1650 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'February 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-02-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Bern', 'Newsletter project kickoff', 'Travel', 'one-time', 102.00, 'CHF', 0, 0, '2024-02-08'),
  (v_user_id, v_project_2, NULL, 'Mailchimp Pro', 'Email platform', 'Software', 'one-time', 299.00, 'CHF', 0, 0, '2024-02-12'),
  (v_user_id, NULL, NULL, 'Mechanical Keyboard', 'Keychron K8 Pro', 'Equipment', 'asset', 189.00, 'CHF', 15.31, 8.1, '2024-02-20'),
  (v_user_id, NULL, NULL, 'Domain Renewals', '5 domains annual', 'Software', 'recurring', 145.00, 'CHF', 0, 0, '2024-02-25'),
  
  -- MARCH 2024 (~2100 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'March 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-03-01'),
  (v_user_id, NULL, NULL, 'React Summit', 'Conference ticket', 'Professional Services', 'one-time', 520.00, 'CHF', 42.12, 8.1, '2024-03-14'),
  (v_user_id, NULL, NULL, 'Hotel Amsterdam', '2 nights conference', 'Travel', 'one-time', 380.00, 'CHF', 30.78, 8.1, '2024-03-14'),
  (v_user_id, NULL, NULL, 'Flight ZRH-AMS', 'Conference travel', 'Travel', 'one-time', 245.00, 'CHF', 0, 0, '2024-03-14'),
  (v_user_id, v_project_1, NULL, 'Figma Pro', 'Design tool Q1', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2024-03-01'),
  
  -- APRIL 2024 (~1800 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'April 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-04-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q2 2024', 'Professional Services', 'recurring', 850.00, 'CHF', 0, 0, '2024-04-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Basel', 'Inventory project meeting', 'Travel', 'one-time', 78.00, 'CHF', 0, 0, '2024-04-10'),
  (v_user_id, v_project_3, NULL, 'Chart.js License', 'Dashboard charts', 'Software', 'one-time', 99.00, 'CHF', 0, 0, '2024-04-15'),
  (v_user_id, NULL, v_contact_5, 'Office Supplies', 'Printer paper, toner', 'Office', 'one-time', 178.90, 'CHF', 14.49, 8.1, '2024-04-22'),
  
  -- MAY 2024 (~1400 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'May 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-05-01'),
  (v_user_id, NULL, NULL, 'Logitech Webcam C930e', 'Video calls upgrade', 'Equipment', 'asset', 199.00, 'CHF', 16.12, 8.1, '2024-05-08'),
  (v_user_id, NULL, NULL, 'Train Zürich-Geneva', 'Portfolio review meeting', 'Travel', 'one-time', 156.00, 'CHF', 0, 0, '2024-05-15'),
  (v_user_id, v_project_4, NULL, 'Unsplash Premium', 'Portfolio stock photos', 'Software', 'one-time', 120.00, 'CHF', 0, 0, '2024-05-20'),
  
  -- JUNE 2024 (~1550 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'June 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-06-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design tool Q2', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2024-06-01'),
  (v_user_id, v_project_4, NULL, 'Netlify Pro', 'Portfolio hosting', 'Software', 'one-time', 228.00, 'CHF', 0, 0, '2024-06-10'),
  (v_user_id, NULL, NULL, 'Ergonomic Chair', 'Herman Miller Aeron', 'Equipment', 'asset', 890.00, 'CHF', 72.09, 8.1, '2024-06-22'),
  
  -- JULY 2024 (~5200 CHF - equipment month)
  (v_user_id, NULL, NULL, 'Coworking Space', 'July 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-07-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q3 2024', 'Professional Services', 'recurring', 850.00, 'CHF', 0, 0, '2024-07-01'),
  (v_user_id, NULL, NULL, 'MacBook Pro M3 Max', 'Development laptop', 'Equipment', 'asset', 3499.00, 'CHF', 283.42, 8.1, '2024-07-15'),
  (v_user_id, NULL, NULL, 'Apple Care+', 'Laptop protection', 'Professional Services', 'one-time', 399.00, 'CHF', 0, 0, '2024-07-15'),
  
  -- AUGUST 2024 (~1300 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'August 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-08-01'),
  (v_user_id, NULL, NULL, 'Studio Display 27"', '5K monitor', 'Equipment', 'asset', 689.00, 'CHF', 55.81, 8.1, '2024-08-08'),
  (v_user_id, NULL, NULL, 'USB-C Dock', 'CalDigit TS4', 'Equipment', 'asset', 159.00, 'CHF', 12.88, 8.1, '2024-08-12'),
  
  -- SEPTEMBER 2024 (~1650 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'September 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-09-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design tool Q3', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2024-09-01'),
  (v_user_id, NULL, NULL, 'Swiss Web Dev Days', 'Conference ticket', 'Professional Services', 'one-time', 420.00, 'CHF', 34.02, 8.1, '2024-09-12'),
  (v_user_id, v_project_5, NULL, 'Salesforce Developer', 'CRM sandbox license', 'Software', 'one-time', 300.00, 'CHF', 0, 0, '2024-09-18'),
  (v_user_id, NULL, NULL, 'AirPods Pro 2', 'Calls and focus', 'Equipment', 'asset', 279.00, 'CHF', 22.60, 8.1, '2024-09-25'),
  
  -- OCTOBER 2024 (~1750 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'October 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-10-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q4 2024', 'Professional Services', 'recurring', 890.00, 'CHF', 0, 0, '2024-10-01'),
  (v_user_id, v_project_5, NULL, 'AWS RDS', 'CRM database hosting', 'Software', 'one-time', 180.00, 'CHF', 0, 0, '2024-10-15'),
  (v_user_id, NULL, NULL, 'Magic Trackpad', 'Apple trackpad', 'Equipment', 'asset', 149.00, 'CHF', 12.07, 8.1, '2024-10-22'),
  
  -- NOVEMBER 2024 (~1200 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'November 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-11-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Geneva', 'Client presentation', 'Travel', 'one-time', 156.00, 'CHF', 0, 0, '2024-11-12'),
  (v_user_id, v_project_5, NULL, 'Postman Pro', 'API testing tool', 'Software', 'one-time', 144.00, 'CHF', 0, 0, '2024-11-18'),
  (v_user_id, NULL, NULL, 'Desk Cable Organizer', 'Cable management', 'Office', 'one-time', 45.00, 'CHF', 3.65, 8.1, '2024-11-25'),
  
  -- DECEMBER 2024 (~2100 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'December 2024', 'Office', 'recurring', 450.00, 'CHF', 36.45, 8.1, '2024-12-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design tool Q4', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2024-12-01'),
  (v_user_id, NULL, NULL, 'Client Holiday Gifts', 'Wine selection', 'Marketing', 'one-time', 520.00, 'CHF', 42.12, 8.1, '2024-12-15'),
  (v_user_id, NULL, NULL, 'Year-end Accounting', '2024 tax prep', 'Professional Services', 'one-time', 780.00, 'CHF', 63.18, 8.1, '2024-12-22'),
  (v_user_id, NULL, NULL, 'MX Keys Keyboard', 'New keyboard', 'Equipment', 'asset', 119.00, 'CHF', 9.64, 8.1, '2024-12-28'),
  
  -- JANUARY 2025 (~2900 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'January 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-01-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q1 2025', 'Professional Services', 'recurring', 920.00, 'CHF', 0, 0, '2025-01-01'),
  (v_user_id, NULL, NULL, 'Adobe Creative Cloud', '2025 annual', 'Software', 'recurring', 742.80, 'CHF', 60.17, 8.1, '2025-01-05'),
  (v_user_id, v_project_7, NULL, 'Apple Developer', 'iOS program', 'Software', 'recurring', 99.00, 'CHF', 0, 0, '2025-01-08'),
  (v_user_id, NULL, NULL, 'NAS Storage', 'Synology DS923+', 'Equipment', 'asset', 599.00, 'CHF', 48.52, 8.1, '2025-01-20'),
  
  -- FEBRUARY 2025 (~1400 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'February 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-02-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Basel', 'API Gateway kickoff', 'Travel', 'one-time', 78.00, 'CHF', 0, 0, '2025-02-05'),
  (v_user_id, v_project_8, NULL, 'Kong Gateway', 'API license', 'Software', 'one-time', 450.00, 'CHF', 0, 0, '2025-02-12'),
  (v_user_id, NULL, NULL, 'Portable SSD 2TB', 'Samsung T7', 'Equipment', 'asset', 189.00, 'CHF', 15.31, 8.1, '2025-02-22'),
  
  -- MARCH 2025 (~1800 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'March 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-03-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design Q1', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2025-03-01'),
  (v_user_id, NULL, NULL, 'Next.js Conf', 'Conference virtual', 'Professional Services', 'one-time', 199.00, 'CHF', 0, 0, '2025-03-15'),
  (v_user_id, v_project_6, NULL, 'Contentful CMS', 'Website CMS', 'Software', 'one-time', 348.00, 'CHF', 0, 0, '2025-03-20'),
  (v_user_id, NULL, NULL, 'Webcam Light Ring', 'Elgato Key Light', 'Equipment', 'asset', 199.00, 'CHF', 16.12, 8.1, '2025-03-28'),
  
  -- APRIL 2025 (~1950 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'April 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-04-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q2 2025', 'Professional Services', 'recurring', 920.00, 'CHF', 0, 0, '2025-04-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Geneva', 'E-commerce planning', 'Travel', 'one-time', 156.00, 'CHF', 0, 0, '2025-04-10'),
  (v_user_id, v_project_9, NULL, 'Shopify Partners', 'E-commerce platform', 'Software', 'one-time', 228.00, 'CHF', 0, 0, '2025-04-18'),
  
  -- MAY 2025 (~1350 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'May 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-05-01'),
  (v_user_id, v_project_9, NULL, 'Stripe Integration', 'Payment gateway', 'Software', 'one-time', 180.00, 'CHF', 0, 0, '2025-05-08'),
  (v_user_id, NULL, NULL, 'MX Master 3S', 'Wireless mouse', 'Equipment', 'asset', 109.00, 'CHF', 8.83, 8.1, '2025-05-15'),
  (v_user_id, v_project_10, NULL, 'Tableau License', 'Analytics tool', 'Software', 'one-time', 420.00, 'CHF', 0, 0, '2025-05-25'),
  
  -- JUNE 2025 (~1600 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'June 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-06-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design Q2', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2025-06-01'),
  (v_user_id, v_project_6, NULL, 'Vercel Enterprise', 'Website hosting', 'Software', 'one-time', 240.00, 'CHF', 0, 0, '2025-06-12'),
  (v_user_id, NULL, NULL, 'Train Zürich-Bern', 'Portal review', 'Travel', 'one-time', 102.00, 'CHF', 0, 0, '2025-06-20'),
  (v_user_id, v_project_11, NULL, 'Auth0 License', 'Portal auth', 'Software', 'one-time', 350.00, 'CHF', 0, 0, '2025-06-28'),
  
  -- JULY 2025 (~2800 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'July 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-07-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q3 2025', 'Professional Services', 'recurring', 920.00, 'CHF', 0, 0, '2025-07-01'),
  (v_user_id, NULL, NULL, 'iPad Pro 12.9"', 'Client demos', 'Equipment', 'asset', 1299.00, 'CHF', 105.22, 8.1, '2025-07-15'),
  (v_user_id, NULL, NULL, 'Apple Pencil Pro', 'Design sketching', 'Equipment', 'asset', 149.00, 'CHF', 12.07, 8.1, '2025-07-15'),
  
  -- AUGUST 2025 (~1250 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'August 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-08-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Basel', 'Migration planning', 'Travel', 'one-time', 78.00, 'CHF', 0, 0, '2025-08-08'),
  (v_user_id, v_project_12, NULL, 'Docker Enterprise', 'Container platform', 'Software', 'one-time', 380.00, 'CHF', 0, 0, '2025-08-18'),
  (v_user_id, v_project_7, NULL, 'TestFlight Pro', 'Beta testing', 'Software', 'one-time', 150.00, 'CHF', 0, 0, '2025-08-25'),
  
  -- SEPTEMBER 2025 (~1500 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'September 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-09-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design Q3', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2025-09-01'),
  (v_user_id, NULL, NULL, 'Swiss Dev Days', 'Conference ticket', 'Professional Services', 'one-time', 380.00, 'CHF', 30.78, 8.1, '2025-09-12'),
  (v_user_id, v_project_13, NULL, 'Calendly Pro', 'Booking system', 'Software', 'one-time', 180.00, 'CHF', 0, 0, '2025-09-20'),
  (v_user_id, NULL, NULL, 'Webcam C920', 'Backup camera', 'Equipment', 'asset', 79.00, 'CHF', 6.40, 8.1, '2025-09-28'),
  
  -- OCTOBER 2025 (~1900 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'October 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-10-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q4 2025', 'Professional Services', 'recurring', 920.00, 'CHF', 0, 0, '2025-10-01'),
  (v_user_id, NULL, NULL, 'Train Zürich-Geneva', 'Booking launch', 'Travel', 'one-time', 156.00, 'CHF', 0, 0, '2025-10-15'),
  (v_user_id, v_project_12, NULL, 'Kubernetes Credits', 'Cloud orchestration', 'Software', 'one-time', 280.00, 'CHF', 0, 0, '2025-10-22'),
  
  -- NOVEMBER 2025 (~1650 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'November 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-11-01'),
  (v_user_id, v_project_14, NULL, 'OpenAI API', 'GPT-4 credits', 'Software', 'one-time', 350.00, 'CHF', 0, 0, '2025-11-08'),
  (v_user_id, NULL, NULL, 'Standing Desk Frame', 'Jarvis frame', 'Equipment', 'asset', 649.00, 'CHF', 52.57, 8.1, '2025-11-18'),
  (v_user_id, v_project_15, NULL, 'Adyen Sandbox', 'Payment testing', 'Software', 'one-time', 120.00, 'CHF', 0, 0, '2025-11-25'),
  
  -- DECEMBER 2025 (~2300 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'December 2025', 'Office', 'recurring', 475.00, 'CHF', 38.48, 8.1, '2025-12-01'),
  (v_user_id, NULL, NULL, 'Figma Pro', 'Design Q4', 'Software', 'recurring', 45.00, 'CHF', 0, 0, '2025-12-01'),
  (v_user_id, NULL, NULL, 'Client Holiday Gifts', 'Chocolate boxes', 'Marketing', 'one-time', 480.00, 'CHF', 38.88, 8.1, '2025-12-12'),
  (v_user_id, NULL, NULL, 'Year-end Accounting', '2025 tax prep', 'Professional Services', 'one-time', 850.00, 'CHF', 68.85, 8.1, '2025-12-20'),
  (v_user_id, v_project_14, NULL, 'OpenAI API', 'Additional credits', 'Software', 'one-time', 250.00, 'CHF', 0, 0, '2025-12-28'),
  
  -- JANUARY 2026 (~1650 CHF)
  (v_user_id, NULL, NULL, 'Coworking Space', 'January 2026', 'Office', 'recurring', 490.00, 'CHF', 39.69, 8.1, '2026-01-01'),
  (v_user_id, NULL, NULL, 'Business Insurance', 'Q1 2026', 'Professional Services', 'recurring', 950.00, 'CHF', 0, 0, '2026-01-01'),
  (v_user_id, v_project_15, NULL, 'Stripe Connect', 'Multi-currency setup', 'Software', 'one-time', 220.00, 'CHF', 0, 0, '2026-01-05');

-- ============================================
-- 8. TIME ENTRIES (realistic work patterns across full year)
-- ============================================

-- JANUARY 2024 - Corporate Branding project
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Brand identity research and mood boards', '2024-01-15'::date, 240, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Logo concepts development', '2024-01-16'::date, 360, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Client presentation preparation', '2024-01-17'::date, 120, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Brand guidelines documentation', '2024-01-22'::date, 300, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Color palette refinement', '2024-01-23'::date, 180, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Typography selection', '2024-01-24'::date, 150, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Final brand assets delivery', '2024-01-29'::date, 210, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- FEBRUARY 2024 - Newsletter System project
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Email platform research and selection', '2024-02-05'::date, 180, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Database schema design', '2024-02-06'::date, 240, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Subscription API endpoints', '2024-02-07'::date, 300, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Email template builder UI', '2024-02-12'::date, 360, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Scheduling system implementation', '2024-02-13'::date, 270, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Client meeting - requirements review', '2024-02-14'::date, 90, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Email sending queue system', '2024-02-19'::date, 330, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Analytics dashboard', '2024-02-20'::date, 285, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Testing and bug fixes', '2024-02-21'::date, 240, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- MARCH 2024 - Corporate Branding wrap-up
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Brand guidelines final review', '2024-03-05'::date, 120, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Client feedback implementation', '2024-03-06'::date, 180, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_1, 'Final delivery and handover', '2024-03-07'::date, 90, 145.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- APRIL 2024 - Inventory Dashboard project
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Project kickoff meeting', '2024-04-02'::date, 90, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Database design and ERD', '2024-04-03'::date, 300, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'REST API development', '2024-04-04'::date, 360, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Dashboard UI wireframes', '2024-04-09'::date, 240, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'React dashboard components', '2024-04-10'::date, 420, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Real-time updates with WebSockets', '2024-04-11'::date, 330, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Chart visualizations', '2024-04-16'::date, 270, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Filtering and search functionality', '2024-04-17'::date, 210, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Performance optimization', '2024-04-18'::date, 180, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- MAY 2024 - Newsletter System completion
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Final testing and QA', '2024-05-07'::date, 240, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'User documentation', '2024-05-08'::date, 180, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Deployment and go-live', '2024-05-09'::date, 120, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_2, 'Post-launch support', '2024-05-14'::date, 90, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JUNE 2024 - Portfolio Website project
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Design mockups and concepts', '2024-06-03'::date, 300, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Next.js setup and structure', '2024-06-04'::date, 180, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'CMS integration (Contentful)', '2024-06-05'::date, 240, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Portfolio gallery component', '2024-06-10'::date, 270, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Contact form with validation', '2024-06-11'::date, 150, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Responsive design implementation', '2024-06-12'::date, 210, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'SEO optimization', '2024-06-17'::date, 180, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Performance testing and optimization', '2024-06-18'::date, 120, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JULY 2024 - Inventory Dashboard continued
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Export functionality (CSV, PDF)', '2024-07-02'::date, 240, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'User permissions system', '2024-07-03'::date, 300, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Client training session', '2024-07-08'::date, 120, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Bug fixes and refinements', '2024-07-09'::date, 180, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_3, 'Final deployment', '2024-07-10'::date, 90, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- AUGUST 2024 - Portfolio Website completion
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Client feedback implementation', '2024-08-05'::date, 150, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Final testing and deployment', '2024-08-06'::date, 120, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_4, 'Handover and documentation', '2024-08-07'::date, 90, 135.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- SEPTEMBER 2024 - CRM Integration project start
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Project kickoff and requirements gathering', '2024-09-02'::date, 120, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Salesforce API research', '2024-09-03'::date, 240, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Authentication setup', '2024-09-04'::date, 180, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Data mapping and schema design', '2024-09-09'::date, 300, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Sync service development', '2024-09-10'::date, 360, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Error handling and retry logic', '2024-09-11'::date, 210, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- OCTOBER 2024 - CRM Integration continued
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Webhook implementation', '2024-10-07'::date, 270, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Data transformation layer', '2024-10-08'::date, 330, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Testing in sandbox environment', '2024-10-09'::date, 240, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Client review meeting', '2024-10-14'::date, 90, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Bug fixes from testing', '2024-10-15'::date, 180, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- NOVEMBER 2024 - CRM Integration final phase
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Production deployment preparation', '2024-11-04'::date, 150, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Monitoring and logging setup', '2024-11-05'::date, 210, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Production deployment', '2024-11-06'::date, 120, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Post-deployment monitoring', '2024-11-11'::date, 90, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- DECEMBER 2024 - CRM Integration wrap-up
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Final integration testing', '2024-12-16'::date, 240, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Client handover meeting', '2024-12-17'::date, 90, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_5, 'Documentation and training materials', '2024-12-18'::date, 180, 140.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JANUARY 2025 - Website Redesign and Mobile App projects
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Project kickoff meeting', '2025-01-02'::date, 90, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Homepage wireframes and mockups', '2025-01-03'::date, 300, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Design system setup', '2025-01-06'::date, 240, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Mobile app architecture planning', '2025-01-06'::date, 180, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Header component development', '2025-01-07'::date, 300, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Authentication flow implementation', '2025-01-08'::date, 360, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Navigation and footer', '2025-01-09'::date, 210, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'API endpoint integration', '2025-01-10'::date, 270, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Contact page development', '2025-01-13'::date, 240, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Push notifications setup', '2025-01-13'::date, 150, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'CMS integration (Contentful)', '2025-01-14'::date, 330, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Profile screen UI development', '2025-01-15'::date, 285, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Blog template development', '2025-01-16'::date, 195, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Offline mode implementation', '2025-01-17'::date, 375, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Client review meeting', '2025-01-20'::date, 90, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Feedback implementation', '2025-01-21'::date, 180, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Dashboard UI development', '2025-01-22'::date, 315, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'SEO improvements', '2025-01-23'::date, 135, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Unit tests for API layer', '2025-01-24'::date, 180, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Performance optimization', '2025-01-27'::date, 225, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Settings screen implementation', '2025-01-28'::date, 240, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Image optimization', '2025-01-29'::date, 105, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Beta testing and bug fixes', '2025-01-30'::date, 270, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Client feedback review', '2025-01-31'::date, 60, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- FEBRUARY 2025 - Website Redesign and Mobile App continued
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'E-commerce page development', '2025-02-03'::date, 360, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Payment integration', '2025-02-04'::date, 300, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Product catalog pages', '2025-02-05'::date, 270, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'In-app purchases setup', '2025-02-06'::date, 240, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Shopping cart functionality', '2025-02-10'::date, 330, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'App Store submission prep', '2025-02-11'::date, 180, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Checkout flow', '2025-02-12'::date, 285, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'Performance testing', '2025-02-13'::date, 210, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_6, 'Final testing and QA', '2025-02-17'::date, 240, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_7, 'App Store submission', '2025-02-18'::date, 120, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- MARCH 2025 - API Gateway project start
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Project kickoff and architecture design', '2025-03-03'::date, 180, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Kong Gateway setup and configuration', '2025-03-04'::date, 240, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'API routing rules', '2025-03-05'::date, 300, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Authentication middleware', '2025-03-10'::date, 270, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Rate limiting implementation', '2025-03-11'::date, 210, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Request/response transformation', '2025-03-12'::date, 330, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Monitoring and logging', '2025-03-17'::date, 180, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_8, 'Testing and documentation', '2025-03-18'::date, 240, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- APRIL-MAY 2025 - E-commerce Platform project
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Project planning and requirements', '2025-05-02'::date, 120, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Shopify integration setup', '2025-05-03'::date, 240, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Product catalog API', '2025-05-06'::date, 300, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Shopping cart implementation', '2025-05-07'::date, 360, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Stripe payment integration', '2025-05-08'::date, 270, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Order management system', '2025-05-13'::date, 330, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Inventory sync', '2025-05-14'::date, 240, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_9, 'Checkout flow optimization', '2025-05-15'::date, 210, 160.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JUNE 2025 - Data Analytics Dashboard
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Requirements gathering', '2025-06-02'::date, 90, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Tableau integration', '2025-06-03'::date, 300, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Data pipeline setup', '2025-06-04'::date, 360, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Dashboard widgets development', '2025-06-09'::date, 420, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Real-time data updates', '2025-06-10'::date, 270, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_10, 'Export functionality', '2025-06-11'::date, 180, 170.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JULY-AUGUST 2025 - Customer Portal V2
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'Portal redesign planning', '2025-07-02'::date, 150, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'Auth0 integration', '2025-07-03'::date, 240, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'User profile management', '2025-07-07'::date, 300, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'Dashboard redesign', '2025-07-08'::date, 360, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'Support ticket system', '2025-07-09'::date, 330, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_11, 'Notification system', '2025-07-14'::date, 210, 155.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- SEPTEMBER 2025 - Microservices Migration
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'Architecture planning', '2025-09-02'::date, 240, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'Docker containerization', '2025-09-03'::date, 300, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'Kubernetes setup', '2025-09-04'::date, 360, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'Service decomposition', '2025-09-09'::date, 420, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'API gateway integration', '2025-09-10'::date, 270, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_12, 'Service communication setup', '2025-09-11'::date, 330, 175.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- OCTOBER 2025 - Booking System
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_13, 'Calendly integration', '2025-10-01'::date, 240, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_13, 'Calendar UI component', '2025-10-02'::date, 300, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_13, 'Booking confirmation system', '2025-10-07'::date, 180, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_13, 'Email notifications', '2025-10-08'::date, 150, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_13, 'Reminder system', '2025-10-09'::date, 120, 150.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- NOVEMBER-DECEMBER 2025 - AI Chatbot Integration
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'OpenAI API integration', '2025-11-04'::date, 240, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'GPT-4 prompt engineering', '2025-11-05'::date, 300, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Chat interface development', '2025-11-06'::date, 360, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Knowledge base integration', '2025-11-11'::date, 330, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Response testing and tuning', '2025-11-12'::date, 270, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Context management system', '2025-11-13'::date, 240, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Chatbot response testing', '2025-12-16'::date, 180, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Client demo preparation', '2025-12-17'::date, 90, 180.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- DECEMBER 2025 - Payment Gateway Upgrade
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Stripe Connect setup', '2025-12-02'::date, 240, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Multi-currency logic', '2025-12-03'::date, 300, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Payment flow UI', '2025-12-09'::date, 360, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Webhook handlers', '2025-12-10'::date, 270, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Testing in sandbox', '2025-12-11'::date, 210, 165.00, true, 'paid' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- JANUARY 2026 - Current active projects
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'GPT-4 prompt engineering', CURRENT_DATE - INTERVAL '4 days', 225, 180.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Payment flow UI', CURRENT_DATE - INTERVAL '3 days', 315, 165.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Chatbot response testing', CURRENT_DATE - INTERVAL '2 days', 135, 180.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Multi-currency logic', CURRENT_DATE - INTERVAL '2 days', 180, 165.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Client demo preparation', CURRENT_DATE - INTERVAL '1 day', 60, 180.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_15, 'Stripe webhook handlers', CURRENT_DATE - INTERVAL '1 day', 240, 165.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');
INSERT INTO time_entries (user_id, project_id, description, date, duration_minutes, hourly_rate, is_billable, status) SELECT v_user_id, v_project_14, 'Knowledge base integration', CURRENT_DATE, 105, 180.00, true, 'unbilled' WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries');

-- ============================================
-- 9. DESCRIPTION SUGGESTIONS
-- ============================================
INSERT INTO description_suggestions (user_id, description, usage_count)
VALUES 
  (v_user_id, 'Website development', 25),
  (v_user_id, 'Frontend development', 22),
  (v_user_id, 'Backend API development', 18),
  (v_user_id, 'UI/UX design', 14),
  (v_user_id, 'Client meeting', 20),
  (v_user_id, 'Code review', 12),
  (v_user_id, 'Bug fixes', 16),
  (v_user_id, 'Testing and QA', 10),
  (v_user_id, 'Mobile app development', 15),
  (v_user_id, 'E-commerce integration', 8),
  (v_user_id, 'AI/ML implementation', 5),
  (v_user_id, 'Database optimization', 7);

RAISE NOTICE 'Mock data created successfully for user: %', v_user_id;

END $$;

