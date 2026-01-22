#!/bin/sh
set -e

echo "🔍 DEBUG: DATABASE_URL hostname:"
echo $DATABASE_URL | sed 's/postgres:.*@/postgres:****@/' | cut -d'/' -f3

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete!"
echo "🚀 Starting application..."
npm start
