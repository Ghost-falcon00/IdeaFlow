#!/bin/bash

# Script to get SSL Certificate by stopping port 80 service (Standalone Mode)
DOMAIN="panel.ghostest.sbs"

echo "🛑 Stopping conflicting service on port 80..."
# Try to stop common web servers, or ask user for PID/Service Name
# You might need to change 'nginx' or 'apache2' to your actual service name
systemctl stop nginx 2>/dev/null || echo "Nginx not running or not found"
systemctl stop apache2 2>/dev/null || echo "Apache2 not running or not found"

# Check if port 80 is free
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 80 is still occupied! Please stop the service manually:"
    lsof -i :80
    exit 1
fi

echo "🔒 Requesting Certificate for $DOMAIN..."
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email ghostusm@gmail.com

if [ $? -eq 0 ]; then
    echo "✅ Certificate obtained successfully!"
else
    echo "❌ Failed to obtain certificate."
fi

echo "▶️ Restarting original service..."
systemctl start nginx 2>/dev/null
systemctl start apache2 2>/dev/null

echo "🔄 Restarting IdeaFlow to apply new certs..."
./deploy.sh
