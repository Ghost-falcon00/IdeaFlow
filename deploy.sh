#!/bin/bash

echo "🚀 Starting Deployment..."

# Pull latest changes
git pull origin main

# Build and start containers
echo "📦 Building and Starting Containers..."
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations (optional, can be done manually first time)
echo "🗄️ Running Migrations..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
echo "🎨 Collecting Static Files..."
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput

echo "✅ Deployment Complete! Check logs if needed: docker-compose -f docker-compose.prod.yml logs -f"
