# 📄 Invoice Detail Page - UI & Layout Guide

Complete documentation on how the invoice detail/view page user interface and layout is constructed, including component structure, styling patterns, and responsive design.

**Location:** `src/pages/InvoiceDetail.jsx`

---

## Table of Contents

1. [Page Overview](#page-overview)
2. [Layout Structure](#layout-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Header Section](#header-section)
5. [Invoice Card Layout](#invoice-card-layout)
6. [Styling Patterns](#styling-patterns)
7. [Responsive Design](#responsive-design)
8. [Action Buttons](#action-buttons)
9. [Data Display Patterns](#data-display-patterns)

---

## Page Overview

The Invoice Detail page displays a read-only view of an invoice with:
- Invoice header with status and actions
- Client information section
- Invoice metadata grid
- Line items table
- Total amount display
- Action buttons (Edit, Preview, Download, Duplicate, Mark Paid)

**Key Features:**
- Read-only display (editing redirects to `/invoices/:id/edit`)
- Status badge with dynamic status calculation
- Due date countdown
- Responsive grid layouts
- Action buttons with icon + label pattern
- Card-based layout with sections

---

## Layout Structure

### High-Level Layout

```
PageLayout (Wrapper)
├── BackLink (Navigation)
├── Header Section
│   ├── Title + Status
│   └── Action Buttons (Right)
└── Invoice Card
    ├── Client Info Section
    ├── Invoice Details Grid
    └── Line Items Section
        ├── Table Header
        ├── Item Rows
        └── Total Display
```

### Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                      │
├─────────────────────────────────────────────────────────┤
│ Invoice #2024-01    [Status Badge] Due in 5 days        │
│                                                          │
│ [Edit] [Preview] [Download] [Duplicate] [Mark Paid]    │
├─────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐  │
│ │ Client Name                                        │  │
│ │ Address                                            │  │
│ │ ZIP / City                                         │  │
│ │ UID: CHE-123.456.789                              │  │
│ ├───────────────────────────────────────────────────┤  │
│ │ Issued On    Due Date    Invoice #    Issued By   │  │
│ │ 01.01.2024   15.01.2024  2024-01     John Doe    │  │
│ ├───────────────────────────────────────────────────┤  │
│ │ Description              Qty    Price    Total    │  │
│ │ ────────────────────────────────────────────────  │  │
│ │ Web Development          10     150.00   1,500.00 │  │
│ │ Design                   5      200.00   1,000.00 │  │
│ │ ────────────────────────────────────────────────  │  │
│ │                                    Total: 2,500.00 │  │
│ └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### Main Component

```jsx
<PageLayout>
  <BackLink />
  <Header />
  <InvoiceCard>
    <ClientSection />
    <DetailsGrid />
    <LineItemsSection />
  </InvoiceCard>
</PageLayout>
```

### Code Structure

```jsx
export default function InvoiceDetail() {
  // State management
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Data loading
  useEffect(() => {
    // Load invoice data
  }, [user, id])
  
  // Handlers
  const handleMarkAsPaid = () => { /* ... */ }
  const handlePreviewPDF = () => { /* ... */ }
  const handleDownloadPDF = () => { /* ... */ }
  
  return (
    <PageLayout>
      {/* Components */}
    </PageLayout>
  )
}
```

---

## Header Section

### Layout Pattern

**Two-column flex layout:**
- **Left:** Title + Status + Due date
- **Right:** Action buttons

### Implementation

```jsx
<div className="flex items-start justify-between">
  {/* Left Column */}
  <div className="flex flex-col gap-2">
    <h1 className="text-[28px] font-semibold text-[#141414] dark:text-white">
      Invoice {invoice.invoiceData?.invoiceNumber || invoice.id}
    </h1>
    <div className="flex items-center gap-3">
      <StatusBadge status={currentStatus} />
      {daysUntilDue !== null && currentStatus !== 'paid' && (
        <span className="text-[13px] text-[#666666] dark:text-[#999]">
          {daysUntilDue > 0 
            ? `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
            : daysUntilDue === 0 
              ? 'Due today'
              : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue`
          }
        </span>
      )}
    </div>
  </div>
  
  {/* Right Column - Action Buttons */}
  <div className="flex items-center gap-6">
    {/* Action buttons */}
  </div>
</div>
```

### Typography

- **Title:** `text-[28px] font-semibold`
- **Due Date:** `text-[13px]` (muted color)
- **Status Badge:** Component with colored background

### Spacing

- **Gap between title and status:** `gap-2` (8px)
- **Gap between status elements:** `gap-3` (12px)
- **Gap between action buttons:** `gap-6` (24px)

---

## Invoice Card Layout

### Card Structure

**Single card container with three sections:**

```jsx
<div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm">
  {/* Section 1: Client Info */}
  <div className="p-6 border-b border-[#f0f0f0] dark:border-[#333]">
    {/* Client details */}
  </div>
  
  {/* Section 2: Invoice Details Grid */}
  <div className="p-6 border-b border-[#f0f0f0] dark:border-[#333]">
    {/* Metadata grid */}
  </div>
  
  {/* Section 3: Line Items */}
  <div className="p-6">
    {/* Items table */}
  </div>
</div>
```

### Card Styling

```css
/* Base Card */
background: white (light) / #252525 (dark)
border: 1px solid #e0e0e0 (light) / #333 (dark)
border-radius: 12px (rounded-xl)
box-shadow: small (shadow-sm)
padding: 24px (p-6) per section
```

### Section Dividers

**Border between sections:**
```jsx
className="border-b border-[#f0f0f0] dark:border-[#333]"
```

---

## Client Info Section

### Layout

**Simple vertical stack:**

```jsx
<div className="p-6 border-b border-[#f0f0f0] dark:border-[#333]">
  <h2 className="text-[18px] font-semibold text-[#141414] dark:text-white mb-3">
    {invoice.toData?.name || 'Client'}
  </h2>
  <div className="text-[14px] text-[#666666] dark:text-[#999] space-y-1">
    {invoice.toData?.address && <p>{invoice.toData.address}</p>}
    {invoice.toData?.zip && <p>{invoice.toData.zip}</p>}
    {invoice.toData?.uid && (
      <p className="mt-2">
        <span className="text-[#999999] dark:text-[#666]">UID: </span>
        {invoice.toData.uid}
      </p>
    )}
  </div>
</div>
```

### Typography

- **Client Name:** `text-[18px] font-semibold` (heading)
- **Address Lines:** `text-[14px]` (body, muted)
- **UID Label:** `text-[#999999]` (very muted)
- **UID Value:** Inherits from parent

### Spacing

- **Margin below heading:** `mb-3` (12px)
- **Vertical spacing between lines:** `space-y-1` (4px)
- **UID margin top:** `mt-2` (8px)

---

## Invoice Details Grid

### Responsive Grid Layout

**2 columns on mobile, 4 columns on desktop:**

```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  <div>
    <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">
      Issued On
    </p>
    <p className="text-[14px] text-[#141414] dark:text-white">
      {formatDate(invoice.invoiceData?.issuedOn)}
    </p>
  </div>
  {/* More grid items */}
</div>
```

### Grid Items

**Each grid item contains:**
1. **Label** (uppercase, small, muted)
2. **Value** (normal size, primary color)

### Grid Item Pattern

```jsx
<div>
  {/* Label */}
  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">
    {label}
  </p>
  {/* Value */}
  <p className="text-[14px] text-[#141414] dark:text-white">
    {value}
  </p>
</div>
```

### Grid Spacing

- **Gap between items:** `gap-6` (24px)
- **Margin below label:** `mb-1` (4px)

### Fields Displayed

1. **Issued On** - Invoice issue date
2. **Due** - Due date
3. **Invoice Number** - Invoice number
4. **Issued By** - Sender name
5. **Project** (optional) - Linked project name (link)

---

## Line Items Section

### Table Structure

**12-column grid system:**

```jsx
<div className="p-6">
  {/* Table Header */}
  <div className="mb-4">
    <div className="grid grid-cols-12 gap-4 pb-2 border-b border-[#f0f0f0] dark:border-[#333] text-[11px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide">
      <div className="col-span-6">Description</div>
      <div className="col-span-2 text-right">Qty</div>
      <div className="col-span-2 text-right">Price</div>
      <div className="col-span-2 text-right">Total</div>
    </div>
  </div>
  
  {/* Table Rows */}
  <div className="space-y-3">
    {invoice.items?.map((item, index) => (
      <div key={index} className="grid grid-cols-12 gap-4 text-[14px]">
        {/* Row content */}
      </div>
    ))}
  </div>
  
  {/* Total */}
  <div className="mt-6 pt-4 border-t border-[#e0e0e0] dark:border-[#444] flex justify-end">
    {/* Total display */}
  </div>
</div>
```

### Column Distribution

| Column | Span | Alignment | Content |
|--------|------|-----------|---------|
| Description | 6/12 (50%) | Left | Item description + unit |
| Quantity | 2/12 (16.7%) | Right | Quantity value |
| Price | 2/12 (16.7%) | Right | Price per unit |
| Total | 2/12 (16.7%) | Right | Line total |

### Table Header Styling

```css
font-size: 11px
font-weight: 500 (medium)
color: #999999 (muted)
text-transform: uppercase
letter-spacing: wide (tracking-wide)
border-bottom: 1px solid #f0f0f0
padding-bottom: 8px
margin-bottom: 4px
```

### Table Row Styling

```css
font-size: 14px
vertical-spacing: 12px (space-y-3)
```

### Row Content Pattern

```jsx
<div className="grid grid-cols-12 gap-4 text-[14px]">
  {/* Description */}
  <div className="col-span-6 text-[#141414] dark:text-white">
    {item.description || 'Item'}
    {item.um && (
      <span className="text-[#999999] dark:text-[#666] ml-1">
        ({item.um})
      </span>
    )}
  </div>
  
  {/* Quantity */}
  <div className="col-span-2 text-right text-[#666666] dark:text-[#999]">
    {qty}
  </div>
  
  {/* Price */}
  <div className="col-span-2 text-right text-[#666666] dark:text-[#999]">
    {formatCurrency(price, currency)}
  </div>
  
  {/* Total */}
  <div className="col-span-2 text-right font-medium text-[#141414] dark:text-white">
    {formatCurrency(total, currency)}
  </div>
</div>
```

### Total Display

**Right-aligned total section:**

```jsx
<div className="mt-6 pt-4 border-t border-[#e0e0e0] dark:border-[#444] flex justify-end">
  <div className="text-right">
    <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">
      Total
    </p>
    <p className="text-[24px] font-semibold text-[#141414] dark:text-white">
      {formatCurrency(invoice.grandTotal, currency)}
    </p>
  </div>
</div>
```

**Styling:**
- **Margin top:** `mt-6` (24px)
- **Padding top:** `pt-4` (16px)
- **Border top:** 1px solid divider color
- **Total label:** `text-[12px]` uppercase, muted
- **Total value:** `text-[24px] font-semibold` (large, bold)

---

## Action Buttons

### Button Pattern

**Icon + Label vertical layout:**

```jsx
<button className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
    <Icon size={18} />
  </div>
  <span className="text-[11px] font-medium">Label</span>
</button>
```

### Button Structure

1. **Container:** Flex column, centered items
2. **Icon Circle:** 40px × 40px rounded circle
3. **Label:** Small text below icon

### Button Variants

#### Standard Action Button

```jsx
<button className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
    <Icon size={18} />
  </div>
  <span className="text-[11px] font-medium">Edit</span>
</button>
```

#### Primary Action Button (Mark Paid)

```jsx
<button className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
  <div className="w-10 h-10 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center">
    <CheckIcon />
  </div>
  <span className="text-[11px] font-medium text-[#141414] dark:text-white">Mark Paid</span>
</button>
```

### Button Spacing

- **Gap between buttons:** `gap-6` (24px)
- **Gap between icon and label:** `gap-1` (4px)

### Available Actions

1. **Edit** - Navigate to edit page
2. **Preview** - Open PDF in new tab
3. **Download** - Download PDF file
4. **Duplicate** - Create copy of invoice
5. **Mark Paid** / **Mark Issued** - Toggle status

---

## Styling Patterns

### Color Scheme

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | `#ffffff` | `#252525` |
| **Border** | `#e0e0e0` | `#333` |
| **Text Primary** | `#141414` | `#ffffff` |
| **Text Muted** | `#666666` | `#999` |
| **Text Very Muted** | `#999999` | `#666` |
| **Divider** | `#f0f0f0` | `#333` |

### Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| **Page Title** | 28px | Semibold (600) | Primary |
| **Section Heading** | 18px | Semibold (600) | Primary |
| **Body Text** | 14px | Regular (400) | Primary |
| **Muted Text** | 14px | Regular (400) | Muted |
| **Label** | 12px | Medium (500) | Very Muted |
| **Small Label** | 11px | Medium (500) | Very Muted |
| **Total Value** | 24px | Semibold (600) | Primary |

### Spacing Scale

| Spacing | Value | Usage |
|---------|-------|-------|
| **gap-1** | 4px | Icon-label gap |
| **gap-2** | 8px | Title-status gap |
| **gap-3** | 12px | Status elements |
| **gap-4** | 16px | Grid gaps |
| **gap-6** | 24px | Button groups, grid gaps |
| **p-6** | 24px | Card section padding |
| **mb-3** | 12px | Heading margin |
| **mb-4** | 16px | Section margin |
| **mt-6** | 24px | Total section margin |

### Border Radius

- **Card:** `rounded-xl` (12px)
- **Button Circle:** `rounded-full` (50%)

### Shadows

- **Card:** `shadow-sm` (subtle shadow)

---

## Responsive Design

### Breakpoints

**Mobile (< 768px):**
- Invoice details grid: 2 columns
- Action buttons: Horizontal scroll or wrap
- Padding: Full `p-6` (24px)

**Desktop (≥ 768px):**
- Invoice details grid: 4 columns
- Action buttons: Horizontal row
- Padding: Full `p-6` (24px)

### Grid Responsiveness

```jsx
{/* 2 columns on mobile, 4 on desktop */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  {/* Grid items */}
</div>
```

### Action Buttons Responsiveness

**Buttons maintain size but may wrap on very small screens:**

```jsx
<div className="flex items-center gap-6">
  {/* Buttons - may wrap on mobile */}
</div>
```

---

## Data Display Patterns

### Date Formatting

**Uses `formatDate` utility:**

```jsx
{formatDate(invoice.invoiceData?.issuedOn || invoice.createdAt)}
```

**Format:** `DD.MM.YYYY` (e.g., "15.01.2024")

### Currency Formatting

**Uses `formatCurrency` utility:**

```jsx
{formatCurrency(invoice.grandTotal, currency)}
```

**Format:** Currency code + formatted number (e.g., "CHF 2,500.00")

### Status Calculation

**Dynamic status based on dates:**

```jsx
const getInvoiceStatus = (invoice) => {
  if (invoice.status === 'paid') return 'paid'
  
  const dueDate = invoice.due_date || invoice.dueDate
  if (dueDate) {
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (due < today) return 'overdue'
  }
  
  return 'pending'
}
```

### Due Date Countdown

**Calculates days until/since due:**

```jsx
const getDaysUntilDue = () => {
  if (!invoice?.dueDate) return null
  const due = new Date(invoice.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  return diff
}
```

**Display logic:**
- Positive: "Due in X days"
- Zero: "Due today"
- Negative: "X days overdue"

---

## Loading & Error States

### Loading State

```jsx
if (loading) {
  return (
    <PageLayout>
      <p className="text-[#666666] dark:text-[#999]">Loading...</p>
    </PageLayout>
  )
}
```

### Not Found State

```jsx
if (!invoice) {
  return (
    <PageLayout>
      <p className="text-[#666666] dark:text-[#999]">Invoice not found</p>
      <Link to="/dashboard" className="text-[#141414] dark:text-white underline mt-4 inline-block">
        Back to Dashboard
      </Link>
    </PageLayout>
  )
}
```

---

## Component Integration

### PageLayout Wrapper

**Provides consistent page structure:**

```jsx
<PageLayout>
  {/* Page content */}
</PageLayout>
```

**Includes:**
- Sidebar navigation
- Header with user info
- Main content area
- Responsive layout

### BackLink Component

**Navigation back button:**

```jsx
<BackLink to="/dashboard" label={t('dashboard.title')} />
```

**Styling:** Link with back icon, muted color

### StatusBadge Component

**Status indicator:**

```jsx
<StatusBadge status={currentStatus} />
```

**Shows:** Colored badge with status text (paid, pending, overdue)

---

## Implementation Example

### Complete Structure

```jsx
export default function InvoiceDetail() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Load invoice data
  useEffect(() => {
    if (user && id) {
      const inv = getInvoiceById(user.id, id)
      setInvoice(inv)
      setLoading(false)
    }
  }, [user, id])
  
  if (loading) return <PageLayout><p>Loading...</p></PageLayout>
  if (!invoice) return <PageLayout><p>Not found</p></PageLayout>
  
  return (
    <PageLayout>
      {/* Back Link */}
      <BackLink to="/dashboard" />
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h1>Invoice {invoice.invoiceData?.invoiceNumber}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            <span>Due in X days</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Action buttons */}
        </div>
      </div>
      
      {/* Invoice Card */}
      <div className="bg-white dark:bg-[#252525] border rounded-xl shadow-sm">
        {/* Client Section */}
        <div className="p-6 border-b">
          {/* Client info */}
        </div>
        
        {/* Details Grid */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Grid items */}
          </div>
        </div>
        
        {/* Line Items */}
        <div className="p-6">
          {/* Table */}
        </div>
      </div>
    </PageLayout>
  )
}
```

---

## Best Practices

### 1. Consistent Spacing
- Use Tailwind spacing scale consistently
- Maintain visual rhythm with consistent gaps

### 2. Typography Hierarchy
- Clear distinction between headings and body text
- Use muted colors for secondary information

### 3. Responsive Grids
- Use `grid-cols-2 md:grid-cols-4` pattern for responsive grids
- Ensure content is readable on all screen sizes

### 4. Dark Mode Support
- Always include dark mode variants
- Test contrast ratios for accessibility

### 5. Loading States
- Show loading indicator while fetching data
- Handle error states gracefully

### 6. Action Feedback
- Provide visual feedback on button hover
- Use transitions for smooth interactions

---

## Accessibility Considerations

### Semantic HTML
- Use proper heading hierarchy (`h1`, `h2`)
- Use `button` elements for actions
- Use `Link` for navigation

### Color Contrast
- Text meets WCAG AA contrast requirements
- Status badges have sufficient contrast

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus states are visible

### Screen Readers
- Descriptive labels for all actions
- Status information is announced
- Table structure is semantic

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Component:** InvoiceDetail.jsx
