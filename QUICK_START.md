# 🚀 Quick Start Deployment

## Prerequisites
- GitHub account
- Render account (free tier available)
- Vercel account (free tier available)

## 1. Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 2. Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `stoqman-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
5. Set Environment Variables:
   - `DJANGO_SECRET_KEY`: Generate a secure key
   - `DEBUG`: `False`
   - `CORS_ALLOWED_ORIGINS`: Leave empty for now
6. Create PostgreSQL database (Render will auto-connect)
7. Deploy and note the URL

## 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend/stoqman-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com/api`
6. Deploy and note the URL

## 4. Update CORS Settings

1. Go back to Render dashboard
2. Update `CORS_ALLOWED_ORIGINS` to include your Vercel URL
3. Redeploy if needed

## 5. Test Your Deployment

- Backend: Visit `https://your-backend.onrender.com/api/health/`
- Frontend: Visit your Vercel URL
- Test login and basic functionality

## 🎯 That's It!

Your Stoqman application is now deployed and accessible from anywhere!

## 📚 Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Run `./deploy.sh` for deployment checks
- Check platform documentation for troubleshooting
