-- Rename column
ALTER TABLE "User" RENAME COLUMN "clerkUserId" TO "authUserId";

-- Rename index
ALTER INDEX "User_clerkUserId_key" RENAME TO "User_authUserId_key";
ALTER INDEX "User_clerkUserId_idx" RENAME TO "User_authUserId_idx";
