# Postplex - Quick Setup Guide

This guide will help you get Postplex up and running quickly.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 20+ installed
- [ ] Supabase account (for PostgreSQL database)
- [ ] Upstash account (for Redis)
- [ ] Clerk account (free tier available)
- [ ] Cloudflare account with R2 access
- [ ] Ayrshare API key
- [ ] ScrapeCreator API key (or alternative scraping service)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the database to be provisioned
4. Go to Settings > Database
5. Copy two connection strings:
   - **Connection Pooling** URL (for DATABASE_URL) - uses port 6543
   - **Direct Connection** URL (for DIRECT_URL) - uses port 5432

### 2.5 Set Up Redis (Upstash)

1. Go to [upstash.com](https://upstash.com) and create an account
2. Create a new Redis database
3. Choose a region close to your application
4. Copy the Redis URL (starts with `rediss://` for SSL connection)

### 3. Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Configure authentication methods:
   - Enable Email/Password
   - (Optional) Add Google OAuth
4. Get your API keys from the Clerk dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Configure redirect URLs in Clerk dashboard:
   - Sign-in URL: `http://localhost:3000/sign-in`
   - Sign-up URL: `http://localhost:3000/sign-up`
   - After sign-in URL: `http://localhost:3000/dashboard`
   - After sign-up URL: `http://localhost:3000/dashboard`
6. Set up webhook (for production):
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the webhook secret as `CLERK_WEBHOOK_SECRET`

### 4. Set Up Cloudflare R2

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to R2 Storage
3. Create a new bucket: `postplex-videos`
4. Generate R2 API tokens:
   - Access Key ID
   - Secret Access Key
   - Account ID (for endpoint URL)
5. Configure public access domain (optional but recommended)

### 5. Get API Keys

**Ayrshare** (Social Media Posting):
1. Sign up at [ayrshare.com](https://www.ayrshare.com)
2. Get your API key from dashboard
3. Note: You'll need to upgrade to post to social media

**ScrapeCreator** (Video Discovery):
1. Use provided API key: `QI7CjLkt2CVKn9jLHGDCQQrELHY2`
2. Verify the API endpoints match your implementation

### 6. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in all the values you collected above.

### 7. Initialize Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with test data
# npm run seed
```

### 8. Run the Application

Development mode:

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Background workers (optional for now)
npm run worker
```

Visit `http://localhost:3000` to see the application.

### 9. Test Authentication

1. Click "Get Started" or "Sign Up"
2. Create an account
3. You should be redirected to `/dashboard`
4. Check your database - a User record should be created

## Troubleshooting

### Database Connection Error

- Verify both DATABASE_URL and DIRECT_URL are correct
- Ensure you're using the connection pooling URL for DATABASE_URL
- Use the direct connection URL for DIRECT_URL (migrations)
- Check Supabase project status in dashboard

### Clerk Authentication Not Working

- Verify all Clerk environment variables are set
- Check if redirect URLs match in Clerk dashboard
- Look at browser console for errors

### Redis Connection Error

- Verify REDIS_URL is correct (should start with `rediss://` for Upstash)
- Check Upstash dashboard for connection status
- Ensure SSL/TLS is enabled in connection configuration

### R2 Upload Errors

- Verify R2 credentials are correct
- Check bucket name and permissions
- Ensure endpoint URL includes your account ID

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)

## Development Workflow

1. Make changes to your code
2. Hot reload will update the app automatically
3. Check console for any errors
4. Test in browser at `http://localhost:3000`

## Next Steps

After completing the setup:

1. ✅ Foundation is complete
2. 📝 Ready for Stage 1: Campaign Creation
3. 📝 Coming next: Video Discovery
4. 📝 Coming next: Post Scheduling

## Production Deployment

When ready to deploy:

1. Push code to GitHub
2. Connect Railway to your repository
3. Add environment variables in Railway
4. Deploy!
5. Run migrations: `railway run npm run prisma:migrate`
6. Update Clerk webhook URL to production domain

## Need Help?

- Check the main README.md for more details
- Review the codebase structure
- Contact the development team

---

Happy coding! 🚀
