# Configuration Guide

This guide will walk you through setting up Clerk and Supabase for your Next.js application.

## Prerequisites

- A Clerk account ([Sign up here](https://dashboard.clerk.com/sign-up))
- A Supabase account ([Sign up here](https://supabase.com/dashboard))

---

## Step 1: Set Up Clerk

### 1.1 Create a Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **"Create Application"** or select an existing application
3. Choose your authentication methods (Email, Google, GitHub, etc.)
4. Complete the setup wizard

### 1.2 Get Your Clerk API Keys

1. In your Clerk Dashboard, go to **API Keys** (in the left sidebar)
2. You'll find:
   - **Publishable Key** → Copy this to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret Key** → Copy this to `CLERK_SECRET_KEY`

### 1.3 Configure Clerk JWT for Supabase

1. In Clerk Dashboard, go to **JWT Templates** (in the left sidebar)
2. Click **"New template"** or find the **Supabase** template
3. If creating new:
   - Name: `Supabase`
   - Token Lifetime: `3600` (1 hour)
   - Signing Algorithm: `RS256`
   - Claims: Use the Supabase template or add:
     ```json
     {
       "aud": "authenticated",
       "role": "authenticated",
       "sub": "{{user.id}}"
     }
     ```
4. Copy the **Signing Key** → This goes to `CLERK_JWT_KEY`

---

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (2-3 minutes)

### 2.2 Get Your Supabase API Keys

1. In your Supabase project, go to **Settings** → **API**
2. You'll find:
   - **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Copy this to `NEXT_PUBLIC_SUPABASE_KEY`

### 2.3 Enable Clerk as Auth Provider in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Scroll down to **Custom JWT** or **Third-party Auth**
3. Enable **Custom JWT** provider
4. Configure:
   - **JWT Secret**: Paste your `CLERK_JWT_KEY` here
   - **JWT URL**: Your Clerk instance URL (found in Clerk Dashboard → API Keys)
   - **Issuer**: Usually `https://your-clerk-instance.clerk.accounts.dev`

### 2.4 Create the Fakturio Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the `fakturio-schema.sql` file from your project root
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the schema

**Important**: This creates all tables needed for Fakturio:
- `profiles` - User profiles with company information
- `vat_settings` - VAT configuration per user
- `bank_accounts` - Bank accounts for Swiss QR Bill generation
- `contacts` - Customers and suppliers
- `projects` - Project management linked to customers
- `invoices` - Invoice records with line items (JSONB)
- `expenses` - Expense tracking (one-time, recurring, assets)
- `description_suggestions` - Autocomplete suggestions for invoice line items

All tables include:
- Row Level Security (RLS) policies configured to work with Clerk JWT tokens
- Proper indexes for performance
- Foreign key relationships
- Auto-updating `updated_at` timestamps via triggers

**Note**: The schema uses `TEXT` for `user_id` fields to store Clerk user IDs (not UUIDs).

---

## Step 3: Update Environment Variables

1. Open `.env.local` in the root of your project
2. Fill in all the values you collected:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY=your-jwt-signing-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Migration Notes

This configuration is for migrating Fakturio from React + Vite to Next.js:

### Key Changes:
- **Authentication**: Migrating from Supabase Auth to Clerk
- **User IDs**: Clerk user IDs are TEXT format (not UUIDs)
- **Database Schema**: Same structure, but RLS policies use Clerk JWT tokens
- **Services**: Will need to be updated to use Clerk user IDs instead of Supabase Auth user IDs

### When Creating Records:
Always include `user_id` from Clerk when inserting data:

```typescript
import { auth } from "@clerk/nextjs/server";

// Server-side example
const { userId } = await auth();
await client.from("invoices").insert({
  ...invoiceData,
  user_id: userId, // Clerk user ID
});
```

```typescript
import { useUser } from "@clerk/nextjs";

// Client-side example
const { user } = useUser();
await client.from("contacts").insert({
  ...contactData,
  user_id: user.id, // Clerk user ID
});
```

---

## Step 5: Test Your Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Sign in with Clerk

4. Verify authentication is working

5. Check Supabase Dashboard → Table Editor to verify all tables were created:
   - `profiles`
   - `vat_settings`
   - `bank_accounts`
   - `contacts`
   - `projects`
   - `invoices`
   - `expenses`
   - `description_suggestions`

6. Test RLS policies by trying to query data (should only see your own data)

---

## Troubleshooting

### Clerk Issues
- **"Invalid API key"**: Double-check your keys in `.env.local`
- **JWT not working**: Verify the JWT template is correctly configured in Clerk

### Supabase Issues
- **"Row Level Security policy violation"**: Make sure RLS policies are set up correctly
- **"Invalid JWT"**: Verify `CLERK_JWT_KEY` matches the signing key in Supabase
- **"user_id not found"**: Make sure you're passing `user_id` when inserting tasks

### General Issues
- **Environment variables not loading**: Restart your dev server after changing `.env.local`
- **CORS errors**: Check that your Supabase project allows requests from `localhost:3000`

---

## Next Steps

- Customize authentication methods in Clerk Dashboard
- Start migrating Fakturio components from React/Vite to Next.js App Router
- Update service files to use Clerk user IDs
- Migrate pages to Next.js route structure
- Test all CRUD operations with the new authentication
- Deploy to Vercel (environment variables will need to be set in Vercel dashboard)

---

## Resources

- [Clerk + Supabase Integration Guide](https://clerk.com/docs/integrations/databases/supabase)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

