# 🚀 Supabase Quick Start - Postplex

## ✅ What's Already Configured

Your Supabase project is partially configured:

- ✅ **Project ID**: `fnepvlrxhhxbxircgkgo`
- ✅ **Project URL**: `https://fnepvlrxhhxbxircgkgo.supabase.co`
- ✅ **Anon Key**: Configured
- ✅ **Service Role Key**: Configured
- ✅ **Prisma Schema**: Ready with dual URL support

## ⚠️ What You Need to Do

### 1. Get Database Password (2 minutes)

**Option A: From Supabase Dashboard**

```bash
1. Visit: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/settings/database
2. Scroll to "Connection string" section
3. Click "Connection Pooling" tab
4. Copy the full URL (it contains your password)
5. Also copy the "Direct connection" URL
```

**Option B: Reset Password**

If you don't know your password:
```bash
1. Visit: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/settings/database
2. Find "Database Password" section
3. Click "Reset database password"
4. Copy the new password immediately!
```

### 2. Update .env File (1 minute)

```bash
# Copy the template
cp .env.supabase-setup .env

# Edit the file
nano .env

# Replace [GET-FROM-SUPABASE-DASHBOARD] with your actual password in these two lines:
DATABASE_URL="postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

### 3. Initialize Database (2 minutes)

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to Supabase (creates all tables)
npx prisma db push

# Or run migrations
npm run prisma:migrate

# Verify it worked
npx prisma studio
```

## 📊 Your Database Schema

Once migrations run, you'll have these tables:

1. **User** - User accounts (linked to Clerk)
2. **Campaign** - Content campaigns
3. **SourceVideo** - Original videos from social media
4. **ProcessedVideo** - Modified videos ready for posting
5. **ConnectedAccount** - Social media account connections
6. **ScheduledPost** - Posts scheduled for publishing
7. **UserSettings** - User preferences

## 🔌 MCP Access Setup (Optional but Recommended)

MCP (Model Context Protocol) allows AI assistants to interact with your Supabase database.

### Get Supabase Access Token:

```bash
# 1. Go to: https://supabase.com/dashboard/account/tokens

# 2. Click "Generate new token"

# 3. Name it: "Postplex MCP Access"

# 4. Copy the token

# 5. Add to your shell profile:
echo 'export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"' >> ~/.zshrc
source ~/.zshrc

# Or set it temporarily:
export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
```

### Test MCP Connection:

Once the token is set, AI assistants can:
- Query your database
- Check table structure
- Help with debugging
- Generate TypeScript types
- Run migrations

## ✅ Verification Steps

### Test 1: Database Connection

```bash
npx prisma db pull
# Should succeed without errors
```

### Test 2: Generate Client

```bash
npm run prisma:generate
# Should generate Prisma client successfully
```

### Test 3: View Database

```bash
npx prisma studio
# Opens a web UI to view your database
# Visit: http://localhost:5555
```

### Test 4: Run App

```bash
npm run dev
# Visit: http://localhost:3000/api/health
# Should return: {"status":"healthy"}
```

## 🎯 Quick Commands Reference

```bash
# Setup
cp .env.supabase-setup .env        # Copy env template
npm run prisma:generate            # Generate Prisma client
npx prisma db push                 # Create tables in Supabase
npm run dev                        # Start development

# Database Management
npx prisma studio                  # Visual database editor
npx prisma db pull                 # Sync schema from Supabase
npx prisma migrate dev             # Create new migration
npx prisma migrate deploy          # Run migrations (production)

# Debugging
npx prisma validate                # Check schema syntax
npx prisma format                  # Format schema file
```

## 📝 Your Supabase URLs

**Dashboard**: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo

**Settings**:
- Database: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/settings/database
- API: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/settings/api
- Auth: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/auth/users

**Database Editor**: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/editor

**SQL Editor**: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo/sql

## 🔐 Security Best Practices

### API Keys Usage:

```typescript
// ✅ GOOD: Use anon key in frontend (respects RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ⚠️ CAREFUL: Use service role only on server (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Connection String Security:

- ✅ **DO**: Keep database passwords in `.env` (gitignored)
- ✅ **DO**: Use different passwords for dev and production
- ❌ **DON'T**: Commit passwords to git
- ❌ **DON'T**: Share service role key publicly

## 🆘 Troubleshooting

### Error: "Authentication failed"
```bash
# Check your password is correct
# Try resetting it in Supabase dashboard
```

### Error: "Could not connect to database"
```bash
# Ensure DATABASE_URL has port 6543 (connection pooling)
# Ensure DIRECT_URL has port 5432 (direct connection)
# Check Supabase project is not paused
```

### Error: "Migration failed"
```bash
# Make sure you're using DIRECT_URL for migrations
# Don't use connection pooling URL (port 6543) for migrations
```

### Error: "Relation does not exist"
```bash
# You haven't run migrations yet
npx prisma db push
# or
npm run prisma:migrate
```

## 🎉 Success Checklist

- [ ] Got database password from Supabase
- [ ] Updated .env with DATABASE_URL and DIRECT_URL
- [ ] Ran `npm run prisma:generate`
- [ ] Ran `npx prisma db push` or migrations
- [ ] Verified with `npx prisma studio`
- [ ] App starts with `npm run dev`
- [ ] Health check returns healthy status
- [ ] (Optional) Set up SUPABASE_ACCESS_TOKEN for MCP

---

**Status**: Ready to connect! Just need your database password.

**Next**: Get your password from Supabase dashboard and update `.env`

**Questions?** See `SUPABASE_SETUP_GUIDE.md` for detailed instructions.
