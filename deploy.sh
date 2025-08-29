#!/bin/bash

SERVICE="interview-app"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

if [[ "$ENVIRONMENT" == "production" ]]; then
  ENV_FILE=".env.production"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
  ENV_FILE=".env.staging"
else
  echo "❌ Unknown environment: $ENVIRONMENT"
  exit 1
fi

# Apply .env
cp $ENV_FILE .env
echo "✅ Using environment file: $ENV_FILE"

# Remove other .env.* to avoid leakage
rm -f .env.staging .env.production .env.local

# Rebuild only this service
echo "🔨 Building Docker container..."
if ! sudo docker-compose build --no-cache $SERVICE; then
  echo "❌ Docker build failed!"
  exit 1
fi

# Stop and remove this container
sudo docker stop $SERVICE || true
sudo docker rm $SERVICE || true

# Restart the container with correct .env
echo "🚀 Starting container..."
if ! sudo docker-compose up -d $SERVICE; then
  echo "❌ Container startup failed!"
  exit 1
fi

# Show running containers
sudo docker ps
