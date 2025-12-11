# 🚀 Fakturio Quick Reference Guide

Quick reference for common tasks and information.

## Table of Contents

- [Quick Links](#quick-links)
- [Common Tasks](#common-tasks)
- [File Locations](#file-locations)
- [Key Functions](#key-functions)
- [Environment Variables](#environment-variables)
- [Database Tables](#database-tables)
- [Component Props](#component-props)
- [Service Functions](#service-functions)

---

## Quick Links

- **Full Documentation**: [PROJECT_SCHEMA.md](./PROJECT_SCHEMA.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Database Schema**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **Supabase Setup**: [../SUPABASE_SETUP.md](../SUPABASE_SETUP.md)

---

## Common Tasks

### Adding a New Page

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/new-page" element={<ProtectedRoute><NewPage /></ProtectedRoute>} />
   ```
3. Add navigation item in `src/components/Sidebar.jsx`

### Adding a New Service Function

1. Add function to appropriate service file in `src/services/supabase/`
2. Export from `src/services/supabase/index.js`
3. Use in hook (`src/hooks/use*.js`)

### Adding a Translation

1. Add key-value pair to `src/translations/en.json` and `src/translations/de.json`
2. Use in component:
   ```jsx
   const { t } = useLanguage()
   <h1>{t('key.name')}</h1>
   ```

### Creating a New Component

1. Create file in `src/components/`
2. Follow existing component patterns
3. Use Tailwind CSS for styling
4. Support dark mode with `dark:` classes

---

## File Locations

| What | Where |
|------|-------|
| Main App | `src/App.jsx` |
| Entry Point | `src/main.jsx` |
| Routes | `src/App.jsx` (Routes component) |
| Auth Context | `src/context/SupabaseAuthContext.jsx` |
| Supabase Client | `src/lib/supabase.js` |
| Invoice Service | `src/services/supabase/invoiceService.js` |
| Contact Service | `src/services/supabase/contactService.js` |
| PDF Generator | `src/utils/pdfGenerator.js` |
| QR Code Generator | `src/utils/generateQRCode.js` |
| Translations | `src/translations/en.json`, `src/translations/de.json` |
| Database Schema | `supabase/schema.sql` |
| Tailwind Config | `tailwind.config.js` |
| Vite Config | `vite.config.js` |

---

## Key Functions

### Authentication

```javascript
// Get current user
const { user } = useAuth()

// Check if authenticated
const { isAuthenticated } = useAuth()

// Login
await login(email, password)

// Signup
await signup(email, password, name)

// Logout
await logout()
```

### Invoices

```javascript
// Get all invoices
const invoices = await getInvoices()

// Get single invoice
const invoice = await getInvoiceById(id)

// Save invoice
const newInvoice = await saveInvoice(invoiceData)

// Update invoice
const updated = await updateInvoice(id, updates)

// Delete invoice
await deleteInvoice(id)

// Generate next invoice number
const nextNumber = await getNextInvoiceNumber()
```

### Contacts

```javascript
// Get all contacts
const contacts = await getContacts()

// Save contact
const contact = await saveContact(contactData)

// Update contact
await updateContact(id, updates)

// Delete contact
await deleteContact(id)
```

### PDF Generation

```javascript
// Download PDF
await downloadInvoicePDF({
  invoiceData: { ... },
  fromData: { ... },
  toData: { ... },
  items: [ ... ],
  includeQRCode: true
})

// Preview PDF
await previewInvoicePDF({ ... })
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

**Location**: `.env` file in project root

---

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User profiles | `id`, `email`, `name`, `company_name` |
| `vat_settings` | VAT configuration | `user_id`, `mode`, `default_rate` |
| `bank_accounts` | Bank accounts | `user_id`, `iban`, `is_default` |
| `contacts` | Customers/suppliers | `user_id`, `type`, `name` |
| `projects` | Projects | `user_id`, `contact_id`, `name`, `status` |
| `invoices` | Invoices | `user_id`, `contact_id`, `invoice_number`, `status` |
| `expenses` | Expenses | `user_id`, `category`, `type`, `amount` |
| `description_suggestions` | Autocomplete | `user_id`, `description` |

---

## Component Props

### PageLayout

```jsx
<PageLayout title="Page Title">
  {children}
</PageLayout>
```

### Modal

```jsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md" // 'sm' | 'md' | 'lg' | 'xl'
>
  {content}
</Modal>
```

### Button

```jsx
<Button
  variant="primary" // 'primary' | 'secondary' | 'danger' | 'ghost'
  size="md" // 'sm' | 'md' | 'lg'
  onClick={handleClick}
  disabled={false}
>
  Button Text
</Button>
```

### Input

```jsx
<Input
  type="text"
  label="Label"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={error}
  required={true}
/>
```

### DataTable

```jsx
<DataTable
  data={data}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
  ]}
  onRowClick={(row) => handleClick(row)}
  actions={[
    { label: 'Edit', onClick: (row) => edit(row) }
  ]}
/>
```

---

## Service Functions

### Invoice Service

```javascript
import * as invoiceService from './services/supabase/invoiceService'

// All functions return Promises
invoiceService.getInvoices()
invoiceService.getInvoiceById(id)
invoiceService.getNextInvoiceNumber()
invoiceService.saveInvoice(data)
invoiceService.updateInvoice(id, updates)
invoiceService.updateInvoiceStatus(id, status, paidDate)
invoiceService.deleteInvoice(id)
invoiceService.duplicateInvoice(id)
invoiceService.getInvoiceStatus(invoice)
invoiceService.getInvoiceStats()
```

### Contact Service

```javascript
import * as contactService from './services/supabase/contactService'

contactService.getContacts()
contactService.getContactById(id)
contactService.saveContact(data)
contactService.updateContact(id, updates)
contactService.deleteContact(id)
```

### Settings Service

```javascript
import * as settingsService from './services/supabase/settingsService'

settingsService.getProfile()
settingsService.updateProfile(updates)
settingsService.getVatSettings()
settingsService.updateVatSettings(updates)
settingsService.getBankAccounts()
settingsService.getDefaultBankAccount()
settingsService.saveBankAccount(data)
settingsService.updateBankAccount(id, updates)
settingsService.deleteBankAccount(id)
```

---

## Common Patterns

### Using Hooks

```jsx
import { useInvoices } from '../hooks/useInvoices'

function MyComponent() {
  const { invoices, isLoading, saveInvoice } = useInvoices()
  
  const handleSave = async () => {
    await saveInvoice(invoiceData)
  }
  
  if (isLoading) return <div>Loading...</div>
  
  return <div>{/* ... */}</div>
}
```

### Using Context

```jsx
import { useAuth } from '../context/SupabaseAuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'

function MyComponent() {
  const { user, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t, currentLanguage } = useLanguage()
  
  return <div>{/* ... */}</div>
}
```

### Error Handling

```jsx
try {
  const invoice = await saveInvoice(data)
  // Success
} catch (error) {
  console.error('Error:', error)
  // Show error to user
  alert(error.message)
}
```

### Form Handling

```jsx
const [formData, setFormData] = useState({
  name: '',
  email: ''
})

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await saveContact(formData)
  } catch (error) {
    console.error(error)
  }
}
```

---

## Database Queries

### Get User's Invoices

```javascript
const { data, error } = await supabase
  .from('invoices')
  .select('*, contact:contacts(*), project:projects(*)')
  .order('created_at', { ascending: false })
```

### Get Invoice with Relations

```javascript
const { data, error } = await supabase
  .from('invoices')
  .select(`
    *,
    contact:contacts(*),
    project:projects(*),
    bank_account:bank_accounts(*)
  `)
  .eq('id', invoiceId)
  .single()
```

### Insert Invoice

```javascript
const { data, error } = await supabase
  .from('invoices')
  .insert({
    user_id: user.id,
    invoice_number: '2024-01',
    // ... other fields
  })
  .select()
  .single()
```

---

## Styling

### Tailwind Classes

```jsx
// Common patterns
<div className="bg-white dark:bg-gray-900">
<div className="text-gray-900 dark:text-white">
<div className="border border-gray-200 dark:border-gray-700">
<button className="bg-blue-500 hover:bg-blue-600">
```

### Responsive Design

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Testing Checklist

Before deploying:

- [ ] All routes work
- [ ] Authentication works
- [ ] CRUD operations work
- [ ] PDF generation works
- [ ] QR code generation works
- [ ] Dark mode works
- [ ] Language switching works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Environment variables set

---

## Troubleshooting Quick Fixes

**"Invalid API key"**
- Check `.env` file exists
- Restart dev server after changing `.env`

**"RLS violation"**
- Check user is authenticated
- Verify RLS policies are set up

**"PDF not generating"**
- Check browser console
- Verify QR code data is valid
- Ensure logo is PNG/JPEG

**"Onboarding loop"**
- Check profile has required fields
- Verify bank account has IBAN

---

**Last Updated:** December 2024

