# Migration Notes - ContentFlow to Postplex

## Changes Made (January 21, 2026)

### 1. Application Name Change
**ContentFlow → Postplex**

All references updated in:
- `package.json` - App name
- All UI components (Sidebar, TopNav, Landing page)
- Documentation files (README.md, SETUP.md, etc.)
- Meta tags and titles
- Footer copyrights

### 2. Database Stack Change
**Railway PostgreSQL → Supabase PostgreSQL**

#### Prisma Schema Updates
- Added `directUrl` to datasource configuration
- Now uses two connection strings:
  - `DATABASE_URL` - Connection pooling (port 6543, pgbouncer)
  - `DIRECT_URL` - Direct connection (port 5432, for migrations)

#### Environment Variables Updated
```env
# Before (Railway)
DATABASE_URL="postgresql://..."

# After (Supabase)
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler.supabase.com:5432/postgres"
```

**Why two URLs?**
- Connection pooling URL (DATABASE_URL) for application queries - more efficient
- Direct connection URL (DIRECT_URL) for migrations - required by Prisma

### 3. Redis Stack Change
**Railway Redis → Upstash Redis**

#### Queue Configuration Updates
- Updated `lib/queue.ts` to support SSL/TLS connections
- Added TLS configuration for Upstash's `rediss://` protocol
- Added IPv6 support

#### Environment Variables Updated
```env
# Before (Railway)
REDIS_URL="redis://..."

# After (Upstash)
REDIS_URL="rediss://..."  # Note the extra 's' for SSL
```

**Key Changes:**
- Upstash uses `rediss://` (SSL/TLS encrypted)
- Added TLS config in BullMQ connection
- IPv6 support enabled

### 4. API Configuration
**ScrapeCreator API**
- Updated API key: `QI7CjLkt2CVKn9jLHGDCQQrELHY2`
- Changed authentication header to `X-API-Key` (common pattern)
- Noted that actual API endpoints need verification with documentation

### 5. Storage Bucket Renamed
- R2 bucket name: `contentflow-videos` → `postplex-videos`
- Updated default in `lib/storage.ts`

## Migration Steps (If Migrating Existing Database)

### Step 1: Export Data from Railway
```bash
# From Railway PostgreSQL
railway run pg_dump DATABASE_URL > backup.sql
```

### Step 2: Set Up Supabase
1. Create new Supabase project
2. Get connection strings from Settings > Database
3. Update `.env` with both URLs

### Step 3: Import Data to Supabase
```bash
# To Supabase (using DIRECT_URL)
psql DIRECT_URL < backup.sql
```

### Step 4: Update Redis
1. Export data from Railway Redis (if needed)
2. Create Upstash Redis database
3. Update REDIS_URL in `.env`
4. Restart workers

### Step 5: Update Application
```bash
# Generate new Prisma client
npm run prisma:generate

# Run any new migrations
npm run prisma:migrate

# Restart application
npm run dev
```

## Important Notes

### Supabase Connection Strings
- **Always use connection pooling URL** for DATABASE_URL
- **Always use direct connection URL** for DIRECT_URL
- Don't mix them up - migrations will fail with pooling URL

### Upstash Redis
- Uses SSL/TLS by default (`rediss://`)
- May have different rate limits than Railway
- Check Upstash dashboard for usage limits

### ScrapeCreator API
- Current implementation is a best guess
- **Verify with actual API documentation**
- May need endpoint/authentication adjustments

## Testing Checklist

After migration:

- [ ] Database connection works (check health endpoint)
- [ ] Prisma migrations run successfully
- [ ] Redis connection established
- [ ] BullMQ queues functional
- [ ] Authentication works (Clerk)
- [ ] R2 storage uploads work
- [ ] ScrapeCreator API calls work (once verified)

## Rollback Plan

If issues occur:

1. Revert `.env` to old Railway URLs
2. Run `npx prisma generate`
3. Restart application
4. Investigate issues before re-attempting

## Performance Considerations

### Supabase
- Connection pooling provides better performance
- Free tier limits: Check Supabase dashboard
- Consider upgrading for production workloads

### Upstash
- Serverless Redis - may have cold starts
- Check pricing for expected usage
- Monitor rate limits

## Next Steps

1. ✅ All files updated with new name
2. ✅ Database configuration updated
3. ✅ Redis configuration updated
4. 🔜 Test all connections
5. 🔜 Verify ScrapeCreator API with documentation
6. 🔜 Update deployment configuration
7. 🔜 Update Clerk app name/settings if needed

---

**Migration Completed**: January 21, 2026  
**App Name**: Postplex (formerly ContentFlow)  
**Database**: Supabase (formerly Railway)  
**Redis**: Upstash (formerly Railway)
