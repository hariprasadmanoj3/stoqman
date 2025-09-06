#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting StoqMan build process..."

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗄️  Running database migrations..."
python manage.py migrate

echo "📁 Collecting static files..."
python manage.py collectstatic --no-input

echo "✅ Build completed successfully!"
