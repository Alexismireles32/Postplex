# 🚂 Railway Deployment Guide for Postplex

## ✅ Build Status: READY FOR DEPLOYMENT

Your project successfully builds with **0 errors**! 🎉

---

## 📋 Pre-Deployment Checklist

### ✅ Completed
- [x] Build succeeds (`npm run build`)
- [x] All TypeScript errors fixed
- [x] Railway CLI installed
- [x] Workers configured correctly
- [x] Database schema ready (Prisma)

### ⚠️ Required Before Deployment
- [ ] Get production Clerk keys
- [ ] Configure Cloudflare R2 bucket
- [ ] Verify Supabase connection
- [ ] Verify Upstash Redis connection

---

## 🚀 Quick Deploy (5 Steps)

### Step 1: Login to Railway
```bash
railway login
```
This will open your browser to authenticate.

### Step 2: Initialize Project
```bash
railway init
```
- Choose: **"Create new project"**
- Name it: **"postplex"** (or your preferred name)

### Step 3: Link Project
```bash
railway link
```
Select the project you just created.

### Step 4: Set Environment Variables

**Option A: Via Railway Dashboard (Recommended)**
1. Go to https://railway.app/dashboard
2. Select your project
3. Click on your service
4. Go to "Variables" tab
5. Add all variables from `.env`

**Option B: Via CLI (One by one)**
```bash
# Database
railway variables set DATABASE_URL="your-supabase-connection-pooling-url"
railway variables set DIRECT_URL="your-supabase-direct-url"

# Redis
railway variables set REDIS_URL="your-upstash-redis-url"

# Clerk Auth
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
railway variables set CLERK_SECRET_KEY="sk_live_..."

# Cloudflare R2
railway variables set R2_ACCESS_KEY_ID="your-r2-access-key"
railway variables set R2_SECRET_ACCESS_KEY="your-r2-secret-key"
railway variables set R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
railway variables set R2_BUCKET_NAME="postplex-videos"
railway variables set R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# ScrapeCreator
railway variables set SCRAPE_CREATOR_API_KEY="QI7CjLkt2CVKn9jLHGDCQQrELHY2"
railway variables set SCRAPE_CREATOR_API_URL="https://api.scrapecreators.com/v1"

# Ayrshare (if you have it)
railway variables set AYRSHARE_API_KEY="your-ayrshare-key"

# Stripe (if you have it)
railway variables set STRIPE_SECRET_KEY="sk_live_..."
railway variables set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### Step 5: Deploy!
```bash
railway up
```

Your web app will deploy automatically!

---

## 🔧 Setting Up Workers (Important!)

Railway needs **3 separate services**:
1. **Web App** (Next.js)
2. **Video Downloader Worker**
3. **Video Uniquifier Worker**

### Create Additional Services

1. **In Railway Dashboard:**
   - Go to your project
   - Click "+ New" → "Empty Service"
   - Name it: "video-downloader"

2. **Configure video-downloader:**
   - Go to service settings
   - Under "Deploy", set:
     - **Build Command:** `npm install`
     - **Start Command:** `npm run worker:downloader`
   - Under "Variables", add the SAME environment variables as web app
   - Click "Deploy"

3. **Repeat for video-uniquifier:**
   - Create another service: "video-uniquifier"
   - **Start Command:** `npm run worker:uniquifier`
   - Add same environment variables
   - Deploy

---

## 📊 Service Configuration Summary

| Service | Start Command | Purpose |
|---------|--------------|---------|
| **web** | `npm run start` | Next.js web app |
| **video-downloader** | `npm run worker:downloader` | Downloads videos from social media |
| **video-uniquifier** | `npm run worker:uniquifier` | Processes videos with FFmpeg |

---

## 🔐 Environment Variables Reference

### Required Variables

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.compute.amazonaws.com:5432/postgres"

# Redis (Upstash)
REDIS_URL="rediss://default:[PASSWORD]@uncommon-bluegill-48529.upstash.io:6379"

# Clerk (Get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Cloudflare R2 (Get from Cloudflare dashboard)
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_ENDPOINT="https://[account-id].r2.cloudflarestorage.com"
R2_BUCKET_NAME="postplex-videos"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# ScrapeCreator
SCRAPE_CREATOR_API_KEY="QI7CjLkt2CVKn9jLHGDCQQrELHY2"
SCRAPE_CREATOR_API_URL="https://api.scrapecreators.com/v1"
```

### Optional Variables

```bash
# Ayrshare (for social media posting)
AYRSHARE_API_KEY="..."

# Stripe (for payments - Stage 3+)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 🗄️ Database Migration

After deployment, run migrations:

```bash
# Option 1: Via Railway CLI
railway run npx prisma db push

# Option 2: Via Railway dashboard
# Go to your web service → "Deploy" → "Run Command"
# Enter: npx prisma db push
```

---

## 🧪 Testing Your Deployment

### 1. Check Web App
```bash
railway open
```
This opens your deployed app in the browser.

### 2. Check Worker Logs
In Railway dashboard:
- Click on "video-downloader" service
- Go to "Deployments" → "Logs"
- Should see: `🚀 Video downloader worker started!`

Repeat for "video-uniquifier" service.

### 3. Test Complete Flow
1. Navigate to `/campaigns/new`
2. Paste a TikTok URL
3. Select videos
4. Import videos (check downloader logs)
5. Go to `/library`
6. Select videos and click "Make Unique"
7. Choose preset and start processing (check uniquifier logs)

---

## 🔍 Troubleshooting

### Issue: "REDIS_URL environment variable is not set"
**Solution:** Make sure ALL services have the same environment variables.

### Issue: "Cannot connect to database"
**Solution:** 
- Check `DATABASE_URL` is correct
- Ensure Supabase allows connections from Railway IPs
- Try using `DIRECT_URL` temporarily

### Issue: "FFmpeg not found"
**Solution:** Railway has FFmpeg pre-installed. If not working:
1. Add a `nixpacks.toml` file:
```toml
[phases.setup]
aptPkgs = ["ffmpeg"]
```

### Issue: Workers not processing jobs
**Solution:**
- Check worker logs in Railway dashboard
- Verify `REDIS_URL` is correct in worker services
- Ensure workers are running (check service status)

### Issue: "Module not found" errors
**Solution:**
- Ensure `package.json` has all dependencies
- Check build logs for npm install errors
- Try redeploying

---

## 📈 Monitoring

### View Logs
```bash
# Web app logs
railway logs

# Specific service logs
railway logs --service video-downloader
railway logs --service video-uniquifier
```

### Check Service Status
```bash
railway status
```

### View Metrics
Go to Railway dashboard → Your project → "Metrics" tab

---

## 💰 Cost Estimation

Railway charges based on usage:

| Resource | Usage | Est. Cost |
|----------|-------|-----------|
| **Web App** | ~$5-10/month | Always on |
| **Workers** | ~$5-10/month | 2 workers |
| **Total** | ~$10-20/month | Plus usage |

**Free tier:** $5 credit/month

**Tips to reduce costs:**
- Use smaller instance sizes
- Reduce worker concurrency
- Use external services (Supabase, Upstash) on their free tiers

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:

### Setup GitHub Integration
1. Push your code to GitHub
2. In Railway dashboard → Settings → "Connect GitHub"
3. Select your repository
4. Choose branch (usually `main`)

Now every push to `main` automatically deploys! 🎉

---

## 🎯 Next Steps After Deployment

1. **Test all features** thoroughly
2. **Set up custom domain** (in Railway dashboard)
3. **Configure production Clerk** (update redirect URLs)
4. **Set up monitoring** (Railway provides basic metrics)
5. **Configure R2 CORS** (if using direct uploads)
6. **Test worker processing** with real videos
7. **Set up error tracking** (Sentry recommended)

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Postplex Issues:** Check `STAGE2_AUDIT_COMPLETE.md` for known issues

---

## ✅ Deployment Checklist

- [ ] Railway CLI installed
- [ ] Logged into Railway
- [ ] Project created and linked
- [ ] Environment variables set (web service)
- [ ] Web service deployed
- [ ] Video downloader service created
- [ ] Video downloader variables set
- [ ] Video downloader deployed
- [ ] Video uniquifier service created
- [ ] Video uniquifier variables set
- [ ] Video uniquifier deployed
- [ ] Database migrated
- [ ] Web app accessible
- [ ] Workers running (check logs)
- [ ] Test import flow
- [ ] Test uniquify flow
- [ ] Custom domain configured (optional)

---

**🎉 You're ready to deploy! Run `railway login` to get started!**
