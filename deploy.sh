#!/bin/bash

# Aborta se der erro
set -e

echo "🛠️ Building app (Vite)..."
yarn build

echo "🚀 Deploying to production Firebase Hosting (dist)..."
firebase deploy --only hosting:taca-da-pinga

echo "✅ Deploy complete!"
