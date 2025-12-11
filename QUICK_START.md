# Fakturio - Quick Start Guide (Next.js Migration)

## 🚀 Setup Checklist

### 1. Clerk Setup (5 minutes)
- [ ] Sign up at [clerk.com](https://clerk.com)
- [ ] Create a new application
- [ ] Copy **Publishable Key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Copy **Secret Key** → `CLERK_SECRET_KEY`
- [ ] Create JWT Template named "Supabase" → Copy **Signing Key** → `CLERK_JWT_KEY`

### 2. Supabase Setup (15 minutes)
- [ ] Sign up at [supabase.com](https://supabase.com)
- [ ] Create a new project
- [ ] Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_KEY`
- [ ] Enable Custom JWT in Authentication → Providers
- [ ] Run `fakturio-schema.sql` in SQL Editor (full Fakturio database schema)

### 3. Environment Variables
- [ ] Open `.env.local`
- [ ] Fill in all 5 environment variables
- [ ] Save the file

### 4. Run the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📝 Environment Variables Template

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_KEY=your-jwt-signing-key
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔗 Important Links

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Full Configuration Guide**: See `CONFIGURATION.md`
- **Fakturio Project Schema**: See `PROJECT_SCHEMA.md`

---

## ⚠️ Common Issues

1. **"Invalid API key"** → Check `.env.local` values
2. **"RLS policy violation"** → Run `fakturio-schema.sql` in Supabase
3. **"JWT not working"** → Verify JWT template in Clerk matches Supabase config
4. **Environment variables not loading** → Restart dev server

---

## 📚 Next Steps After Setup

1. Test authentication flow with Clerk
2. Verify database connection by checking tables in Supabase
3. Start migrating Fakturio components from React/Vite to Next.js
4. Update services to use Clerk user IDs instead of Supabase Auth
5. Test RLS policies with your data

---

## 🔄 Migration Notes

This is a migration from React + Vite to Next.js:
- **Old**: Supabase Auth (email/password)
- **New**: Clerk Authentication + Supabase Database
- **Database**: Same schema, but user_id will be Clerk user IDs
- **RLS Policies**: Updated to use `auth.jwt() ->> 'sub'` (Clerk user ID)
