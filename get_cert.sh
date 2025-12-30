#!/bin/bash

# Script to get SSL Certificate by stopping port 80 service (Standalone Mode)
DOMAIN="panel.ghostest.sbs"

echo "🛑 Stopping conflicting service on port 80..."
# Try to stop common web servers
echo "Trying to stop nginx/apache/haproxy..."
systemctl stop nginx 2>/dev/null
systemctl stop apache2 2>/dev/null
systemctl stop haproxy 2>/dev/null
systemctl stop hiddify-haproxy.service 2>/dev/null

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
systemctl start haproxy 2>/dev/null
systemctl start hiddify-haproxy.service 2>/dev/null

echo "🔄 Restarting IdeaFlow to apply new certs..."
chmod +x deploy.sh
./deploy.sh
