#!/bin/bash
# deploy-script.sh

# Set up environment
export APP_PORT=3000
export REDIS_PORT=6380

# Deploy directory
DEPLOY_DIR=~/interview-app

# Create directory if it doesn't exist
mkdir -p $DEPLOY_DIR

# Copy files
cp docker-compose.yml $DEPLOY_DIR/
cp Dockerfile $DEPLOY_DIR/

# Copy application files
cp -r . $DEPLOY_DIR

# Navigate to deploy directory
cd $DEPLOY_DIR

# Down and remove any existing containers
docker-compose down

# Build and start containers
docker-compose up -d

echo "Deployment completed successfully!"
