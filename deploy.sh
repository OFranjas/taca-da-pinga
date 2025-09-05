#!/bin/bash

# Aborta se der erro
set -e

echo "🛠️ Building React app..."
npm run build

echo "🚀 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo "✅ Deploy complete!"
