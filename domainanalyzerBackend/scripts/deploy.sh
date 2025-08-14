#!/bin/bash

# Deploy script for domainanalyzer backend
set -e

echo "🚀 Starting backend deployment..."

# Ensure pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing..."
    npm install -g pnpm
fi

# Clean install
echo "🧹 Cleaning previous installation..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f bun.lockb

# Install dependencies
echo "📦 Installing dependencies with pnpm..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm prisma generate

# Run database migrations (if needed)
echo "🗄️ Running database migrations..."
pnpm prisma migrate deploy

echo "✅ Backend deployment preparation complete!" 