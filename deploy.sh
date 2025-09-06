#!/bin/bash

# Aborta se der erro
set -e

echo "🛠️ Building app (Vite)..."
npm run build

echo "🚀 Deploying to Firebase Hosting (dist)..."
firebase deploy --only hosting

echo "✅ Deploy complete!"
