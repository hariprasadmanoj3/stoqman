#!/bin/bash

echo "🚀 Stoqman Deployment Helper"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    git status --short
    echo ""
    echo "Run: git add . && git commit -m 'Update before deployment'"
    exit 1
fi

echo "✅ Git repository is clean"

# Check if backend requirements are ready
if [ -f "backend/requirements.txt" ]; then
    echo "✅ Backend requirements.txt found"
else
    echo "❌ Backend requirements.txt not found"
    exit 1
fi

# Check if render.yaml exists
if [ -f "backend/render.yaml" ]; then
    echo "✅ Render configuration found"
else
    echo "❌ Render configuration not found"
    exit 1
fi

# Check if frontend vercel.json exists
if [ -f "frontend/stoqman-frontend/vercel.json" ]; then
    echo "✅ Vercel configuration found"
else
    echo "❌ Vercel configuration not found"
    exit 1
fi

echo ""
echo "🎯 Next Steps:"
echo "==============="
echo ""
echo "1. Push your code to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Deploy Backend to Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repo"
echo "   - Set environment variables (see DEPLOYMENT.md)"
echo ""
echo "3. Deploy Frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import your GitHub repo"
echo "   - Set VITE_API_BASE_URL environment variable"
echo ""
echo "4. Update CORS settings in Render after getting Vercel URL"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "Good luck with your deployment! 🚀"
