# 📋 Fakturio - Complete Project Schema & Documentation

**Version:** 1.0.2  
**Last Updated:** December 2024  
**Project Type:** Swiss Invoicing & Expense Tracking Application

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Application Structure](#application-structure)
5. [Component Documentation](#component-documentation)
6. [Service Layer](#service-layer)
7. [Data Flow & State Management](#data-flow--state-management)
8. [Authentication & Authorization](#authentication--authorization)
9. [Features & Functionality](#features--functionality)
10. [Technology Stack](#technology-stack)
11. [Development Setup](#development-setup)
12. [Deployment](#deployment)
13. [API Reference](#api-reference)

---

## Project Overview

**Fakturio** is a comprehensive Swiss invoicing and expense tracking application designed for freelancers and small businesses. It provides professional invoice generation with Swiss QR Bill support, expense tracking, project management, and tax estimation tools.

### Key Features

- ✅ **Professional Invoice Generation** with Swiss QR Bill
- ✅ **Multi-currency Support** (CHF, EUR, USD)
- ✅ **Expense Tracking** (one-time, recurring, assets)
- ✅ **Project Management** with customer linking
- ✅ **Swiss Tax Estimation** by canton
- ✅ **Contact Management** (customers & suppliers)
- ✅ **PDF Export** with integrated QR codes
- ✅ **Multi-language Support** (English/German)
- ✅ **Dark/Light Theme**

### Target Users

- Freelancers
- Small businesses
- Self-employed professionals
- Consultants

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Pages      │  │  Components  │  │   Contexts   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│  ┌──────▼─────────────────▼─────────────────▼───────┐     │
│  │              Hooks & Services Layer              │     │
│  └──────────────────────┬──────────────────────────┘     │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Database    │  │   Storage    │     │
│  │  (PostgreSQL)│  │  (PostgreSQL)│  │  (S3-like)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Client-Side Rendering**: React SPA with Vite build tool
2. **Backend-as-a-Service**: Supabase for auth, database, and storage
3. **Row-Level Security**: All data access controlled at database level
4. **Stateless Frontend**: No server-side sessions, JWT-based auth
5. **Progressive Enhancement**: Works offline for viewing, requires connection for saves

### Data Flow

```
User Action → Component → Hook → Service → Supabase → Database
                ↓           ↓        ↓
            State Update  Context  Error Handling
```

---

## Database Schema

### Entity Relationship Diagram

See `docs/DATABASE_SCHEMA.md` for visual ERD.

### Core Tables

#### 1. `profiles` (User Profiles)

Extends Supabase `auth.users` with business information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users | User ID (matches auth.users.id) |
| `email` | TEXT | | User email |
| `name` | TEXT | | User's full name |
| `company_name` | TEXT | | Company name |
| `address` | TEXT | | Street address |
| `city` | TEXT | | City |
| `postal_code` | TEXT | | Postal/ZIP code |
| `country` | TEXT | DEFAULT 'Switzerland' | Country |
| `phone` | TEXT | | Phone number |
| `vat_number` | TEXT | | VAT/UID number |
| `canton` | TEXT | | Swiss canton code |
| `account_currency` | TEXT | DEFAULT 'CHF' | Default currency |
| `logo_url` | TEXT | | URL to company logo |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- 1:1 with `auth.users` (CASCADE DELETE)

**Indexes:**
- Primary key on `id`

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT their own profile

---

#### 2. `vat_settings` (VAT Configuration)

Per-user VAT settings for invoice calculations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Setting ID |
| `user_id` | UUID | FK → auth.users, UNIQUE | User ID |
| `mode` | TEXT | DEFAULT 'additive' | 'additive' or 'inclusive' |
| `vat_number` | TEXT | | VAT registration number |
| `allow_custom_rate` | BOOLEAN | DEFAULT FALSE | Allow custom VAT rates |
| `default_rate` | DECIMAL(5,2) | DEFAULT 8.1 | Default VAT rate (%) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- UNIQUE constraint on `user_id` (one setting per user)

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own settings

---

#### 3. `bank_accounts` (Bank Accounts)

Bank account information for Swiss QR Bill generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Account ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `name` | TEXT | NOT NULL | Account name/label |
| `iban` | TEXT | NOT NULL | IBAN number |
| `bic` | TEXT | | BIC/SWIFT code |
| `bank_name` | TEXT | | Bank name |
| `is_default` | BOOLEAN | DEFAULT FALSE | Default account flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- 1:Many with `invoices` (SET NULL on delete)

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own accounts

**Business Rules:**
- Only one account can be `is_default = true` per user
- Used for Swiss QR Bill generation

---

#### 4. `contacts` (Customers & Suppliers)

Contact information for customers and suppliers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Contact ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `type` | TEXT | DEFAULT 'customer' | 'customer' or 'supplier' |
| `name` | TEXT | NOT NULL | Contact name |
| `company_name` | TEXT | | Company name |
| `email` | TEXT | | Email address |
| `phone` | TEXT | | Phone number |
| `address` | TEXT | | Street address |
| `city` | TEXT | | City |
| `postal_code` | TEXT | | Postal/ZIP code |
| `country` | TEXT | DEFAULT 'Switzerland' | Country |
| `vat_number` | TEXT | | VAT/UID number |
| `notes` | TEXT | | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- 1:Many with `projects` (SET NULL on delete)
- 1:Many with `invoices` (SET NULL on delete)
- 1:Many with `expenses` (SET NULL on delete)

**Indexes:**
- `idx_contacts_user_id` on `user_id`

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own contacts

---

#### 5. `projects` (Project Management)

Projects linked to customers for tracking work and expenses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Project ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `contact_id` | UUID | FK → contacts, NULL | Linked customer |
| `name` | TEXT | NOT NULL | Project name |
| `description` | TEXT | | Project description |
| `status` | TEXT | DEFAULT 'active' | 'active', 'completed', 'archived' |
| `hourly_rate` | DECIMAL(10,2) | | Hourly rate |
| `budget` | DECIMAL(10,2) | | Project budget |
| `currency` | TEXT | DEFAULT 'CHF' | Currency |
| `start_date` | DATE | | Project start date |
| `end_date` | DATE | | Project end date |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- Many:1 with `contacts` (SET NULL on delete)
- 1:Many with `invoices` (SET NULL on delete)
- 1:Many with `expenses` (SET NULL on delete)

**Indexes:**
- `idx_projects_user_id` on `user_id`

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own projects

---

#### 6. `invoices` (Invoices)

Invoice records with line items and payment information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Invoice ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `contact_id` | UUID | FK → contacts, NULL | Customer ID (nullable to allow contact deletion) |
| `project_id` | UUID | FK → projects, NULL | Project ID (optional) |
| `bank_account_id` | UUID | FK → bank_accounts, NULL | Bank account for payment (nullable to allow account deletion) |
| `invoice_number` | TEXT | NOT NULL | Invoice number (YYYY-NN format) |
| `status` | TEXT | DEFAULT 'issued', NOT NULL | 'draft', 'issued', 'paid', 'overdue', 'cancelled' |
| `currency` | TEXT | DEFAULT 'CHF', NOT NULL | Currency code |
| `issued_on` | DATE | NOT NULL | Issue date |
| `due_date` | DATE | NOT NULL | Due date |
| `paid_date` | DATE | | Payment date (when status = 'paid') |
| `subtotal` | DECIMAL(12,2) | DEFAULT 0, NOT NULL | Subtotal before VAT |
| `vat_amount` | DECIMAL(12,2) | DEFAULT 0, NOT NULL | VAT amount |
| `vat_rate` | DECIMAL(5,2) | NOT NULL | VAT rate (%) |
| `total` | DECIMAL(12,2) | DEFAULT 0, NOT NULL | Grand total |
| `from_info` | JSONB | NOT NULL | Sender information (JSON) |
| `to_info` | JSONB | NOT NULL | Recipient information (JSON) |
| `items` | JSONB | DEFAULT '[]', NOT NULL | Line items array (JSON) |
| `notes` | TEXT | | Description/notes (only optional field) |
| `payment_terms` | TEXT | NOT NULL | Payment terms (e.g., "30 days") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- Many:1 with `contacts` (SET NULL on delete)
- Many:1 with `projects` (SET NULL on delete)
- Many:1 with `bank_accounts` (SET NULL on delete)

**Indexes:**
- `idx_invoices_user_id` on `user_id`
- `idx_invoices_status` on `status`
- `idx_invoices_due_date` on `due_date`

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own invoices

**JSONB Structure:**

`from_info`:
```json
{
  "name": "John Doe",
  "companyName": "My Company",
  "street": "Main Street 123",
  "zip": "8000 Zürich",
  "email": "john@example.com",
  "telephone": "+41 123 456 789",
  "website": "https://example.com",
  "uid": "CHE-123.456.789",
  "logo": "data:image/png;base64,..."
}
```

`to_info`:
```json
{
  "name": "Customer Name",
  "address": "Customer Street 456",
  "zip": "9000 St. Gallen",
  "email": "customer@example.com",
  "uid": "CHE-987.654.321"
}
```

`items`:
```json
[
  {
    "description": "Web Development",
    "quantity": 10,
    "um": 1,
    "pricePerUm": 150.00,
    "vat": 8.1
  }
]
```

**Business Rules:**
- Invoice numbers are auto-generated in format `YYYY-NN` (e.g., `2024-01`)
- Status is auto-calculated based on `due_date` and `paid_date`
- Most fields are mandatory (only `notes` and `project_id` are optional)

---

#### 7. `expenses` (Expense Tracking)

Expense records for tracking business costs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Expense ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `project_id` | UUID | FK → projects, NULL | Project ID (optional) |
| `contact_id` | UUID | FK → contacts, NULL | Supplier ID (optional) |
| `name` | TEXT | NOT NULL | Expense name |
| `description` | TEXT | | Expense description |
| `category` | TEXT | | Category (see below) |
| `type` | TEXT | DEFAULT 'one-time' | 'one-time', 'recurring', 'asset' |
| `amount` | DECIMAL(12,2) | NOT NULL | Expense amount |
| `currency` | TEXT | DEFAULT 'CHF' | Currency |
| `vat_amount` | DECIMAL(12,2) | | VAT amount |
| `vat_rate` | DECIMAL(5,2) | | VAT rate (%) |
| `date` | DATE | NOT NULL | Expense date |
| `end_date` | DATE | | End date (for recurring expenses) |
| `receipt_url` | TEXT | | URL to uploaded receipt |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)
- Many:1 with `projects` (SET NULL on delete)
- Many:1 with `contacts` (SET NULL on delete)

**Indexes:**
- `idx_expenses_user_id` on `user_id`
- `idx_expenses_date` on `date`
- `idx_expenses_category` on `category`

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own expenses

**Categories:**
- 'Office'
- 'Travel'
- 'Software'
- 'Equipment'
- 'Marketing'
- 'Professional Services'
- 'Other'

**Expense Types:**
- `one-time`: Single expense
- `recurring`: Repeating expense (requires `end_date`)
- `asset`: Capital asset (for depreciation tracking)

---

#### 8. `description_suggestions` (Autocomplete)

User-specific description suggestions for invoice line items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Suggestion ID |
| `user_id` | UUID | FK → auth.users, NOT NULL | User ID |
| `description` | TEXT | NOT NULL | Suggestion text |
| `usage_count` | INTEGER | DEFAULT 1 | Usage frequency |
| `last_used_at` | TIMESTAMPTZ | DEFAULT NOW() | Last usage timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Relationships:**
- Many:1 with `auth.users` (CASCADE DELETE)

**Constraints:**
- UNIQUE(`user_id`, `description`)

**RLS Policies:**
- Users can SELECT/UPDATE/INSERT/DELETE their own suggestions

**Business Rules:**
- Suggestions are auto-created when user types descriptions
- Usage count increments on each use
- Used for autocomplete in invoice line items

---

### Database Functions & Triggers

#### 1. `handle_new_user()`

**Purpose:** Auto-create profile when user signs up

**Trigger:** `on_auth_user_created` AFTER INSERT on `auth.users`

**Logic:**
- Creates a `profiles` row with `id = auth.users.id`
- Sets `email` from `auth.users.email`
- Sets `name` from metadata or email prefix

---

#### 2. `update_updated_at_column()`

**Purpose:** Auto-update `updated_at` timestamp on row updates

**Trigger:** Applied to all tables BEFORE UPDATE

**Logic:**
- Sets `NEW.updated_at = NOW()`

---

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:

1. **Users can only access their own data**
   - All SELECT queries filtered by `auth.uid() = user_id`
   - All INSERT/UPDATE/DELETE operations require matching `user_id`

2. **Policies Pattern:**
   ```sql
   CREATE POLICY "Users can view own {table}"
   ON {table} FOR SELECT
   USING (auth.uid() = user_id);
   ```

3. **Cascade Behavior:**
   - User deletion → All related data deleted (CASCADE)
   - Contact deletion → Projects/Invoices set to NULL (SET NULL)
   - Project deletion → Invoices/Expenses set to NULL (SET NULL)

---

## Application Structure

### Directory Structure

```
fakturio/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AddBankAccountModal.jsx
│   │   ├── AddCustomerModal.jsx
│   │   ├── AddProjectModal.jsx
│   │   ├── AuthModal.jsx
│   │   ├── BackLink.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── ChartCard.jsx
│   │   ├── ContactSelector.jsx
│   │   ├── CurrencyPicker.jsx
│   │   ├── DataTable.jsx
│   │   ├── DatePickerInput.jsx
│   │   ├── DescriptionSection.jsx
│   │   ├── Dropdown.jsx
│   │   ├── EmptyState.jsx
│   │   ├── FromSection.jsx
│   │   ├── Header.jsx
│   │   ├── Icons.jsx
│   │   ├── Input.jsx
│   │   ├── InvoiceDetails.jsx
│   │   ├── InvoicePDF.jsx
│   │   ├── Modal.jsx
│   │   ├── PageLayout.jsx
│   │   ├── ProductsSection.jsx
│   │   ├── RowActions.jsx
│   │   ├── Select.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SignupPromptModal.jsx
│   │   ├── Skeleton.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── TextArea.jsx
│   │   └── ToSection.jsx
│   │
│   ├── context/             # React Context providers
│   │   ├── AuthContext.jsx          # Legacy localStorage auth
│   │   ├── SupabaseAuthContext.jsx   # Supabase auth (active)
│   │   ├── LanguageContext.jsx      # i18n
│   │   └── ThemeContext.jsx         # Dark/light theme
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useContacts.js
│   │   ├── useExpenses.js
│   │   ├── useInvoices.js
│   │   ├── useProjects.js
│   │   └── useSettings.js
│   │
│   ├── lib/                 # Third-party integrations
│   │   └── supabase.js      # Supabase client
│   │
│   ├── pages/               # Route pages
│   │   ├── Account.jsx
│   │   ├── Contacts.jsx
│   │   ├── CustomerDetail.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExpenseDetail.jsx
│   │   ├── Expenses.jsx
│   │   ├── GenerateMockData.jsx
│   │   ├── InvoiceCreator.jsx
│   │   ├── InvoiceDetail.jsx
│   │   ├── Login.jsx
│   │   ├── NewContact.jsx
│   │   ├── NewExpense.jsx
│   │   ├── NewProject.jsx
│   │   ├── Onboarding.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Projects.jsx
│   │   ├── Signup.jsx
│   │   └── Taxes.jsx
│   │
│   ├── services/            # Data access layer
│   │   ├── bankAccountService.js
│   │   ├── contactService.js
│   │   ├── expenseService.js
│   │   ├── invoiceService.js
│   │   ├── projectService.js
│   │   ├── settingsService.js
│   │   ├── storage.js
│   │   └── supabase/        # Supabase service implementations
│   │       ├── contactService.js
│   │       ├── emailService.js
│   │       ├── expenseService.js
│   │       ├── index.js
│   │       ├── invoiceService.js
│   │       ├── projectService.js
│   │       └── settingsService.js
│   │
│   ├── translations/        # i18n translations
│   │   ├── en.json
│   │   └── de.json
│   │
│   ├── utils/               # Utility functions
│   │   ├── exchangeRate.js
│   │   ├── formatters.js
│   │   ├── generateMockData.js
│   │   ├── generateQRCode.js
│   │   ├── pdfGenerator.js
│   │   └── taxCalculator.js
│   │
│   ├── App.jsx              # Main app component (routing)
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
│
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── send-email/
│   │       └── index.ts
│   └── migrations/         # Database migrations
│       └── 001_make_invoice_fields_mandatory.sql
│
├── docs/                    # Documentation
│   ├── DATABASE_SCHEMA.md
│   ├── MOCK_DATA.md
│   ├── PROJECT_SCHEMA.md    # This file
│   └── SWISS_QR_BILL_IMPLEMENTATION.md
│
├── dist/                    # Build output
├── package.json
├── vite.config.js
├── tailwind.config.js
├── README.md
├── SUPABASE_SETUP.md
└── DEPLOYMENT.md
```

---

## Component Documentation

### Core Components

#### `PageLayout.jsx`

**Purpose:** Standard page wrapper with sidebar and header

**Props:**
- `children` (ReactNode): Page content
- `title` (string, optional): Page title

**Usage:**
```jsx
<PageLayout title="Dashboard">
  <DashboardContent />
</PageLayout>
```

---

#### `Sidebar.jsx`

**Purpose:** Navigation sidebar with menu items

**Features:**
- Responsive (mobile hamburger menu)
- Active route highlighting
- Language switcher
- Theme toggle
- Logout button

**Menu Items:**
- Dashboard
- Invoices
- Expenses
- Contacts
- Projects
- Taxes
- Account Settings

---

#### `Header.jsx`

**Purpose:** Top header bar with user info and actions

**Features:**
- User email display
- Theme toggle
- Language switcher
- Logout button

---

#### `DataTable.jsx`

**Purpose:** Reusable table component for listing data

**Props:**
- `data` (Array): Data rows
- `columns` (Array): Column definitions
- `onRowClick` (Function, optional): Row click handler
- `actions` (Array, optional): Row action buttons

**Column Definition:**
```jsx
{
  key: 'invoiceNumber',
  label: 'Invoice #',
  render: (value, row) => `#${value}`
}
```

---

#### `Modal.jsx`

**Purpose:** Reusable modal dialog

**Props:**
- `isOpen` (boolean): Modal visibility
- `onClose` (Function): Close handler
- `title` (string): Modal title
- `children` (ReactNode): Modal content
- `size` ('sm' | 'md' | 'lg' | 'xl'): Modal size

---

#### `Button.jsx`

**Purpose:** Standardized button component

**Props:**
- `variant` ('primary' | 'secondary' | 'danger' | 'ghost')
- `size` ('sm' | 'md' | 'lg')
- `disabled` (boolean)
- `onClick` (Function)
- `children` (ReactNode)

---

#### `Input.jsx`

**Purpose:** Form input component

**Props:**
- `type` (string): Input type
- `label` (string): Label text
- `error` (string, optional): Error message
- `value` (string)
- `onChange` (Function)
- `required` (boolean)

---

#### `Select.jsx`

**Purpose:** Dropdown select component

**Props:**
- `options` (Array): `[{value, label}]`
- `value` (string)
- `onChange` (Function)
- `placeholder` (string, optional)

---

### Invoice Components

#### `InvoiceCreator.jsx` (Page)

**Purpose:** Create/edit invoice form

**Features:**
- Multi-step form
- Line item management
- VAT calculation (additive/inclusive)
- Swiss QR Bill preview
- PDF generation

**State Management:**
- Form state in component
- Auto-save to Supabase on changes
- Validation before save

---

#### `InvoiceDetail.jsx` (Page)

**Purpose:** View invoice details

**Features:**
- Invoice preview
- Status management
- PDF download
- Email sending
- Duplicate invoice
- Edit/Delete actions

---

#### `FromSection.jsx`

**Purpose:** Invoice "From" section editor

**Props:**
- `data` (Object): From data
- `onChange` (Function): Update handler

---

#### `ToSection.jsx`

**Purpose:** Invoice "To" section editor

**Props:**
- `data` (Object): To data
- `onChange` (Function): Update handler
- `contactId` (UUID, optional): Pre-selected contact

---

#### `ProductsSection.jsx`

**Purpose:** Invoice line items editor

**Features:**
- Add/remove items
- Quantity, unit, price inputs
- VAT rate per item
- Subtotal calculation
- Description autocomplete

---

#### `DescriptionSection.jsx`

**Purpose:** Invoice description/notes editor

**Props:**
- `value` (string): Description text
- `onChange` (Function): Update handler

---

### Expense Components

#### `Expenses.jsx` (Page)

**Purpose:** Expense list view

**Features:**
- Filter by category, type, date range
- Group by month/year
- Total calculations
- Export to CSV (future)

---

#### `NewExpense.jsx` (Page)

**Purpose:** Create/edit expense form

**Features:**
- Category selection
- Type selection (one-time/recurring/asset)
- Receipt upload
- Project linking
- Supplier linking

---

### Contact Components

#### `Contacts.jsx` (Page)

**Purpose:** Contact list view

**Features:**
- Filter by type (customer/supplier)
- Search by name/email
- Quick actions (view/edit/delete)

---

#### `NewContact.jsx` (Page)

**Purpose:** Create/edit contact form

**Features:**
- Type selection (customer/supplier)
- Address fields
- VAT number
- Notes

---

### Project Components

#### `Projects.jsx` (Page)

**Purpose:** Project list view

**Features:**
- Filter by status
- Link to customer
- Budget tracking
- Status management

---

#### `ProjectDetail.jsx` (Page)

**Purpose:** Project detail view

**Features:**
- Project info
- Linked invoices
- Linked expenses
- Budget vs actual

---

### Tax Components

#### `Taxes.jsx` (Page)

**Purpose:** Swiss tax estimation calculator

**Features:**
- Income input
- Expense input
- Canton selection
- Tax breakdown (federal/cantonal/municipal)
- Social security calculations
- Visual charts

---

## Service Layer

### Service Architecture

Services are organized in two layers:

1. **Legacy Services** (`src/services/*.js`): localStorage-based (deprecated)
2. **Supabase Services** (`src/services/supabase/*.js`): Database-backed (active)

### Service Pattern

All Supabase services follow this pattern:

```javascript
import { supabase } from '../../lib/supabase'

export async function getItems() {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function getItemById(id) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function saveItem(itemData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('table_name')
    .insert({ ...itemData, user_id: user.id })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateItem(id, updates) {
  const { data, error } = await supabase
    .from('table_name')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteItem(id) {
  const { error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  return true
}
```

### Service Files

#### `invoiceService.js`

**Functions:**
- `getInvoices()` - Get all invoices for user
- `getInvoiceById(id)` - Get single invoice with relations
- `getNextInvoiceNumber()` - Generate next invoice number (YYYY-NN)
- `saveInvoice(data)` - Create new invoice
- `updateInvoice(id, updates)` - Update invoice
- `updateInvoiceStatus(id, status, paidDate)` - Update status
- `deleteInvoice(id)` - Delete invoice
- `duplicateInvoice(id)` - Duplicate invoice
- `getInvoiceStatus(invoice)` - Calculate status (paid/overdue/pending)
- `getInvoiceStats()` - Get statistics

**Invoice Number Generation:**
- Format: `YYYY-NN` (e.g., `2024-01`, `2024-02`)
- Queries existing invoices for current year
- Increments sequence number

---

#### `contactService.js`

**Functions:**
- `getContacts()` - Get all contacts
- `getContactById(id)` - Get single contact
- `saveContact(data)` - Create contact
- `updateContact(id, updates)` - Update contact
- `deleteContact(id)` - Delete contact

---

#### `projectService.js`

**Functions:**
- `getProjects()` - Get all projects
- `getProjectById(id)` - Get single project with relations
- `saveProject(data)` - Create project
- `updateProject(id, updates)` - Update project
- `deleteProject(id)` - Delete project

---

#### `expenseService.js`

**Functions:**
- `getExpenses()` - Get all expenses
- `getExpenseById(id)` - Get single expense
- `saveExpense(data)` - Create expense
- `updateExpense(id, updates)` - Update expense
- `deleteExpense(id)` - Delete expense

---

#### `settingsService.js`

**Functions:**
- `getProfile()` - Get user profile
- `updateProfile(updates)` - Update profile
- `getVatSettings()` - Get VAT settings
- `updateVatSettings(updates)` - Update VAT settings
- `getBankAccounts()` - Get all bank accounts
- `getDefaultBankAccount()` - Get default bank account
- `saveBankAccount(data)` - Create bank account
- `updateBankAccount(id, updates)` - Update bank account
- `deleteBankAccount(id)` - Delete bank account

---

#### `emailService.js`

**Functions:**
- `sendInvoiceEmail(invoiceId, recipientEmail)` - Send invoice via email

**Implementation:**
- Calls Supabase Edge Function `send-email`
- Requires Resend API key configured

---

## Data Flow & State Management

### State Management Strategy

1. **React Context** for global state:
   - `AuthContext` - User authentication
   - `ThemeContext` - UI theme
   - `LanguageContext` - i18n

2. **Custom Hooks** for data fetching:
   - `useInvoices()` - Invoice data
   - `useContacts()` - Contact data
   - `useProjects()` - Project data
   - `useExpenses()` - Expense data
   - `useSettings()` - Settings data

3. **Component State** for local UI state:
   - Form inputs
   - Modal visibility
   - Filters/searches

### Data Flow Example: Creating an Invoice

```
1. User fills form in InvoiceCreator.jsx
   ↓
2. Component state updates on each input
   ↓
3. User clicks "Save"
   ↓
4. InvoiceCreator calls useInvoices().saveInvoice()
   ↓
5. Hook calls invoiceService.saveInvoice()
   ↓
6. Service calls Supabase API
   ↓
7. Supabase validates RLS policies
   ↓
8. Database inserts invoice
   ↓
9. Service returns new invoice
   ↓
10. Hook updates local state
   ↓
11. Component re-renders with new invoice
```

### Error Handling

**Service Layer:**
- All service functions throw errors
- Errors include Supabase error messages

**Component Layer:**
- Try/catch blocks in event handlers
- Error messages displayed to user
- Console logging for debugging

---

## Authentication & Authorization

### Authentication Flow

1. **Signup:**
   ```
   User → Signup form → Supabase Auth → Email confirmation → Profile created (trigger)
   ```

2. **Login:**
   ```
   User → Login form → Supabase Auth → JWT token → Session stored → Redirect to dashboard
   ```

3. **Onboarding:**
   ```
   New user → Check profile completeness → Redirect to onboarding if incomplete
   ```

### Authorization Model

**Row Level Security (RLS):**
- All database queries filtered by `auth.uid() = user_id`
- Users can only access their own data
- No application-level authorization needed

**Route Protection:**
- `ProtectedRoute` component wraps protected routes
- Checks `isAuthenticated` from `AuthContext`
- Redirects to `/login` if not authenticated
- Redirects to `/onboarding` if profile incomplete

### Onboarding Check

**Requirements:**
- Profile has `name`, `address`, `postal_code`
- At least one bank account with `iban`

**Implementation:**
- `needsOnboarding()` function in `SupabaseAuthContext.jsx`
- Called on auth state change
- Blocks access to protected routes until complete

---

## Features & Functionality

### Invoice Management

**Features:**
- ✅ Create/edit invoices
- ✅ Auto-numbering (YYYY-NN format)
- ✅ Multi-currency (CHF, EUR, USD)
- ✅ VAT calculation (additive/inclusive)
- ✅ Line items with descriptions
- ✅ Swiss QR Bill generation
- ✅ PDF export
- ✅ Email sending (via Edge Function)
- ✅ Status tracking (draft/issued/paid/overdue)
- ✅ Duplicate invoices

**VAT Modes:**
- **Additive:** VAT added to subtotal
  - Subtotal: 100 CHF
  - VAT (8.1%): 8.10 CHF
  - Total: 108.10 CHF

- **Inclusive:** VAT included in price
  - Total: 108.10 CHF
  - VAT (8.1%): 8.10 CHF (calculated)
  - Subtotal: 100 CHF

---

### Expense Tracking

**Features:**
- ✅ One-time expenses
- ✅ Recurring expenses (with end date)
- ✅ Asset tracking (for depreciation)
- ✅ Category classification
- ✅ Receipt upload (Supabase Storage)
- ✅ Project linking
- ✅ Supplier linking
- ✅ Multi-currency support
- ✅ VAT tracking

**Categories:**
- Office
- Travel
- Software
- Equipment
- Marketing
- Professional Services
- Other

---

### Project Management

**Features:**
- ✅ Create/edit projects
- ✅ Link to customers
- ✅ Status tracking (active/completed/archived)
- ✅ Budget tracking
- ✅ Hourly rate setting
- ✅ Link invoices to projects
- ✅ Link expenses to projects
- ✅ Budget vs actual comparison

---

### Contact Management

**Features:**
- ✅ Customer management
- ✅ Supplier management
- ✅ Contact details (address, email, phone)
- ✅ VAT number storage
- ✅ Notes field
- ✅ Quick selection in invoices

---

### Tax Estimation

**Features:**
- ✅ Swiss federal tax calculation
- ✅ Cantonal tax (26 cantons)
- ✅ Municipal tax estimation
- ✅ Social security calculations:
  - AHV/IV/EO (10.6%)
  - ALV (2.2%, capped)
  - BVG (7%, estimated)
- ✅ Visual breakdown charts
- ✅ Effective tax rate calculation

**Tax Calculation Flow:**
```
Gross Income
  - Expenses
  = Net Income
  - Social Security (50% deductible)
  = Taxable Income
  → Federal Tax (progressive brackets)
  → Cantonal Tax (multiplier × federal)
  → Municipal Tax (80% × cantonal)
  + Social Security
  = Total Tax Burden
```

---

### Swiss QR Bill

**Implementation:**
- Uses `swissqrbill` library
- Generates QR code data URL
- Embedded in PDF at bottom (105mm height)
- Supports IBAN and QR-IBAN formats
- Includes payment amount, currency, reference

**QR Bill Data:**
- Creditor information (from profile)
- Debtor information (from invoice "To")
- Payment amount
- Currency
- Invoice reference
- IBAN for payment

---

### PDF Generation

**Library:** `pdfmake`

**Features:**
- Professional invoice layout
- Company logo support (PNG/JPEG)
- Swiss QR Bill integration
- Download or preview in browser
- A4 format
- Proper margins for QR code

**PDF Structure:**
1. Header (logo + invoice number)
2. Three-column info (Issuer, Bill To, Invoice Details)
3. Description (optional)
4. Charges section (line items)
5. Swiss QR Bill (bottom, 105mm)

---

### Multi-language Support

**Languages:**
- English (`en.json`)
- German (`de.json`)

**Implementation:**
- `LanguageContext` provides `t()` function
- Translation keys in JSON files
- Language switcher in sidebar
- Persisted in localStorage

**Usage:**
```jsx
const { t } = useLanguage()
<h1>{t('dashboard.title')}</h1>
```

---

### Theme Support

**Themes:**
- Light mode (default)
- Dark mode

**Implementation:**
- `ThemeContext` provides `isDark` boolean
- Tailwind CSS `dark:` classes
- Persisted in localStorage
- System preference detection (future)

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router | 7.9.6 | Routing |
| Vite | 5.0.8 | Build tool |
| Tailwind CSS | 3.4.0 | Styling |
| MUI X Charts | 8.21.0 | Charts/graphs |
| date-fns | 3.6.0 | Date formatting |
| react-datepicker | 6.9.0 | Date picker |
| react-select | 5.8.0 | Select dropdowns |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL | Database |
| Auth | Authentication |
| Storage | File storage (logos, receipts) |
| Edge Functions | Serverless functions (email) |

### PDF & QR

| Library | Version | Purpose |
|---------|---------|---------|
| pdfmake | 0.2.20 | PDF generation |
| swissqrbill | 4.2.1 | Swiss QR Bill generation |
| qrcode | 1.5.4 | QR code generation |

### Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixes |

---

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)

### Installation

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd fakturio
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Follow `SUPABASE_SETUP.md`
   - Create `.env` file:
     ```env
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJ...
     ```

4. **Run database migrations:**
   - Copy `supabase/schema.sql` to Supabase SQL Editor
   - Run the script

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:**
   - Navigate to `http://localhost:5173`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

### Development Scripts

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## Deployment

### Vercel Deployment

1. **Connect repository to Vercel**

2. **Set environment variables:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Build settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`

4. **Deploy:**
   - Vercel auto-deploys on push to main branch

### Supabase Configuration

**Before deploying:**
1. Update Site URL in Supabase Auth settings
2. Add production URL to redirect URLs
3. Enable email confirmations (if required)
4. Set up custom domain (optional)

### Production Checklist

- [ ] Environment variables set
- [ ] Supabase redirect URLs configured
- [ ] Email templates customized
- [ ] Database backups enabled
- [ ] Storage buckets created
- [ ] RLS policies tested
- [ ] Edge functions deployed (if using email)

---

## API Reference

### Supabase Client

**Initialization:**
```javascript
import { supabase } from './lib/supabase'
```

**Authentication:**
```javascript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

**Database Queries:**
```javascript
// Select
const { data, error } = await supabase
  .from('invoices')
  .select('*')
  .eq('user_id', userId)

// Insert
const { data, error } = await supabase
  .from('invoices')
  .insert({ ...invoiceData })
  .select()
  .single()

// Update
const { data, error } = await supabase
  .from('invoices')
  .update({ status: 'paid' })
  .eq('id', invoiceId)
  .select()
  .single()

// Delete
const { error } = await supabase
  .from('invoices')
  .delete()
  .eq('id', invoiceId)
```

**Storage:**
```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('logos')
  .upload(`${userId}/logo.png`, file)

// Get public URL
const { data } = supabase.storage
  .from('logos')
  .getPublicUrl(`${userId}/logo.png`)
```

---

## Data Models

### Invoice Model

```typescript
interface Invoice {
  id: string
  user_id: string
  contact_id: string
  project_id?: string
  bank_account_id: string
  invoice_number: string
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled'
  currency: string
  issued_on: string // ISO date
  due_date: string // ISO date
  paid_date?: string // ISO date
  subtotal: number
  vat_amount: number
  vat_rate: number
  total: number
  from_info: {
    name?: string
    companyName?: string
    street?: string
    zip?: string
    email?: string
    telephone?: string
    website?: string
    uid?: string
    logo?: string
  }
  to_info: {
    name: string
    address?: string
    zip?: string
    email?: string
    uid?: string
  }
  items: Array<{
    description: string
    quantity: number
    um: number
    pricePerUm: number
    vat: number
  }>
  notes?: string
  payment_terms: string
  created_at: string
  updated_at: string
}
```

### Contact Model

```typescript
interface Contact {
  id: string
  user_id: string
  type: 'customer' | 'supplier'
  name: string
  company_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country: string
  vat_number?: string
  notes?: string
  created_at: string
  updated_at: string
}
```

### Project Model

```typescript
interface Project {
  id: string
  user_id: string
  contact_id?: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  hourly_rate?: number
  budget?: number
  currency: string
  start_date?: string // ISO date
  end_date?: string // ISO date
  created_at: string
  updated_at: string
}
```

### Expense Model

```typescript
interface Expense {
  id: string
  user_id: string
  project_id?: string
  contact_id?: string
  name: string
  description?: string
  category?: 'Office' | 'Travel' | 'Software' | 'Equipment' | 'Marketing' | 'Professional Services' | 'Other'
  type: 'one-time' | 'recurring' | 'asset'
  amount: number
  currency: string
  vat_amount?: number
  vat_rate?: number
  date: string // ISO date
  end_date?: string // ISO date (for recurring)
  receipt_url?: string
  created_at: string
  updated_at: string
}
```

---

## Security Considerations

### Row Level Security (RLS)

- All tables have RLS enabled
- Users can only access their own data
- Policies enforced at database level
- No application-level authorization needed

### Authentication

- JWT tokens managed by Supabase
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Auto-refresh on token expiration
- Session persistence across page reloads

### Data Validation

- Client-side validation in forms
- Database constraints (NOT NULL, CHECK)
- Type validation in TypeScript (future)
- Input sanitization (XSS prevention)

### File Uploads

- File size limits (configure in Supabase Storage)
- File type validation (images only for logos)
- User-scoped storage paths (`${userId}/filename`)
- Public read access (consider signed URLs for receipts)

---

## Performance Considerations

### Database Indexes

- Indexes on `user_id` for all tables
- Indexes on `status` and `due_date` for invoices
- Indexes on `date` and `category` for expenses

### Query Optimization

- Use `.select()` to limit returned columns
- Use `.limit()` for pagination (future)
- Avoid N+1 queries (use joins)
- Cache frequently accessed data (future)

### Frontend Optimization

- Code splitting (Vite handles automatically)
- Lazy loading for heavy components
- Image optimization (compress logos)
- PDF generation is client-side (consider server-side for large invoices)

---

## Future Enhancements

### Planned Features

- [ ] Invoice templates
- [ ] Recurring invoices
- [ ] Payment reminders (automated emails)
- [ ] Multi-user support (teams)
- [ ] API access for integrations
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)
- [ ] Advanced reporting
- [ ] Export to accounting software
- [ ] Multi-language expansion (French, Italian)

### Technical Improvements

- [ ] TypeScript migration
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog)
- [ ] Database migrations (Supabase Migrations)
- [ ] CI/CD pipeline

---

## Troubleshooting

### Common Issues

**"Invalid API key"**
- Check `.env` file has correct values
- Ensure `VITE_` prefix is used
- Restart dev server after changing `.env`

**"Row Level Security violation"**
- Verify RLS policies are set up
- Check user is authenticated
- Ensure `user_id` matches `auth.uid()`

**"Email not sending"**
- Verify Resend API key in Edge Function secrets
- Check Edge Function logs in Supabase dashboard
- Ensure email templates are configured

**"PDF generation fails"**
- Check browser console for errors
- Verify QR code data is valid
- Ensure logo is PNG/JPEG (not SVG)

**"Onboarding loop"**
- Check profile has required fields
- Verify bank account has IBAN
- Check browser console for errors

---

## Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

### Code Style

- Use ESLint/Prettier
- Follow React best practices
- Write descriptive commit messages
- Document complex functions

---

## License

MIT License

---

## Support

For issues or questions:
1. Check documentation
2. Review Supabase logs
3. Check browser console
4. Open GitHub issue

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Maintained by:** Fakturio Team

