# Postplex

A video content management and auto-posting platform for automating social media content across TikTok, Instagram, and Facebook.

## 🚀 Features

- **Video Discovery**: Import videos from social media profiles
- **Smart Processing**: Automatically modify videos to avoid detection
- **Auto Scheduling**: Schedule posts across multiple platforms
- **Campaign Management**: Organize content in campaigns
- **Multi-Platform Support**: TikTok, Instagram, Facebook
- **Queue Management**: Background job processing with BullMQ
- **Cloud Storage**: Cloudflare R2 for video storage

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Storage**: Cloudflare R2 (S3-compatible)
- **Queue**: BullMQ with Upstash Redis
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Railway / Vercel (recommended)

## 📋 Prerequisites

- Node.js 20 or higher
- Supabase account (for PostgreSQL database)
- Upstash account (for Redis)
- Clerk account (for authentication)
- Cloudflare R2 account (for storage)
- Ayrshare API key (for social media posting)
- ScrapeCreator API key (for video discovery)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Postplex
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Supabase Database
DATABASE_URL="postgresql://..."  # Connection pooling URL
DIRECT_URL="postgresql://..."    # Direct connection for migrations

# Upstash Redis
REDIS_URL="rediss://..."  # Note: rediss:// with SSL

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# Cloudflare R2 Storage
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_BUCKET_NAME="postplex-videos"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"

# API Keys
AYRSHARE_API_KEY="your_ayrshare_key"
SCRAPE_CREATOR_API_KEY="QI7CjLkt2CVKn9jLHGDCQQrELHY2"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="random_secret_for_cron_auth"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run Development Server

```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: Background workers (optional for now)
npm run worker
```

The app will be available at `http://localhost:3000`

## 🎯 Project Structure

```
app/
  (auth)/          # Authentication pages
  (dashboard)/     # Protected dashboard routes
  api/             # API routes
  layout.tsx       # Root layout with Clerk
  page.tsx         # Landing page

components/
  ui/              # shadcn/ui components
  layout/          # Layout components (Sidebar, TopNav)
  campaigns/       # Campaign-specific components
  videos/          # Video-specific components
  schedule/        # Scheduling components

lib/
  db.ts            # Prisma client
  queue.ts         # BullMQ setup
  storage.ts       # R2/S3 client
  ayrshare.ts      # Ayrshare API wrapper
  scrape-creator.ts # ScrapeCreator API wrapper
  stripe.ts        # Stripe client
  utils.ts         # Utility functions
  validations.ts   # Zod schemas

workers/
  video-processor.ts # Background job workers

prisma/
  schema.prisma    # Database schema

types/
  index.ts         # TypeScript types
```

## 🔐 Authentication Setup

### Clerk Configuration

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Email/Password authentication
3. Add social providers (Google, TikTok if available)
4. Configure redirect URLs:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`
5. Set up webhook endpoint: `/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`

## 💾 Database Schema

The application uses the following main models:

- **User**: User accounts linked to Clerk
- **Campaign**: Content import campaigns
- **SourceVideo**: Original videos from social media
- **ProcessedVideo**: Modified versions for posting
- **ConnectedAccount**: Social media account connections
- **ScheduledPost**: Posts scheduled for publishing
- **UserSettings**: User preferences and settings

See `prisma/schema.prisma` for the complete schema.

## 📦 Deployment

### Supabase + Upstash Setup

1. **Create Supabase project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Get your connection strings from Settings > Database
   - Use the "Connection Pooling" URL for `DATABASE_URL`
   - Use the "Direct Connection" URL for `DIRECT_URL`

2. **Create Upstash Redis**:
   - Go to [upstash.com](https://upstash.com) and create a Redis database
   - Copy the Redis URL (starts with `rediss://`)
   
3. **Deploy to Vercel/Railway**:
   ```bash
   # Set environment variables
   # Deploy your app
   vercel
   # or
   railway up
   ```

4. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

### Docker Deployment

```bash
# Build image
docker build -t contentflow .

# Run container
docker run -p 3000:3000 --env-file .env contentflow
```

## 🔄 Background Workers

The application uses BullMQ for background job processing:

- **Video Download Worker**: Downloads videos from social media
- **Video Processing Worker**: Applies modifications to videos
- **Post Schedule Worker**: Posts content to social media

To run workers in production:

```bash
npm run worker
```

Or deploy as a separate service on Railway.

## 📝 Development Stages

This project is built in stages:

- ✅ **Foundation**: Complete project setup (DONE)
- 🔜 **Stage 1**: Campaign creation and video discovery
- 🔜 **Stage 2**: Video processing and uniquification
- 🔜 **Stage 3**: Post scheduling and automation

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## 📚 API Documentation

### Internal API Routes

- `POST /api/campaigns/create` - Create new campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `POST /api/videos/process` - Process video
- `POST /api/videos/schedule` - Schedule post
- `POST /api/cron/process-posts` - Process scheduled posts (cron)
- `POST /api/webhooks/clerk` - Clerk webhook handler
- `POST /api/webhooks/ayrshare` - Ayrshare webhook handler
- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions, contact the development team.

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Upstash Documentation](https://upstash.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Ayrshare API](https://docs.ayrshare.com/)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
