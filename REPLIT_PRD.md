# Postplex - Product Requirements Document (PRD)
## For Replit Development - Natural Language Specification

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [User Stories](#user-stories)
4. [Technical Architecture](#technical-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [UI/UX Requirements](#uiux-requirements)
8. [External Service Integration](#external-service-integration)
9. [User Flows](#user-flows)
10. [Security & Performance](#security--performance)
11. [Implementation Phases](#implementation-phases)

---

## 📖 Document Purpose

This PRD is written entirely in natural language to provide clear, detailed requirements for building Postplex. Every technical requirement is explained descriptively without code examples, allowing the development platform to implement the solution in its own way while following these specifications.

---

## 🎯 Project Overview

**Project Name:** Postplex

**Description:** A video content management and auto-posting platform that allows users to discover videos from social media creators (TikTok, Instagram, Facebook), automatically modify them to avoid platform detection, and schedule automated posting across multiple social media accounts.

**Target Users:** Social media marketers, content creators, agencies, and businesses that want to automate their social media video posting workflow.

**Primary Use Case:** 
1. User imports videos from a TikTok/Instagram creator profile
2. System downloads and automatically modifies each video (speed, brightness, crop, audio, etc.)
3. User schedules modified videos to be posted to their own social media accounts
4. System automatically posts videos at scheduled times

---

## 🚀 Core Features

### 1. Authentication & User Management
- User registration and login
- Email/password authentication
- Profile management
- User settings (timezone, notifications, retry preferences)

### 2. Campaign Management
- Create campaigns to organize video imports
- Each campaign linked to a source profile URL (TikTok/Instagram/Facebook)
- Campaign dashboard showing:
  - Total videos discovered
  - Videos selected for processing
  - Videos successfully processed
  - Campaign status (discovering, discovered, processing, ready, failed)
  - Storage used per campaign

### 3. Video Discovery & Import
- Enter a social media profile URL
- System discovers all available videos from that profile using **ScrapeCreator API**
- Display video grid with:
  - Thumbnail preview
  - Duration
  - View count
  - Upload date
  - Original caption
- Bulk select/deselect videos for import
- Import selected videos

### 4. Video Download & Storage
- Download selected videos in the background
- Store original videos in **Cloudflare R2** bucket
- Track download status per video
- Generate accessible URLs for video playback

### 5. Video Uniquification (Processing)
- Automatically process each video with randomized modifications:
  - **Speed:** 0.95x - 1.05x
  - **Visual:** Brightness (-5 to +5), Contrast (-5 to +5), Saturation (-5 to +5)
  - **Crop:** 1-3% random crop from edges
  - **Flip:** Random horizontal/vertical flip
  - **Audio:** Pitch shift (-1 to +1 semitones), Volume adjustment
  - **Metadata:** Remove all original metadata, randomize timestamps
- Generate 3-5 variations per original video
- Quality verification after processing
- Manual "Quick Fix" option to regenerate if quality is poor
- Store processed videos in **Cloudflare R2**

### 6. Video Library
- Browse all imported and processed videos
- Filter by campaign, status, date
- Preview videos in modal
- Quick actions: delete, reprocess, schedule

### 7. Social Account Connection
- Connect TikTok, Instagram, Facebook accounts via **Ayrshare**
- Store account connections per user
- Display connected accounts with follower counts
- Allow disconnect/reconnect

### 8. Post Scheduling
- Schedule individual or bulk posts
- Assign processed video to connected account
- Set custom caption or use original
- Select date and time for posting
- View scheduled post queue
- Edit/delete scheduled posts before posting
- Pause/resume scheduled posts

### 9. Automated Posting
- Background cron job checks for posts due to be published
- Uses **Ayrshare API** to post videos to social platforms
- Tracks post status (scheduled, processing, posted, failed)
- Records performance metrics (views, likes, comments, shares)
- Auto-retry failed posts up to 3 times
- Webhook handler for Ayrshare post status updates

### 10. Dashboard & Analytics
- Overview dashboard showing:
  - Active campaigns
  - Total videos processed
  - Posts scheduled for today/week
  - Recent activity feed
- Campaign-specific analytics
- Post performance tracking

---

## 👤 User Stories

### As a User:
1. I want to **sign up and log in** so I can access the platform securely
2. I want to **create a campaign** by entering a TikTok/Instagram profile URL
3. I want to **see all videos from that profile** in a grid with thumbnails
4. I want to **select specific videos to import** rather than all videos
5. I want videos to be **automatically downloaded and modified** in the background
6. I want to **see processing progress** with status updates
7. I want to **preview processed videos** before scheduling
8. I want to **connect my social media accounts** (TikTok, Instagram, Facebook)
9. I want to **schedule posts** by selecting a video, account, caption, and time
10. I want to **view my post queue** and see what's scheduled
11. I want posts to be **automatically published** at the scheduled time
12. I want to **see post performance** (views, likes, comments)
13. I want to **edit or delete scheduled posts** before they go live
14. I want to **receive notifications** when posts succeed or fail
15. I want to **retry failed posts** automatically or manually

---

## 🏗️ Technical Architecture

### Technology Stack

**Framework:** Next.js 15 (App Router)
- TypeScript for type safety
- Server Components for optimal performance
- API Routes for backend logic

**Database:** Replit PostgreSQL
- Native Replit database integration
- No external database service needed
- Prisma ORM for database access

**Authentication:** Replit Auth
- Built-in authentication system
- No external auth service needed
- User management handled by Replit

**Storage:** Cloudflare R2 (EXTERNAL)
- S3-compatible object storage
- Stores original and processed videos
- Public URLs for Ayrshare access

**Background Jobs:** Simple Node.js Cron
- Scheduled tasks using `node-cron` or Next.js API routes
- Check for due posts every minute
- Process video downloads and modifications

**File Processing:** FFmpeg
- Video manipulation (crop, speed, filters)
- Audio processing
- Format conversion
- Quality checks

**Styling:** Tailwind CSS + shadcn/ui
- Modern, responsive UI components
- Consistent design system
- Dark mode support

**External APIs:**
1. **ScrapeCreator API** - Video discovery
2. **Ayrshare API** - Social media posting
3. **Cloudflare R2 SDK** - Video storage

---

## 🗄️ Database Schema

### Tables & Relationships

#### 1. User Table

This table stores all user account information. Each user record should contain:

- **id**: A unique identifier string that serves as the primary key
- **email**: The user's email address, must be unique across all users
- **name**: The user's display name, this field is optional and can be null
- **passwordHash**: The securely hashed password (never store plain passwords)
- **createdAt**: Timestamp of when the user account was created
- **updatedAt**: Timestamp of when the user record was last modified

**Relationships this table has with other tables:**
- One user can have multiple campaigns (one-to-many relationship)
- One user can have multiple connected social media accounts (one-to-many relationship)
- One user can have multiple scheduled posts (one-to-many relationship)
- One user has exactly one settings record (one-to-one relationship)

### 2. Campaign Table

This table represents a video import campaign, which is a collection of videos imported from a specific social media profile. Each campaign record should contain:

- **id**: A unique identifier string that serves as the primary key
- **userId**: A foreign key reference to the User table, indicating who owns this campaign
- **name**: A descriptive name for the campaign (e.g., "Summer Workout Videos")
- **sourceProfileUrl**: The full URL of the social media profile being imported from
- **sourcePlatform**: The platform type, must be one of three values: "tiktok", "instagram", or "facebook"
- **status**: Current state of the campaign, must be one of: "discovering" (finding videos), "discovered" (videos found), "processing" (videos being modified), "ready" (videos ready to schedule), or "failed" (error occurred)
- **videosDiscovered**: Number of videos found from the source profile, defaults to zero
- **videosSelected**: Number of videos the user chose to import, defaults to zero
- **videosProcessed**: Number of videos that have been successfully modified, defaults to zero
- **storageUsed**: Human-readable string showing storage consumed (e.g., "2.3 GB"), defaults to "0 MB"
- **createdAt**: Timestamp of when the campaign was created
- **updatedAt**: Timestamp of when the campaign was last modified

**Relationships this table has with other tables:**
- Each campaign belongs to one user (many-to-one relationship)
- One campaign can have multiple source videos (one-to-many relationship)
- One campaign can have multiple processed videos (one-to-many relationship)
- One campaign can have multiple scheduled posts (one-to-many relationship)

### 3. SourceVideo Table

This table stores information about original videos discovered from social media profiles. Each source video record should contain:

- **id**: A unique identifier string that serves as the primary key
- **campaignId**: A foreign key reference to the Campaign table, indicating which campaign this video belongs to
- **originalUrl**: The original URL where the video was found on the social media platform
- **downloadedUrl**: The URL where the downloaded video is stored in Cloudflare R2, this is null until the video is downloaded
- **caption**: The original caption or description text from the social media post, stored as long text
- **thumbnailUrl**: A URL to the video thumbnail image for preview purposes
- **duration**: The length of the video in seconds, stored as an integer
- **viewCount**: How many views the original video had, this is optional and can be null
- **uploadedAt**: When the video was originally posted to the social media platform
- **selected**: Boolean flag indicating if the user wants to import this video, defaults to true
- **downloaded**: Boolean flag indicating if the video has been downloaded to R2, defaults to false
- **status**: Current download state, must be one of: "pending" (not started), "downloading" (in progress), "downloaded" (complete), or "failed" (error occurred)
- **errorMessage**: If the download failed, this stores the error details, stored as long text, can be null
- **createdAt**: Timestamp of when this record was created
- **updatedAt**: Timestamp of when this record was last modified

**Relationships this table has with other tables:**
- Each source video belongs to one campaign (many-to-one relationship)
- One source video can have multiple processed versions (one-to-many relationship)
- One source video can be used in multiple scheduled posts (one-to-many relationship)

### 4. ProcessedVideo Table

This table stores information about modified versions of source videos that have been "uniquified" to avoid platform detection. Each processed video record should contain:

- **id**: A unique identifier string that serves as the primary key
- **sourceVideoId**: A foreign key reference to the SourceVideo table, indicating which original video this came from
- **campaignId**: A foreign key reference to the Campaign table, indicating which campaign this belongs to
- **processedUrl**: The URL where the modified video is stored in Cloudflare R2, this is null until processing completes
- **versionNumber**: An integer indicating which version this is (1, 2, 3, etc.) since multiple versions are created per source video
- **modificationSettings**: A JSON object storing all the modification parameters that were applied (detailed below)
- **qualityVerified**: Boolean flag indicating if the video quality has been checked, defaults to false
- **qualityFlags**: A JSON array storing any quality issues detected (e.g., artifacts, distortion), can be null
- **status**: Current processing state, must be one of: "pending" (not started), "processing" (in progress), "completed" (done), "failed" (error occurred), or "reprocessing" (being regenerated)
- **errorMessage**: If processing failed, this stores the error details, can be null
- **createdAt**: Timestamp of when this record was created
- **updatedAt**: Timestamp of when this record was last modified

**The modificationSettings JSON object should contain these fields:**
- **speed**: A decimal number representing speed multiplier (e.g., 1.02 means 2% faster)
- **brightness**: An integer from negative ten to positive ten indicating brightness adjustment
- **contrast**: An integer from negative ten to positive ten indicating contrast adjustment
- **saturation**: An integer from negative ten to positive ten indicating saturation adjustment
- **cropPercentage**: An integer from 1 to 5 indicating percentage to crop from edges
- **flipHorizontal**: Boolean indicating if the video was flipped horizontally
- **flipVertical**: Boolean indicating if the video was flipped vertically
- **audioPitchShift**: A decimal number from negative two to positive two indicating semitone shift
- **volumeAdjustment**: An integer from negative ten to positive ten indicating decibel adjustment
- **removeMetadata**: Boolean, should always be true to strip original metadata
- **rotation**: An integer (0, 90, 180, 270) indicating degrees of rotation applied

**Relationships this table has with other tables:**
- Each processed video comes from one source video (many-to-one relationship)
- Each processed video belongs to one campaign (many-to-one relationship)
- One processed video can be used in multiple scheduled posts (one-to-many relationship)

### 5. ConnectedAccount Table

This table stores information about social media accounts that users have connected for posting. Each connected account record should contain:

- **id**: A unique identifier string that serves as the primary key
- **userId**: A foreign key reference to the User table, indicating who owns this connection
- **platform**: The social media platform type, must be one of: "tiktok", "instagram", or "facebook"
- **platformAccountId**: The unique identifier for this account on the social media platform
- **platformAccountName**: The display name or username of the account (e.g., "@myaccount")
- **followerCount**: The number of followers this account has, this is optional and can be null
- **ayrshareProfileKey**: The unique profile identifier from Ayrshare that represents this connected account
- **accessToken**: OAuth access token for the platform, stored as long text, can be null
- **refreshToken**: OAuth refresh token for the platform, stored as long text, can be null
- **tokenExpiresAt**: Timestamp when the access token expires, can be null
- **isActive**: Boolean flag indicating if this connection is currently active and usable, defaults to true
- **lastAuthAt**: Timestamp of when the account was last authenticated or re-authenticated
- **createdAt**: Timestamp of when this connection was established
- **updatedAt**: Timestamp of when this record was last modified

**Special Constraint:**
The combination of userId, platform, and platformAccountId must be unique. This prevents the same social media account from being connected twice by the same user.

**Relationships this table has with other tables:**
- Each connected account belongs to one user (many-to-one relationship)
- One connected account can be used for multiple scheduled posts (one-to-many relationship)

### 6. ScheduledPost Table

This table stores posts that are scheduled to be published to social media platforms. Each scheduled post record should contain:

- **id**: A unique identifier string that serves as the primary key
- **userId**: A foreign key reference to the User table, indicating who scheduled this post
- **processedVideoId**: A foreign key reference to the ProcessedVideo table, indicating which modified video to post, can be null
- **sourceVideoId**: A foreign key reference to the SourceVideo table, alternative to processedVideoId for posting original videos, can be null
- **connectedAccountId**: A foreign key reference to the ConnectedAccount table, indicating which social media account to post to
- **campaignId**: A foreign key reference to the Campaign table, indicating which campaign this post belongs to
- **caption**: The text caption to include with the video post, stored as long text
- **scheduledAt**: The exact date and time when this post should be published
- **status**: Current state of the post, must be one of: "scheduled" (waiting), "processing" (being posted), "posted" (successfully published), "failed" (error occurred), or "paused" (temporarily disabled)
- **ayrsharePostId**: The unique identifier returned by Ayrshare after posting, can be null until posted
- **platformPostUrl**: The direct URL to the post on the social media platform, can be null until posted
- **postedAt**: The actual timestamp when the post was successfully published, can be null
- **viewCount**: Number of views the post has received, can be null
- **likeCount**: Number of likes the post has received, can be null
- **commentCount**: Number of comments the post has received, can be null
- **shareCount**: Number of shares the post has received, can be null
- **errorMessage**: If posting failed, this stores the error details, stored as long text, can be null
- **retryCount**: How many times the system has attempted to post this, defaults to zero
- **createdAt**: Timestamp of when this post was scheduled
- **updatedAt**: Timestamp of when this record was last modified

**Relationships this table has with other tables:**
- Each scheduled post belongs to one user (many-to-one relationship)
- Each scheduled post may reference one processed video (many-to-one relationship, optional)
- Each scheduled post may reference one source video (many-to-one relationship, optional)
- Each scheduled post uses one connected account (many-to-one relationship)
- Each scheduled post belongs to one campaign (many-to-one relationship)

### 7. UserSettings Table

This table stores user preferences and configuration options. Each user settings record should contain:

- **id**: A unique identifier string that serves as the primary key
- **userId**: A foreign key reference to the User table, must be unique (each user has exactly one settings record)
- **notificationEmail**: Boolean flag indicating if the user wants email notifications, defaults to true
- **notificationPush**: Boolean flag indicating if the user wants push notifications, defaults to true
- **autoRetryFailed**: Boolean flag indicating if failed posts should be automatically retried, defaults to true
- **maxRetries**: Maximum number of retry attempts for failed posts, defaults to 3
- **timezone**: The user's timezone for scheduling posts (e.g., "America/Phoenix", "Europe/London"), defaults to "America/Phoenix"
- **createdAt**: Timestamp of when this settings record was created
- **updatedAt**: Timestamp of when these settings were last modified

**Relationships this table has with other tables:**
- Each settings record belongs to exactly one user (one-to-one relationship)

### Database Indexes
- User: `email` (unique)
- Campaign: `userId`, `status`
- SourceVideo: `campaignId`, `status`
- ProcessedVideo: `sourceVideoId`, `campaignId`, `status`
- ConnectedAccount: `userId`, `platform`, composite unique `[userId, platform, platformAccountId]`
- ScheduledPost: `userId`, `connectedAccountId`, `campaignId`, `scheduledAt`, `status`
- UserSettings: `userId` (unique)

---

## 🔌 API Endpoints

### Authentication Endpoints

**Register New User (POST request to /api/auth/register)**
- Purpose: Create a new user account
- Accepts: User's name, email, and password
- Returns: Success status and the newly created user information
- Should validate email format and password strength
- Should hash the password before storing

**Login User (POST request to /api/auth/login)**
- Purpose: Authenticate an existing user
- Accepts: Email and password
- Returns: Success status and authentication session/token
- Should verify password against stored hash
- Should create a secure session

**Logout User (POST request to /api/auth/logout)**
- Purpose: End the user's session
- Accepts: Current session identifier
- Returns: Success status
- Should invalidate the user's session

**Get Current User (GET request to /api/auth/me)**
- Purpose: Retrieve information about the currently authenticated user
- Accepts: Authentication session/token
- Returns: User information (id, email, name) and related settings
- Should return error if not authenticated

### Campaign Endpoints

**List All Campaigns (GET request to /api/campaigns)**
- Purpose: Retrieve all campaigns belonging to the authenticated user
- Accepts: Authentication session/token
- Returns: Array of campaign objects with basic information (id, name, status, video counts, storage used)
- Should only return campaigns owned by the current user
- Should be sorted by most recently updated first

**Create New Campaign (POST request to /api/campaigns/create)**
- Purpose: Create a new video import campaign
- Accepts: Campaign name, source profile URL, and source platform (tiktok, instagram, or facebook)
- Example input: Campaign name "Summer Workout Videos", profile URL "https://www.tiktok.com/@username", platform "tiktok"
- Returns: Success status and the newly created campaign object
- Should validate the URL format matches the selected platform
- Should set initial status to "discovering"

**Get Campaign Details (GET request to /api/campaigns/[id])**
- Purpose: Retrieve detailed information about a specific campaign
- Accepts: Campaign ID in the URL and authentication session/token
- Returns: Complete campaign information including all source videos and processed videos
- Should verify the user owns this campaign
- Should include related video data

**Update Campaign (PUT request to /api/campaigns/[id])**
- Purpose: Modify campaign properties
- Accepts: Campaign ID in the URL and fields to update (name, status, etc.)
- Returns: Success status and updated campaign object
- Should verify the user owns this campaign

**Delete Campaign (DELETE request to /api/campaigns/[id])**
- Purpose: Remove a campaign and all associated data
- Accepts: Campaign ID in the URL
- Returns: Success status
- Should verify the user owns this campaign
- Should cascade delete all related videos and scheduled posts

**Trigger Video Discovery (POST request to /api/campaigns/[id]/import)**
- Purpose: Start the video discovery process using ScrapeCreator API
- Accepts: Campaign ID in the URL
- This endpoint should call the ScrapeCreator API with the campaign's source profile URL
- Returns: Success status, number of videos found, and campaign ID
- Example response: Success true, 45 videos found, campaign ID
- Should create SourceVideo records for each discovered video
- Should update campaign status to "discovered" when complete

### Video Processing Endpoints

**Get Videos by IDs (GET request to /api/videos/batch)**
- Purpose: Retrieve multiple videos at once by their IDs
- Accepts: Array of video IDs as query parameter
- Returns: Array of video objects with all their data
- Should verify the user has access to these videos

**Start Processing Videos (POST request to /api/videos/process)**
- Purpose: Begin the video processing workflow
- Accepts: Array of source video IDs to process
- Returns: Success status and processing job identifiers
- Should trigger background processing tasks

**Process Videos with Uniquification (POST request to /api/videos/uniquify)**
- Purpose: Apply randomized modifications to videos to make them unique
- Accepts: Array of source video IDs, campaign ID, preset name, and number of versions per video
- Preset options are: "subtle" (minimal changes), "balanced" (moderate changes), or "aggressive" (maximum changes)
- Number of versions per video typically ranges from 3 to 5
- Example input: Two video IDs, campaign "campaign123", preset "balanced", 3 versions per video
- Returns: Success status and array of created processed video IDs
- Should create multiple ProcessedVideo records for each source video
- Should apply randomized modifications within the preset's parameters
- Should trigger background processing tasks

**Check Processing Status (GET request to /api/videos/uniquify/[id]/status)**
- Purpose: Check the current status of video processing
- Accepts: Processed video ID in the URL
- Returns: Current status (pending, processing, completed, failed), progress percentage, and any error messages
- Should provide real-time updates on processing progress

**Regenerate Processed Video (POST request to /api/videos/uniquify/[id]/reprocess)**
- Purpose: Create a new version if the current one has quality issues
- Accepts: Processed video ID in the URL
- Returns: Success status and new processed video ID
- Should create a new ProcessedVideo record with different random settings
- Should trigger background processing task

**Quick Fix for Quality Issues (POST request to /api/videos/uniquify/[id]/quick-fix)**
- Purpose: Quickly regenerate a video with automatic quality improvements
- Accepts: Processed video ID in the URL
- Returns: Success status and updated processed video ID
- Should analyze quality issues and apply corrective modifications
- Should update the existing ProcessedVideo record or create a new one

### Library Endpoints

**Get All Videos (GET request to /api/library)**
- Purpose: Retrieve all videos (both source and processed) for the authenticated user
- Accepts: Authentication session/token and optional query parameters for filtering
- Optional parameter "campaignId" to filter videos by specific campaign
- Returns: Array of video objects including both source and processed videos
- Should include pagination (50 videos per page)
- Should include video metadata, thumbnails, status, and campaign information
- Should support sorting by date, status, or campaign

### Connected Account Endpoints

**List Connected Accounts (GET request to /api/accounts)**
- Purpose: Retrieve all social media accounts the user has connected
- Accepts: Authentication session/token
- Returns: Array of connected account objects
- Should include platform type, account name, follower count, status (active/inactive), and last authentication date
- Should only return accounts owned by the current user

**Connect New Account (POST request to /api/accounts/connect)**
- Purpose: Add a new social media account connection via Ayrshare
- Accepts: Platform type (tiktok, instagram, or facebook) and Ayrshare profile key
- Example input: Platform "tiktok", profile key "prof_xxx"
- Returns: Success status and the newly created connected account object
- Should validate the Ayrshare profile key is valid
- Should fetch account details (name, follower count) from Ayrshare
- Should set isActive to true by default

**Disconnect Account (DELETE request to /api/accounts/[id])**
- Purpose: Remove a social media account connection
- Accepts: Connected account ID in the URL
- Returns: Success status
- Should verify the user owns this account
- Should cancel any scheduled posts using this account

### Schedule Endpoints

**Get All Scheduled Posts (GET request to /api/schedule)**
- Purpose: Retrieve all scheduled posts for the authenticated user
- Accepts: Authentication session/token and optional filters
- Returns: Array of scheduled post objects with related video and account information
- Should include post caption, scheduled time, status, platform, account name, and video thumbnail
- Should support filtering by status, date range, or campaign
- Should be sorted by scheduled time (soonest first)

**Create Scheduled Post (POST request to /api/schedule)**
- Purpose: Schedule a video to be posted to a social media account
- Accepts: Processed video ID, connected account ID, campaign ID, caption text, and scheduled date/time
- Example input: Video ID "pv_xxx", account ID "ca_xxx", campaign ID "camp_xxx", caption "Check out this amazing workout! #fitness #workout", scheduled for "2026-01-25T10:00:00Z"
- Returns: Success status and the newly created scheduled post object
- Should validate the video and account exist and belong to the user
- Should validate the scheduled time is in the future
- Should set initial status to "scheduled"

**Update Scheduled Post (PUT request to /api/schedule/[id])**
- Purpose: Modify an existing scheduled post
- Accepts: Scheduled post ID in the URL and fields to update (caption, scheduledAt, etc.)
- Returns: Success status and updated scheduled post object
- Should verify the user owns this post
- Should only allow updates if status is "scheduled" or "paused"

**Delete Scheduled Post (DELETE request to /api/schedule/[id])**
- Purpose: Remove a scheduled post
- Accepts: Scheduled post ID in the URL
- Returns: Success status
- Should verify the user owns this post
- Should only allow deletion if status is "scheduled" or "paused" (not already posted)

**Pause Scheduled Post (POST request to /api/schedule/[id]/pause)**
- Purpose: Temporarily disable a scheduled post without deleting it
- Accepts: Scheduled post ID in the URL
- Returns: Success status
- Should change status to "paused"
- Should prevent the post from being published

**Resume Scheduled Post (POST request to /api/schedule/[id]/resume)**
- Purpose: Re-enable a paused scheduled post
- Accepts: Scheduled post ID in the URL
- Returns: Success status
- Should change status back to "scheduled"
- Should allow the post to be published at its scheduled time

### Cron Job Endpoints

**Process Scheduled Posts (POST request to /api/cron/process-posts)**
- Purpose: Automatically publish posts that are due to be posted (runs every 1 minute)
- Accepts: Special cron secret token for authentication
- This endpoint should query the database for all posts where scheduled time is now or past and status is "scheduled"
- For each post found:
  - Update status to "processing"
  - Get the video URL from Cloudflare R2
  - Call Ayrshare API to create the post
  - Store the Ayrshare post ID
  - Update status to "posted" on success or "failed" on error
- Should implement retry logic for failed posts (up to 3 attempts)
- Returns: Success status and number of posts processed
- Should be protected by a secret token to prevent unauthorized access

**Download Pending Videos (POST request to /api/cron/download-videos)**
- Purpose: Download videos that are marked as selected but not yet downloaded (runs periodically)
- Accepts: Special cron secret token for authentication
- This endpoint should query the database for source videos with status "pending"
- For each video found:
  - Update status to "downloading"
  - Download the video file from the original URL
  - Upload the video file to Cloudflare R2
  - Store the R2 URL in downloadedUrl field
  - Update status to "downloaded" on success or "failed" on error
- Returns: Success status and number of videos downloaded
- Should process videos in batches (3-5 at a time) to avoid overwhelming the system

**Process Video Modifications (POST request to /api/cron/process-videos)**
- Purpose: Apply modifications to videos that are pending processing (runs periodically)
- Accepts: Special cron secret token for authentication
- This endpoint should query the database for processed videos with status "pending"
- For each video found:
  - Update status to "processing"
  - Download the source video from R2
  - Apply the modifications specified in modificationSettings using FFmpeg
  - Upload the modified video to R2
  - Store the R2 URL in processedUrl field
  - Verify video quality
  - Update status to "completed" on success or "failed" on error
- Returns: Success status and number of videos processed
- Should process videos in batches (3-5 at a time) to avoid overwhelming the system

### Webhook Endpoints

**Receive Ayrshare Updates (POST request to /api/webhooks/ayrshare)**
- Purpose: Receive status updates and analytics from Ayrshare after posts are published
- Accepts: Webhook payload from Ayrshare containing post status and analytics
- The payload will include:
  - Action type (typically "post")
  - Status (success or failure)
  - Ayrshare post ID
  - Direct URL to the post on the social media platform
  - Analytics data including views count, likes count, and comments count
- Example payload: Action "post", status "success", ID "ayr_post_123", post URL "https://tiktok.com/@user/video/xxx", analytics showing 1234 views, 89 likes, 12 comments
- This endpoint should:
  - Find the scheduled post by ayrsharePostId
  - Update the platformPostUrl, postedAt timestamp, and analytics fields
  - Update the status if different from current
- Returns: Success acknowledgment
- Should validate the webhook is genuinely from Ayrshare

### Settings Endpoints

**Get User Settings (GET request to /api/settings)**
- Purpose: Retrieve the current user's settings
- Accepts: Authentication session/token
- Returns: User settings object with all preferences
- Should create default settings if none exist

**Update User Settings (PUT request to /api/settings)**
- Purpose: Modify user preferences
- Accepts: Fields to update (notification preferences, timezone, retry settings, etc.)
- Returns: Success status and updated settings object
- Should validate timezone is valid

### Health Check Endpoint

**Health Check (GET request to /api/health)**
- Purpose: Verify the application is running and healthy
- Accepts: No authentication required
- Returns: Simple success status and timestamp
- Should check database connectivity
- Should return HTTP 200 if healthy, 503 if unhealthy

---

## 🎨 UI/UX Requirements

### Design System
- **Framework:** Tailwind CSS
- **Component Library:** shadcn/ui (copy-paste components)
- **Icons:** Lucide React
- **Colors:** 
  - Primary: Blue (#3B82F6)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)
  - Background: White/Gray (#FFFFFF / #F9FAFB)
- **Typography:** System fonts (Inter, SF Pro)
- **Spacing:** 8px base unit

### Layout Structure

**Authenticated Layout:**

The main application layout for authenticated users should follow this structure:

- **Top Navigation Bar** spans the full width at the top of the screen and contains:
  - Application logo on the left
  - Optional search bar in the center
  - User menu dropdown on the right (profile picture, name, logout option)

- **Sidebar** is a fixed vertical navigation panel on the left side that contains the main navigation links (described below)

- **Main Content Area** occupies the remaining space to the right of the sidebar where all page content is displayed

The layout should be responsive: on mobile devices, the sidebar should collapse into a hamburger menu.

**Sidebar Navigation:**
- Dashboard (Home icon)
- Campaigns (Folder icon)
- Library (Video icon)
- Schedule (Calendar icon)
- Settings (Gear icon)

### Page Layouts

#### 1. Landing Page (`/`)
- Hero section with value proposition
- Feature highlights (3 columns)
- CTA button: "Get Started"
- Footer with links

#### 2. Sign Up Page (`/sign-up`)
- Centered form
- Fields: Name, Email, Password, Confirm Password
- Submit button: "Create Account"
- Link to sign-in: "Already have an account?"

#### 3. Sign In Page (`/sign-in`)
- Centered form
- Fields: Email, Password
- Submit button: "Sign In"
- Link to sign-up: "Don't have an account?"

#### 4. Dashboard (`/dashboard`)
**Header:**
- Page title: "Dashboard"
- Quick action button: "New Campaign"

**Stats Cards (4 across):**
- Active Campaigns (count)
- Videos Processed (count)
- Posts Today (count)
- Storage Used (MB)

**Recent Campaigns (table):**
- Campaign Name
- Status badge
- Videos count
- Last updated
- Action buttons (View, Delete)

**Upcoming Posts (list):**
- Video thumbnail
- Caption preview
- Scheduled time
- Platform badge
- Status

#### 5. Campaigns Page (`/campaigns`)
**Header:**
- Page title: "Campaigns"
- Button: "Create Campaign"

**Campaign Grid:**
Each card shows:
- Campaign name
- Source platform badge
- Status badge
- Progress stats:
  - Videos discovered: X
  - Videos selected: Y
  - Videos processed: Z
- Storage used
- Action buttons: "View", "Delete"

**Create Campaign Modal:**
- Form fields:
  - Campaign Name (input)
  - Source Profile URL (input)
  - Source Platform (select: TikTok, Instagram, Facebook)
- Buttons: "Cancel", "Create & Discover Videos"

#### 6. Campaign Detail Page (`/campaigns/[id]`)
**Header:**
- Back button
- Campaign name
- Status badge
- Action button: "Import More Videos"

**Tabs:**
1. **Discovered Videos** - Videos from ScrapeCreator
2. **Processed Videos** - Uniquified videos ready to schedule

**Tab 1: Discovered Videos**
- Bulk select checkbox
- Video grid (4-5 per row)
- Each video card:
  - Thumbnail
  - Duration badge
  - View count
  - Upload date
  - Checkbox for selection
  - Status badge (pending/downloading/downloaded/failed)
- Bottom action bar (when videos selected):
  - "X videos selected"
  - Button: "Process Selected Videos"

**Tab 2: Processed Videos**
- Video grid (4-5 per row)
- Each video card:
  - Thumbnail with play button
  - Version number badge
  - Quality badge (Good/Reprocess)
  - Status badge
  - Action buttons: "Schedule", "Reprocess", "Delete"

#### 7. Uniquify Page (`/campaigns/uniquify`)
**Preset Selection:**
- 3 preset cards:
  - **Subtle** - Minimal changes (95% similarity)
  - **Balanced** - Moderate changes (85% similarity) [RECOMMENDED]
  - **Aggressive** - Maximum changes (75% similarity)
- Each card shows which modifications are applied
- Button: "Start Processing"

**Processing Page (`/campaigns/uniquify/processing`):**
- Overall progress bar
- List of videos being processed:
  - Video thumbnail
  - Video name
  - Progress bar
  - Status text
- Auto-redirects when complete

**Review Page (`/campaigns/uniquify/review`):**
- Grid of processed videos
- Each card:
  - Before/After thumbnail comparison
  - Play button to preview
  - Quality score
  - Modification summary
  - Actions: "Accept", "Reprocess", "Quick Fix"
- Bottom buttons: "Schedule All", "Back to Campaign"

#### 8. Library Page (`/library`)
**Header:**
- Page title: "Video Library"
- Filters:
  - Campaign (dropdown)
  - Status (dropdown)
  - Date range

**Video Grid:**
- Combined view of source and processed videos
- Each video card:
  - Thumbnail
  - Title/caption preview
  - Campaign badge
  - Type badge (Original/Processed)
  - Status badge
  - Action buttons: "Preview", "Schedule", "Delete"

**Video Preview Modal:**
- Large video player
- Video metadata:
  - Campaign name
  - Duration
  - Processing date
  - Modifications applied
- Action buttons: "Schedule Post", "Reprocess", "Download"

#### 9. Schedule Page (`/schedule`)
**Header:**
- Page title: "Post Schedule"
- Button: "Schedule New Post"

**Calendar View:**
- Month/Week/Day toggle
- Posts displayed on calendar by scheduled time
- Color-coded by status:
  - Blue: Scheduled
  - Yellow: Processing
  - Green: Posted
  - Red: Failed

**Post Queue List:**
- Table view of all scheduled posts
- Columns:
  - Video thumbnail
  - Caption (truncated)
  - Platform badge
  - Account name
  - Scheduled time
  - Status badge
  - Actions (Edit, Delete, Pause)
- Sort by: Date, Status, Platform

**Schedule Post Modal:**
- Video selector (dropdown or recent videos grid)
- Connected account selector
- Caption input (with character count)
- Date & time picker
- Platform preview
- Buttons: "Cancel", "Schedule Post"

#### 10. Settings Page (`/settings`)
**Tabs:**
1. Profile
2. Connected Accounts
3. Notifications
4. API Keys

**Profile Tab:**
- Name (input)
- Email (input, disabled)
- Timezone (select)
- Button: "Save Changes"

**Connected Accounts Tab:**
- List of connected accounts:
  - Platform icon
  - Account name
  - Follower count
  - Status (Active/Inactive)
  - Button: "Disconnect"
- Button: "Connect New Account"

**Connect Account Flow:**
1. Select platform (TikTok/Instagram/Facebook)
2. Redirects to Ayrshare OAuth
3. Returns with profile key
4. Saves to database

**Notifications Tab:**
- Email notifications (toggle)
- Push notifications (toggle)
- Notification preferences:
  - Post success
  - Post failure
  - Processing complete
  - Weekly summary

**API Keys Tab:**
- ScrapeCreator API Key (password input)
- Ayrshare API Key (password input)
- Cloudflare R2 credentials (collapsible section)
- Button: "Save Keys"

### Component Library (shadcn/ui)
Required components:
- `<Button>` - Primary, secondary, destructive variants
- `<Input>` - Text inputs with validation
- `<Label>` - Form labels
- `<Card>` - Content containers
- `<Badge>` - Status indicators
- `<Dialog>` - Modals
- `<Tabs>` - Tab navigation
- `<Checkbox>` - Multi-select
- `<Select>` - Dropdowns
- `<Separator>` - Dividers
- `<Toast>` - Notifications

### Custom Components to Build

**CampaignCard Component:**
A reusable card component that displays campaign summary information. It should accept these properties:
- Campaign name (text)
- Status (one of: discovering, discovered, processing, ready, failed)
- Number of videos discovered
- Number of videos selected
- Number of videos processed
- Storage used (formatted string like "2.3 GB")
- Callback function for when the "View" button is clicked
- Callback function for when the "Delete" button is clicked

The card should display all this information in an organized layout with appropriate status badge styling, and include action buttons at the bottom.

**VideoCard Component:**
A card component for displaying individual videos in a grid. It should accept these properties:
- Thumbnail URL for the video preview image
- Duration in seconds (display as formatted time like "0:45")
- Status (pending, downloading, downloaded, failed)
- Selected boolean flag
- Callback function for when the selection checkbox is clicked
- Callback function for when the preview button is clicked

The card should show the thumbnail as the main visual, overlay the duration badge, show a status indicator, include a checkbox for selection, and be clickable to preview the video.

**ProcessedVideoCard Component:**
A specialized card for displaying processed/uniquified videos. It should accept these properties:
- Thumbnail URL for the video preview
- Version number (1, 2, 3, etc.)
- Quality score (good, poor, reprocess)
- Array of modification summaries (e.g., ["Speed 1.02x", "Brightness +3", "Crop 2%"])
- Callback function for when "Schedule" button is clicked
- Callback function for when "Reprocess" button is clicked

The card should display the thumbnail, show a version badge, display a quality indicator badge, list the modifications applied, and provide action buttons.

**StatusBadge Component:**
A small badge component for displaying status with appropriate color coding. It should accept:
- Status value (discovering, discovered, processing, ready, failed, scheduled, posted, etc.)

The component should render a colored badge with an icon and text label. Color coding should be:
- Blue for in-progress states (discovering, processing, scheduled)
- Green for success states (discovered, ready, posted)
- Yellow for warning states (pending)
- Red for error states (failed)

**ProgressBar Component:**
A progress indicator component showing completion status. It should accept:
- Current progress value (number)
- Total/maximum value (number)
- Label text to display above the bar

The component should calculate and display the percentage, show a visual progress bar that fills proportionally, and include the label text and numerical progress (e.g., "15 / 30").

**PostQueueItem Component:**
A list item component for displaying scheduled posts in the queue. It should accept these properties:
- Video thumbnail URL
- Caption text (truncate if too long)
- Platform type (tiktok, instagram, facebook)
- Account name to display
- Scheduled date/time
- Current status
- Callback function for when "Edit" button is clicked
- Callback function for when "Delete" button is clicked
- Callback function for when "Pause" button is clicked

The component should display all information in a horizontal row format with the thumbnail on the left, details in the middle, and action buttons on the right. Include a platform badge with appropriate icon.

### Responsive Behavior
- **Desktop (>1024px):** Full sidebar, 4-5 videos per row
- **Tablet (768-1024px):** Collapsible sidebar, 3 videos per row
- **Mobile (<768px):** Bottom nav, 2 videos per row, stacked cards

### Loading States
- Skeleton loaders for video grids
- Spinner for form submissions
- Progress bars for long-running tasks
- Toast notifications for success/error

### Empty States
- **No campaigns:** "Create your first campaign to get started"
- **No videos:** "No videos discovered yet. Click Import to find videos."
- **No scheduled posts:** "Schedule your first post to start automating"
- **No connected accounts:** "Connect a social media account to start posting"

---

## 🔗 External Service Integration

### 1. Cloudflare R2 (Video Storage)

**Purpose:** Store original and processed videos since Replit cannot store large video files permanently

**How it Works:** Cloudflare R2 is an S3-compatible object storage service. The application needs to use the AWS S3 SDK to interact with it.

**Required Configuration:**
The application needs these environment variables configured:
- **R2_ACCESS_KEY_ID**: The access key for authentication
- **R2_SECRET_ACCESS_KEY**: The secret key for authentication
- **R2_ENDPOINT**: The full endpoint URL (format: https://your-account-id.r2.cloudflarestorage.com)
- **R2_BUCKET_NAME**: The name of the bucket (suggest: "postplex-videos")
- **R2_PUBLIC_URL**: The public URL for accessing files (format: https://pub-xxx.r2.dev)

**Client Setup:**
Create an S3-compatible client configured with:
- Region set to "auto"
- Endpoint set to the R2 endpoint URL
- Credentials using the access key ID and secret access key

**Upload Function Requirements:**
The application needs a function to upload videos that:
- Accepts a video file buffer, filename, and content type (default to "video/mp4")
- Generates a unique key using timestamp and filename (format: "videos/timestamp-filename")
- Sends a Put Object command to R2 with the bucket name, key, file buffer, and content type
- Returns the full public URL by combining the public URL base with the file key

**Recommended File Organization in R2:**
Structure files in the bucket as:
- Original videos: source/campaign_id/video_filename.mp4
- Processed videos: processed/campaign_id/video_filename_version.mp4

This keeps videos organized by campaign and separates originals from processed versions.

**Integration Workflow:**
1. When a video is downloaded from ScrapeCreator, upload it to the "source/campaign_xxx/" path in R2
2. After processing a video with FFmpeg, upload the modified version to the "processed/campaign_xxx/" path in R2
3. Store the returned public URL in the database (downloadedUrl for source videos, processedUrl for processed videos)
4. When posting via Ayrshare, provide the R2 public URL so Ayrshare can fetch the video file

**Important Notes:**
- The bucket must be configured for public read access so Ayrshare can download videos
- Always use the public URL, not signed URLs, for scheduled posts since they need to remain accessible
- Clean up temporary files after uploading to R2 to save disk space on Replit

### 2. ScrapeCreator API (Video Discovery)

**Purpose:** Discover videos from TikTok, Instagram, and Facebook profiles since no other service provides this capability

**How it Works:** ScrapeCreator provides an API that accepts a social media profile URL and returns all videos from that profile with metadata.

**Required Configuration:**
The application needs this environment variable:
- **SCRAPE_CREATOR_API_KEY**: The API key provided by the user for authentication

**API Details:**
The API endpoint and authentication method will depend on ScrapeCreator's actual API documentation. Typically, APIs use:
- A base URL for all requests
- API key passed in the Authorization header (format: "Bearer YOUR_API_KEY")
- Content type set to "application/json"

**Required API Call:**
The application needs to make a POST request to discover videos with these parameters:
- **profileUrl**: The full URL to the social media profile (e.g., "https://www.tiktok.com/@username")
- **platform**: The platform type ("tiktok", "instagram", or "facebook")
- **limit**: Optional maximum number of videos to return (suggest default of 50)

**Expected Response Format:**
The API should return a response containing:
- **success**: Boolean indicating if the request succeeded
- **profileInfo**: Object containing:
  - username: The profile's username
  - followerCount: Number of followers (may be null)
  - videoCount: Total number of videos on the profile
- **videos**: Array of video objects, each containing:
  - url: Direct URL to the video on the social platform
  - caption: The text caption or description
  - thumbnailUrl: URL to a preview thumbnail image
  - duration: Video length in seconds
  - viewCount: Number of views (may be null)
  - likeCount: Number of likes (may be null)
  - uploadedAt: ISO 8601 timestamp of when it was posted

**Integration Workflow:**
1. When a user creates a campaign with a profile URL, store the campaign with status "discovering"
2. Make the API call to ScrapeCreator with the profile URL and platform
3. For each video in the response, create a SourceVideo record in the database with:
   - The campaign ID
   - Original URL from the response
   - Caption, thumbnail URL, duration, view count from the response
   - uploadedAt timestamp from the response
   - Initial status set to "pending"
   - selected flag set to true by default
4. Update the campaign status to "discovered"
5. Update the campaign's videosDiscovered count
6. Display the videos to the user in a grid for selection

**Error Handling:**
- If the API call fails, set campaign status to "failed" and store the error message
- Handle rate limits if the API has usage restrictions
- Validate that the profile URL matches the selected platform before making the call

### 3. Ayrshare API (Social Media Posting)

**Purpose:** Automatically post videos to TikTok, Instagram, and Facebook since no other service provides this multi-platform posting capability

**How it Works:** Ayrshare provides an API that accepts a video URL, caption, and target platforms, then handles the posting process including OAuth authentication with social media platforms.

**Required Configuration:**
The application needs this environment variable:
- **AYRSHARE_API_KEY**: The API key provided by the user for authentication

**API Details:**
- **Base URL**: https://app.ayrshare.com/api
- **Authentication**: API key passed in the Authorization header (format: "Bearer YOUR_API_KEY")
- **Content Type**: "application/json"

**Create Post API Call:**
The application needs to make a POST request to the /post endpoint with these parameters:
- **post**: The caption text for the social media post
- **platforms**: Array of platform names to post to (e.g., ["tiktok"], ["instagram"], or multiple)
- **mediaUrls**: Array containing the video URL (from Cloudflare R2 public URL)
- **profileKey**: The Ayrshare profile identifier for the connected account
- **scheduleDate**: Optional ISO 8601 timestamp for scheduling (if not immediate)

**Expected Create Post Response:**
The API returns:
- **status**: "success" or "error"
- **id**: Ayrshare's unique identifier for this post
- **postIds**: Array of objects, one per platform, each containing:
  - platform: The platform name
  - id: The platform-specific post ID
  - postUrl: Direct URL to the post once published
  - status: Current status (e.g., "scheduled", "posted")

**Get Post Status API Call:**
The application can check post status with a GET request to /post/{postId} where postId is the Ayrshare post ID. This returns updated information about the post including any analytics.

**Delete Post API Call:**
The application can cancel or delete a post with a DELETE request to /post/{postId}. This only works for scheduled posts that haven't been published yet.

**Webhook Configuration:**
In the Ayrshare dashboard, the user needs to configure a webhook URL pointing to: https://your-app.replit.app/api/webhooks/ayrshare

**Expected Webhook Payload:**
When a post is published or updated, Ayrshare sends a webhook containing:
- **action**: Type of event (typically "post")
- **status**: "success" or "failure"
- **id**: The Ayrshare post ID
- **platform**: Which platform this update is for
- **postUrl**: Direct URL to the published post
- **analytics**: Object containing:
  - views: Number of views
  - likes: Number of likes
  - comments: Number of comments
  - shares: Number of shares
- **postedAt**: ISO 8601 timestamp of when it was published

**Integration Workflow:**

**For Connecting Accounts:**
1. User initiates account connection in the settings page
2. The application should use Ayrshare's OAuth flow to authenticate the user's social media account
3. After successful authentication, Ayrshare returns a profileKey
4. Store the profileKey in the ConnectedAccount table

**For Posting Videos:**
1. When the cron job finds a scheduled post that's due, retrieve the processed video URL from R2
2. Make the create post API call to Ayrshare with:
   - The video's R2 public URL
   - The caption from the scheduled post
   - The platform from the connected account
   - The profileKey from the connected account
3. Store the returned Ayrshare post ID in the ScheduledPost record
4. Update the post status to "processing"
5. Wait for the webhook to confirm successful posting

**For Receiving Updates:**
1. When the webhook endpoint receives a payload from Ayrshare:
   - Find the ScheduledPost by the Ayrshare post ID
   - Update the status to "posted" if successful
   - Store the platformPostUrl
   - Store the postedAt timestamp
   - Update the analytics fields (viewCount, likeCount, commentCount, shareCount)
2. If status is "failure", update post status to "failed" and store error message

**Error Handling:**
- If the API call fails, update post status to "failed" and increment retryCount
- If retryCount is less than maxRetries (typically 3), schedule for retry
- Handle rate limits and respect API usage quotas
- Validate that video URLs are publicly accessible before sending to Ayrshare

---

## 🎬 User Flows

### Flow 1: Complete Workflow (First-Time User)

1. **Landing** → Click "Get Started"
2. **Sign Up** → Enter email/password → Create account
3. **Dashboard** → Click "Create Campaign"
4. **Create Campaign Modal:**
   - Name: "Fitness Content"
   - URL: "https://www.tiktok.com/@fitnessguru"
   - Platform: TikTok
   - Click "Create & Discover Videos"
5. **Campaign Detail (Discovering):**
   - Loading spinner
   - Status: "Discovering videos..."
   - ScrapeCreator API called
6. **Campaign Detail (Discovered):**
   - Grid of 45 videos appears
   - Status: "Discovered"
   - User reviews thumbnails
   - Selects 20 videos
   - Clicks "Download Selected Videos"
7. **Campaign Detail (Downloading):**
   - Videos download in background
   - Status badges update: pending → downloading → downloaded
8. **Campaign Detail (Downloaded):**
   - Click "Process Videos" button
   - Redirect to Uniquify Preset Selection
9. **Uniquify Preset:**
   - Select "Balanced" preset
   - Click "Start Processing"
10. **Uniquify Processing:**
    - Progress bar shows 20 videos processing
    - FFmpeg runs modifications
    - Uploads to R2
11. **Uniquify Review:**
    - Grid shows 60 processed videos (3 versions each)
    - Each card shows quality badge
    - User clicks play to preview
    - Clicks "Accept All"
12. **Back to Campaign Detail:**
    - Switch to "Processed Videos" tab
    - See all 60 processed videos
    - Select one video
    - Click "Schedule"
13. **Schedule Post Modal:**
    - Video preview shown
    - Select connected account (or prompt to connect)
    - If no account: Click "Connect Account"
14. **Connect Account:**
    - Select platform: TikTok
    - Redirects to Ayrshare OAuth
    - Returns with profile key
    - Account now connected
15. **Schedule Post Modal (continued):**
    - Select newly connected account
    - Edit caption: "Check out this workout! #fitness"
    - Pick date/time: Tomorrow at 10:00 AM
    - Click "Schedule Post"
16. **Schedule Page:**
    - See post in queue
    - Status: "Scheduled"
17. **Next Day at 10:00 AM:**
    - Cron job runs
    - Calls Ayrshare API
    - Post published to TikTok
18. **User Checks Schedule Page:**
    - Post status: "Posted"
    - See post URL
    - See analytics (views, likes)

### Flow 2: Quick Campaign

1. Dashboard → "New Campaign"
2. Enter profile URL → "Create & Discover"
3. Wait for discovery (30 seconds)
4. Select all videos → "Download & Process"
5. Choose "Aggressive" preset → "Start"
6. Wait for processing (5-10 minutes)
7. Review processed videos → "Schedule All"
8. Bulk schedule modal:
   - Select account
   - Set start date/time
   - Set frequency (1 per day)
   - Edit captions (optional)
9. Click "Schedule All"
10. Done - 100 posts scheduled

### Flow 3: Reprocess Poor Quality Video

1. Campaign Detail → Processed Videos tab
2. Notice video with "Poor Quality" badge
3. Click "Quick Fix" button
4. Modal shows options:
   - "Regenerate with Different Settings"
   - "Use Different Preset"
   - "Manual Adjustment"
5. Select "Regenerate"
6. New version created
7. Review new version → Accept

### Flow 4: Managing Scheduled Posts

1. Schedule Page → Calendar View
2. See all upcoming posts
3. Click on a post
4. Edit modal opens:
   - Change caption
   - Change time
   - Change account
5. Save changes
6. Or click "Pause" to temporarily disable
7. Or click "Delete" to remove from queue

---

## 🔒 Security & Performance

### Security Requirements

**Authentication:**
- Password hashing with bcrypt (minimum 10 rounds)
- Secure session management
- CSRF protection on all forms
- Rate limiting on auth endpoints (5 attempts per 15 minutes)

**API Security:**
- Authenticate all API routes
- Validate user ownership of resources
- Input sanitization and validation (use Zod)
- SQL injection prevention (Prisma handles this)
- XSS protection (React escapes by default)

**Secrets Management:**
- Never commit API keys to git
- Use Replit Secrets for sensitive values
- Rotate API keys regularly
- Use environment variables for configuration

**Video Security:**
- Validate video file types (mp4, mov, webm only)
- Scan for malicious content
- Limit video file size (max 500 MB)
- Use signed URLs for temporary access

**CRON Security:**
- Require secret token for cron endpoints
- Validate token in request header
- All cron endpoints should check for a custom header named "x-cron-secret"
- Compare this header value against the CRON_SECRET environment variable
- If they don't match, return HTTP 401 Unauthorized error
- This prevents unauthorized external access to automated job endpoints

### Performance Considerations

**Database:**
- Add indexes on frequently queried columns
- Use connection pooling
- Implement pagination (50 items per page)
- Use database transactions for multi-step operations

**Video Processing:**
- Process videos asynchronously
- Use background jobs/queues
- Set timeouts for long-running tasks
- Limit concurrent processing (3-5 videos at a time)

**Storage:**
- Compress videos before upload
- Use CDN for video delivery (R2 has built-in CDN)
- Implement lazy loading for video thumbnails
- Clean up old videos (optional retention policy)

**Caching:**
- Cache user data in memory (React Query)
- Cache campaign lists
- Invalidate cache on updates

**Frontend:**
- Code splitting with Next.js automatic optimization
- Image optimization with next/image
- Lazy load video previews
- Infinite scroll for large lists

**API Rate Limits:**
- ScrapeCreator: Respect API limits
- Ayrshare: Respect API limits
- Implement retry logic with exponential backoff

**Error Handling:**
- Graceful degradation for failed requests
- User-friendly error messages
- Log errors for debugging
- Retry failed operations automatically

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Basic app structure and authentication

Tasks:
- [ ] Set up Next.js project in Replit
- [ ] Configure Replit PostgreSQL database
- [ ] Set up Prisma ORM and define schema
- [ ] Run database migrations
- [ ] Implement Replit Auth (sign up, sign in, sign out)
- [ ] Create authenticated layout with sidebar
- [ ] Build basic dashboard page
- [ ] Set up Tailwind CSS and shadcn/ui
- [ ] Create reusable components (Button, Card, Badge, Input)

Deliverable: User can sign up, log in, and see empty dashboard

---

### Phase 2: Campaign Management (Week 2)
**Goal:** Create campaigns and discover videos

Tasks:
- [ ] Build campaigns list page
- [ ] Create "New Campaign" modal
- [ ] Integrate ScrapeCreator API
- [ ] Implement POST /api/campaigns/create
- [ ] Implement POST /api/campaigns/[id]/import
- [ ] Store discovered videos in SourceVideo table
- [ ] Build campaign detail page
- [ ] Display video grid with thumbnails
- [ ] Implement video selection (checkboxes)
- [ ] Add status badges and progress tracking

Deliverable: User can create campaign, discover videos, and see them in a grid

---

### Phase 3: Video Download & Storage (Week 3)
**Goal:** Download videos and store in Cloudflare R2

Tasks:
- [ ] Set up Cloudflare R2 client (S3 SDK)
- [ ] Implement video download function
- [ ] Create background job for downloading videos
- [ ] Upload downloaded videos to R2
- [ ] Store R2 URLs in database
- [ ] Update video status during download
- [ ] Add error handling and retry logic
- [ ] Build download progress UI
- [ ] Implement POST /api/videos/batch (download trigger)

Deliverable: User can download selected videos to R2

---

### Phase 4: Video Processing (Week 4-5)
**Goal:** Uniquify videos with FFmpeg modifications

Tasks:
- [ ] Install FFmpeg in Replit
- [ ] Build video processing module
- [ ] Implement modification presets (Subtle, Balanced, Aggressive)
- [ ] Create processing functions:
  - Speed adjustment
  - Brightness/contrast/saturation
  - Crop and scale
  - Flip horizontal/vertical
  - Audio pitch shift
  - Metadata removal
- [ ] Build uniquify preset selection page
- [ ] Build processing progress page
- [ ] Build review page with before/after
- [ ] Implement POST /api/videos/uniquify
- [ ] Create background job for processing
- [ ] Upload processed videos to R2
- [ ] Store ProcessedVideo records
- [ ] Implement quality verification
- [ ] Add "Quick Fix" and "Reprocess" actions

Deliverable: User can process videos with randomized modifications

---

### Phase 5: Social Account Connection (Week 6)
**Goal:** Connect TikTok, Instagram, Facebook via Ayrshare

Tasks:
- [ ] Set up Ayrshare API client
- [ ] Build settings page with tabs
- [ ] Create "Connected Accounts" tab
- [ ] Implement account connection flow
- [ ] Store connected accounts in database
- [ ] Implement GET /api/accounts
- [ ] Implement POST /api/accounts/connect
- [ ] Implement DELETE /api/accounts/[id]
- [ ] Display account list with status
- [ ] Add "Connect Account" button and modal
- [ ] Handle Ayrshare profile keys

Deliverable: User can connect and manage social media accounts

---

### Phase 6: Post Scheduling (Week 7)
**Goal:** Schedule posts to be published

Tasks:
- [ ] Build schedule page with calendar and list views
- [ ] Create "Schedule Post" modal
- [ ] Implement video selector dropdown
- [ ] Implement account selector
- [ ] Add caption input with character count
- [ ] Add date/time picker
- [ ] Implement POST /api/schedule
- [ ] Store scheduled posts in database
- [ ] Build post queue list component
- [ ] Add edit/delete actions
- [ ] Implement pause/resume functionality
- [ ] Add bulk scheduling option

Deliverable: User can schedule posts with videos and accounts

---

### Phase 7: Automated Posting (Week 8)
**Goal:** Automatically post videos at scheduled times

Tasks:
- [ ] Set up cron job (every 1 minute)
- [ ] Implement POST /api/cron/process-posts
- [ ] Query for posts where scheduledAt <= now
- [ ] Integrate Ayrshare post creation API
- [ ] Update post status to "processing" → "posted"
- [ ] Store Ayrshare post ID and platform URL
- [ ] Implement retry logic for failed posts
- [ ] Add CRON_SECRET authentication
- [ ] Set up Replit scheduled task
- [ ] Test end-to-end posting flow

Deliverable: Posts automatically publish at scheduled times

---

### Phase 8: Webhooks & Analytics (Week 9)
**Goal:** Receive post updates and track performance

Tasks:
- [ ] Implement POST /api/webhooks/ayrshare
- [ ] Verify webhook authenticity
- [ ] Parse webhook payload
- [ ] Update ScheduledPost with analytics
- [ ] Store views, likes, comments, shares
- [ ] Display analytics on schedule page
- [ ] Add post performance dashboard
- [ ] Build analytics chart components (optional)
- [ ] Add notifications for post success/failure

Deliverable: User sees real-time post performance data

---

### Phase 9: Library & Search (Week 10)
**Goal:** Browse and search all videos

Tasks:
- [ ] Build library page
- [ ] Implement GET /api/library
- [ ] Display combined source + processed videos
- [ ] Add filter by campaign, status, date
- [ ] Add search by caption/name
- [ ] Implement pagination (50 per page)
- [ ] Build video preview modal
- [ ] Add quick actions (schedule, delete, download)
- [ ] Optimize video grid performance

Deliverable: User can browse and search entire video library

---

### Phase 10: Polish & Testing (Week 11-12)
**Goal:** Final touches and bug fixes

Tasks:
- [ ] Add loading states and skeletons
- [ ] Implement toast notifications
- [ ] Add empty states for all pages
- [ ] Error boundary for graceful errors
- [ ] Responsive design for mobile/tablet
- [ ] Test all user flows end-to-end
- [ ] Fix any bugs found
- [ ] Optimize performance
- [ ] Add help tooltips and onboarding
- [ ] Write README and documentation
- [ ] Deploy to production Replit

Deliverable: Production-ready app

---

## 📦 File Structure

The application should be organized with this directory structure:

**Main Application Directory (app/):**

**Authentication Pages** - Located in app/(auth)/:
- Sign in page at sign-in/page
- Sign up page at sign-up/page

**Protected Dashboard Pages** - Located in app/(dashboard)/:
- Shared authenticated layout with sidebar at layout file
- Main dashboard overview at dashboard/page
- Campaign list page at campaigns/page
- Optional new campaign page at campaigns/new/page
- Campaign detail page at campaigns/[id]/page where [id] is dynamic
- Video uniquification preset selection at campaigns/uniquify/page
- Processing progress page at campaigns/uniquify/processing/page
- Processed videos review page at campaigns/uniquify/review/page
- Video library page at library/page
- Post schedule page at schedule/page
- User settings page at settings/page

**API Routes** - Located in app/api/:

Authentication endpoints in api/auth/:
- Register route at register/route
- Login route at login/route
- Logout route at logout/route
- Get current user at me/route

Campaign endpoints in api/campaigns/:
- List campaigns at route (GET method)
- Create campaign at create/route (POST method)
- Campaign operations at [id]/route (GET, PUT, DELETE methods)
- Import videos at [id]/import/route (POST method)

Video endpoints in api/videos/:
- Batch operations at batch/route
- Process videos at process/route
- Uniquify videos at uniquify/route (POST method)
- Check status at uniquify/[id]/status/route (GET method)
- Reprocess video at uniquify/[id]/reprocess/route (POST method)
- Quick fix at uniquify/[id]/quick-fix/route (POST method)

Library endpoint in api/library/:
- Get all videos at route (GET method)

Account endpoints in api/accounts/:
- List accounts at route (GET method)
- Connect account at connect/route (POST method)
- Disconnect account at [id]/route (DELETE method)

Schedule endpoints in api/schedule/:
- List posts at route (GET method)
- Schedule operations at [id]/route (PUT, DELETE methods)
- Pause post at [id]/pause/route (POST method)
- Resume post at [id]/resume/route (POST method)

Cron job endpoints in api/cron/:
- Process scheduled posts at process-posts/route
- Download videos at download-videos/route
- Process video modifications at process-videos/route

Webhook endpoints in api/webhooks/:
- Ayrshare webhook at ayrshare/route (POST method)

Settings endpoint in api/settings/:
- User settings at route (GET, PUT methods)

Health check in api/health/:
- Health status at route (GET method)

Root level in app/:
- Root layout file
- Landing page file
- Global styles CSS file

**Components Directory (components/):**

UI components from shadcn/ui library in components/ui/:
- Button, Card, Badge, Input, Label, Dialog, Tabs, Checkbox, Select, Separator, Toast components

Layout components in components/layout/:
- Sidebar, TopNav, Footer components

Campaign components in components/campaigns/:
- CampaignCard, CampaignList, CreateCampaignModal, StatusBadge, EmptyState components

Video components in components/videos/:
- VideoCard, VideoGrid, VideoPreviewModal, VideoSelector components

Uniquify components in components/uniquify/:
- PresetCard, ProcessedVideoCard, ProgressBar, QualityBadge, ComparisonView components

Schedule components in components/schedule/:
- SchedulePostModal, PostQueueList, PostQueueItem, CalendarView, DateTimePicker components

Settings components in components/settings/:
- ProfileForm, ConnectedAccountList, ConnectAccountModal, NotificationSettings components

**Library Directory (lib/):**

Utility modules:
- Database client module (Prisma)
- Authentication helpers for Replit Auth
- Storage module for Cloudflare R2 operations
- ScrapeCreator API wrapper module
- Ayrshare API wrapper module
- Video processor module using FFmpeg
- Video downloader module
- Background job queue management module
- General utility functions module
- Validation schemas module using Zod

**Database Directory (prisma/):**
- Database schema definition file
- Migrations folder containing all database migrations

**Types Directory (types/):**
- TypeScript type definitions file

**Public Directory (public/):**
- Images folder for static assets

**Configuration Files:**
- Environment variables file (should use Replit Secrets)
- ESLint configuration
- Next.js configuration
- Package dependencies file
- Tailwind CSS configuration
- TypeScript configuration
- README documentation

---

## 🔧 Environment Variables

The application requires these environment variables, which should be stored securely in Replit Secrets:

**Database Configuration (Replit PostgreSQL):**
- **DATABASE_URL**: The PostgreSQL connection string for database access with connection pooling
- **DIRECT_URL**: The direct PostgreSQL connection string for running migrations

**Cloudflare R2 Storage Configuration:**
- **R2_ACCESS_KEY_ID**: The access key for authenticating with Cloudflare R2
- **R2_SECRET_ACCESS_KEY**: The secret access key for Cloudflare R2
- **R2_ENDPOINT**: The full endpoint URL in format https://your-account-id.r2.cloudflarestorage.com
- **R2_BUCKET_NAME**: The name of the R2 bucket (recommended: "postplex-videos")
- **R2_PUBLIC_URL**: The public URL base for accessing files (format: https://pub-xxx.r2.dev)

**External API Keys:**
- **SCRAPE_CREATOR_API_KEY**: The API key for ScrapeCreator service provided by the user
- **AYRSHARE_API_KEY**: The API key for Ayrshare service provided by the user

**Application Configuration:**
- **NEXT_PUBLIC_APP_URL**: The full public URL where the app is hosted (format: https://your-app.replit.app)
- **CRON_SECRET**: A random secret string for authenticating cron job requests (should be randomly generated and kept secure)

**Replit Authentication (automatically configured by Replit):**
- **REPLIT_DB_URL**: Automatically set by Replit for authentication purposes

All sensitive values should be stored in Replit's Secrets manager and never committed to the codebase.

---

## ✅ Success Criteria

The project is complete when:

1. ✅ User can sign up, log in, and log out
2. ✅ User can create a campaign with a profile URL
3. ✅ System discovers videos using ScrapeCreator API
4. ✅ User can select and download videos
5. ✅ Videos are stored in Cloudflare R2
6. ✅ System processes videos with FFmpeg modifications
7. ✅ User can review processed videos with quality checks
8. ✅ User can connect social media accounts via Ayrshare
9. ✅ User can schedule posts with specific times
10. ✅ Cron job automatically posts at scheduled times
11. ✅ User receives post status updates via webhooks
12. ✅ User can view post analytics (views, likes, etc.)
13. ✅ All pages are responsive (desktop, tablet, mobile)
14. ✅ Error handling works gracefully
15. ✅ App is deployed and accessible on Replit

---

## 📞 Support & Resources

**Replit Documentation:**
- [Replit Auth](https://docs.replit.com/category/replit-auth)
- [Replit PostgreSQL](https://docs.replit.com/category/postgresql)
- [Deploying Next.js on Replit](https://docs.replit.com/category/nextjs)

**External Services:**
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Ayrshare API Docs](https://docs.ayrshare.com/)
- ScrapeCreator API Docs (use your provided key)

**FFmpeg Resources:**
- [FFmpeg Official Docs](https://ffmpeg.org/documentation.html)
- [FFmpeg Video Filters](https://ffmpeg.org/ffmpeg-filters.html)

**Next.js:**
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)

**Prisma:**
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## 📝 Notes for Replit Agent

**Important Implementation Details:**

1. **Use Replit's Native Services:**
   - Use Replit Auth (not Clerk)
   - Use Replit PostgreSQL (not Supabase)
   - No external Redis needed - use simple in-memory or database-based queue

2. **FFmpeg Installation:**
   - FFmpeg must be installed on the Replit environment for video processing
   - Add FFmpeg to the replit.nix configuration file or install it during initial setup
   - Use the system package manager to install FFmpeg (typically apt-get install ffmpeg)

3. **Background Jobs:**
   - Use Replit's cron system or simple Node.js timers
   - No BullMQ needed - keep it simple

4. **Video Processing:**
   - Process videos one at a time to avoid memory issues
   - Use temporary files, clean up after processing
   - Set max concurrent processing limit

5. **R2 Public URLs:**
   - Ensure R2 bucket has public access enabled
   - Ayrshare needs direct video URLs
   - Don't use signed URLs for scheduled posts

6. **Error Handling:**
   - All API routes should return a consistent JSON response format containing three fields:
     - A "success" field that is true for successful operations or false for failures
     - A "data" field containing the response payload (only present on success)
     - An "error" field containing the error message string (only present on failure)
   - This consistent format makes it easier for the frontend to handle all API responses uniformly

7. **Security:**
   - Use Replit Secrets for all API keys
   - Never expose secrets in client-side code
   - Validate all user inputs with Zod

8. **Testing Flow:**
   - Start with authentication
   - Then campaign creation
   - Then video discovery (use test TikTok profile)
   - Then download (test with 1-2 videos first)
   - Then processing
   - Finally scheduling and posting

---

**End of PRD**

This document should be used as the complete specification for building Postplex on Replit. Follow the phases in order, and reference the technical details for implementation guidance.

Good luck! 🚀
