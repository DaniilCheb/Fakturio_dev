# Fakturio

A comprehensive Swiss invoicing and expense tracking application built with React and Tailwind CSS.

## Features

### Invoicing
- Create, edit, and manage professional invoices
- Swiss QR Bill generation for payment slips
- PDF generation and download
- Invoice preview in browser
- Automatic invoice numbering (YYYY-NN format)
- Multi-currency support (CHF, EUR, USD)
- VAT calculation (additive or inclusive modes)
- Customer and project management
- Form validation with visual error indicators

### Expense Tracking
- Track one-time, recurring, and asset expenses
- Multiple expense categories
- Receipt upload and management
- Currency conversion with exchange rates
- Depreciation tracking for assets

### Tax Estimation
- Swiss tax estimation by canton
- Federal, cantonal, and municipal tax breakdown
- Social security contribution calculations
- Visual tax breakdown charts

### Account Management
- User authentication (Supabase Auth with email/password)
- Company profile with logo upload
- Bank account management for QR Bill
- VAT settings configuration
- Language support (English/German)
- Dark/Light theme support
- Onboarding flow for new users

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[PROJECT_SCHEMA.md](docs/PROJECT_SCHEMA.md)** - Complete project schema, database structure, API reference, and detailed documentation
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture, data flow, and component hierarchy
- **[DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - Database schema with ERD and relationships
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Step-by-step Supabase setup guide
- **[SWISS_QR_BILL_IMPLEMENTATION.md](docs/SWISS_QR_BILL_IMPLEMENTATION.md)** - Swiss QR Bill implementation details

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works) - See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase (see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)):
   - Create a Supabase project
   - Run the database schema (`supabase/schema.sql`)
   - Create `.env` file with your Supabase credentials

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Technology Stack

- **Frontend**: React 18, React Router 7
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS 3
- **PDF Generation**: pdfmake
- **Swiss QR Bill**: swissqrbill
- **Charts**: MUI X Charts
- **Build Tool**: Vite 5
- **State Management**: React Context API
- **Authentication**: Supabase Auth (JWT)
- **Database**: PostgreSQL with Row Level Security (RLS)

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── PageLayout.jsx    # Standard page wrapper
│   ├── DataTable.jsx     # List/table component
│   ├── ChartCard.jsx     # Chart with stats
│   ├── Modal.jsx         # Base modal component
│   ├── BackLink.jsx      # Navigation back link
│   ├── RowActions.jsx    # Table row actions
│   ├── Button.jsx        # Button component
│   ├── Input.jsx         # Input component
│   ├── Select.jsx        # Select dropdown
│   ├── TextArea.jsx      # Textarea component
│   ├── Card.jsx          # Card container
│   └── Icons.jsx         # Icon components
├── pages/                # Route pages
│   ├── Dashboard.jsx     # Invoice dashboard
│   ├── Expenses.jsx      # Expense tracking
│   ├── Contacts.jsx      # Customer management
│   ├── Projects.jsx      # Project management
│   ├── Taxes.jsx         # Tax estimation
│   ├── Account.jsx       # User settings
│   └── InvoiceCreator.jsx # Invoice editor
├── context/              # React contexts
│   ├── AuthContext.jsx   # Authentication
│   ├── LanguageContext.jsx # i18n
│   └── ThemeContext.jsx  # Theme management
├── services/             # Data services
│   ├── storage.js        # localStorage abstraction
│   ├── invoiceService.js # Invoice CRUD
│   ├── contactService.js # Contact CRUD
│   ├── projectService.js # Project CRUD
│   ├── expenseService.js # Expense CRUD
│   ├── bankAccountService.js # Bank account CRUD
│   └── settingsService.js # User settings
├── hooks/                # Custom React hooks
│   ├── useInvoices.js    # Invoice management
│   ├── useContacts.js    # Contact management
│   ├── useProjects.js    # Project management
│   ├── useExpenses.js    # Expense management
│   └── useSettings.js    # Settings management
├── utils/                # Utility functions
│   ├── formatters.js     # Currency/date formatting
│   ├── pdfGenerator.js   # PDF generation
│   ├── generateQRCode.js # Swiss QR Bill
│   └── taxCalculator.js  # Tax calculations
└── translations/         # i18n files
    ├── en.json           # English
    └── de.json           # German
```

## Key Features Detail

### Swiss QR Bill
The application generates Swiss QR Bills according to SIX specifications:
- Automatic QR code generation with payment details
- Placed at bottom of invoice PDF
- Supports both IBAN and QR-IBAN formats

### PDF Generation
Uses pdfmake for client-side PDF generation:
- Professional invoice layout
- Company logo support (PNG/JPEG)
- Integrated Swiss QR Bill
- Download or preview in browser

### Multi-language Support
- English and German translations
- Easy to extend with additional languages
- All UI text is translatable

## Project Structure

See [PROJECT_SCHEMA.md](docs/PROJECT_SCHEMA.md) for detailed structure documentation.

Quick overview:
```
src/
├── components/     # Reusable UI components
├── pages/         # Route pages
├── context/       # React Context providers (Auth, Theme, Language)
├── hooks/         # Custom React hooks for data fetching
├── services/      # Data access layer (Supabase services)
├── utils/         # Utility functions (PDF, QR code, formatters)
└── translations/  # i18n translation files
```

## Database Schema

The application uses PostgreSQL via Supabase with the following main tables:
- `profiles` - User profiles
- `vat_settings` - VAT configuration
- `bank_accounts` - Bank account details
- `contacts` - Customers and suppliers
- `projects` - Project management
- `invoices` - Invoice records
- `expenses` - Expense tracking
- `description_suggestions` - Autocomplete suggestions

See [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) for complete schema documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support & Troubleshooting

- Check the [PROJECT_SCHEMA.md](docs/PROJECT_SCHEMA.md) for detailed documentation
- Review [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup issues
- Check browser console for errors
- Review Supabase dashboard logs

## License

MIT License
