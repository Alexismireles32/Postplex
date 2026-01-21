# Supabase Connection Setup Guide

## Your Supabase Project Details

**Project ID**: `fnepvlrxhhxbxircgkgo`  
**Project URL**: `https://fnepvlrxhhxbxircgkgo.supabase.co`  
**Region**: US West 1 (assumed)

---

## Step 1: Get Database Connection Strings

You need to get the database password from your Supabase dashboard:

### How to Get Connection Strings:

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/fnepvlrxhhxbxircgkgo

2. Click on **Settings** (gear icon in sidebar)

3. Click on **Database** in the Settings menu

4. Scroll down to **Connection string** section

5. You'll see two types of connections:

   **A. Connection Pooling (for DATABASE_URL)**
   - Click on "Connection Pooling"
   - Mode: Transaction
   - Copy the connection string (it will have port 6543)
   - Format: `postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

   **B. Direct Connection (for DIRECT_URL)**
   - Click on "Direct connection"
   - Copy the connection string (it will have port 5432)
   - Format: `postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

6. Replace `[YOUR-PASSWORD]` in both URLs with your actual database password

---

## Step 2: Update Your .env File

Create or update your `.env` file:

```bash
# Copy the template
cp .env.supabase-setup .env

# Edit and add your actual database password
nano .env
```

Update these lines with the connection strings you got from Supabase:

```env
DATABASE_URL="postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.fnepvlrxhhxbxircgkgo:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

---

## Step 3: Run Database Migrations

Once your .env is set up:

```bash
# Generate Prisma client
npm run prisma:generate

# Create the database tables
npm run prisma:migrate

# Verify connection
npx prisma db pull
```

---

## Step 4: Set Up MCP Access to Supabase

For MCP (Model Context Protocol) access, you need a Supabase access token.

### Get Supabase Access Token:

1. Go to https://supabase.com/dashboard/account/tokens

2. Click "Generate new token"

3. Give it a name like "Postplex MCP Access"

4. Copy the token

5. Add to your environment:

```bash
export SUPABASE_ACCESS_TOKEN="your-access-token-here"
```

Or add to your shell profile (~/.zshrc or ~/.bashrc):

```bash
echo 'export SUPABASE_ACCESS_TOKEN="your-token"' >> ~/.zshrc
source ~/.zshrc
```

---

## Supabase API Keys (Already Configured)

Your Supabase API keys are already in the .env template:

```env
# Public (Anon) Key - Safe to use in frontend
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZXB2bHJ4aGh4YnhpcmNna2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMjgyNzUsImV4cCI6MjA4NDYwNDI3NX0.Ofi-8FVsXTZoHHoS2Y7s8GMVoxJ8TOnID1L-FworM50"

# Service Role Key - KEEP SECRET, server-side only
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuZXB2bHJ4aGh4YnhpcmNna2dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTAyODI3NSwiZXhwIjoyMDg0NjA0Mjc1fQ.m8H_YeK_0-dhi7PuFTCZCNAXopy9MvHGOAjILN3gTCY"
```

**Important**: 
- ✅ **ANON KEY**: Safe for frontend, respects RLS policies
- ⚠️ **SERVICE ROLE KEY**: Bypasses RLS, keep secret, use only on server

---

## Testing Your Connection

### Test Database Connection:

```bash
# This should connect successfully
npx prisma db pull
```

### Test in Code:

```typescript
// In any API route or server component
import { prisma } from '@/lib/db';

const users = await prisma.user.findMany();
console.log('Connected! Users:', users);
```

---

## Quick Start Commands

```bash
# 1. Set up environment
cp .env.supabase-setup .env
nano .env  # Add your database password

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run migrations
npm run prisma:migrate

# 4. Start development server
npm run dev

# 5. Test connection
curl http://localhost:3000/api/health
```

---

## Common Issues

### "Database connection failed"
- Verify your database password is correct
- Check that you're using the correct URLs (pooling vs direct)
- Ensure Supabase project is active (not paused)

### "Invalid JWT token"
- Verify the anon key and service role key are correct
- Check they're for the correct project
- Ensure they haven't expired (they expire in 2084)

### "Migration failed"
- Use DIRECT_URL for migrations (port 5432)
- Don't use connection pooling URL for migrations
- Check database is not paused

---

## What's Already Configured

✅ **Supabase Project URL**: https://fnepvlrxhhxbxircgkgo.supabase.co  
✅ **Anon (Public) Key**: Configured in .env template  
✅ **Service Role Key**: Configured in .env template  
✅ **Prisma Schema**: Set up with directUrl support  
✅ **Database Models**: 7 models ready to migrate  

**What You Need**: Database password from Supabase dashboard

---

## Need Help?

1. **Can't find database password?**
   - Go to Supabase Dashboard > Settings > Database
   - Look for "Database Password" section
   - You may need to reset it if you don't have it

2. **Need to reset password?**
   - Supabase Dashboard > Settings > Database
   - Click "Reset database password"
   - Copy the new password immediately

3. **Want to use Supabase client library?**
   - Install: `npm install @supabase/supabase-js`
   - The keys are already in your .env

---

**Next Step**: Get your database password from Supabase dashboard and update your .env file!
