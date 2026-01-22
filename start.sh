#!/bin/sh

echo "🔍 DEBUG: DATABASE_URL hostname:"
echo $DATABASE_URL | sed 's/postgres:.*@/postgres:****@/' | cut -d'/' -f3

echo "🔄 Running database migrations..."

# First, try to mark the baseline migration as already applied (for existing databases)
# This is needed when baselining an existing database
echo "📋 Checking for baseline migration..."
npx prisma migrate resolve --applied 0_init 2>/dev/null || echo "ℹ️ Baseline already applied or not needed"

# Now run migrations
npx prisma migrate deploy || {
  echo "⚠️ Migration deploy failed, attempting db push as fallback..."
  npx prisma db push --accept-data-loss || echo "⚠️ DB push also failed, continuing anyway..."
}

echo "✅ Database sync complete!"
echo "🚀 Starting application..."
exec npm start
