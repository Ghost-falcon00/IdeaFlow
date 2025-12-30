#!/bin/bash

# Check for docker compose / docker-compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif docker-compose version >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "❌ Error: Neither 'docker compose' nor 'docker-compose' found or working."
    echo "Please reinstall docker-compose."
    exit 1
fi

echo "Using: $COMPOSE"

echo "🚀 Starting Deployment..."

# Pull latest changes
git pull origin main

# Build and start containers
echo "📦 Building and Starting Containers..."
# Force rebuild of frontend to pick up ARG changes
$COMPOSE -f docker-compose.prod.yml build --no-cache frontend
$COMPOSE -f docker-compose.prod.yml up -d --build

# Run migrations (optional, can be done manually first time)
echo "🗄️ Running Migrations..."
$COMPOSE -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
echo "🎨 Collecting Static Files..."
$COMPOSE -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

echo "✅ Deployment Complete! Check logs if needed: $COMPOSE -f docker-compose.prod.yml logs -f"
