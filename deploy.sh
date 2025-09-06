#!/bin/bash

# Aborta se der erro
set -e

echo "🛠️ Building app (Vite)..."
yarn build

echo "🚀 Deploying to Firebase Hosting (dist)..."
firebase deploy --only hosting

echo "✅ Deploy complete!"
