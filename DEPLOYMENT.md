# Deployment Guide

This guide will help you deploy your Stoqman project with the backend on Render and frontend on Vercel.

## Prerequisites

- GitHub account with your project repository
- Render account (for backend)
- Vercel account (for frontend)
- PostgreSQL database (Render provides this)

## Backend Deployment on Render

### 1. Prepare Your Backend

The backend is already configured with:
- `render.yaml` - Render deployment configuration
- `requirements.txt` - Python dependencies including gunicorn
- `build.sh` - Build script for Render
- Production-ready Django settings

### 2. Deploy to Render

1. **Push your code to GitHub** (if not already done)
2. **Connect to Render:**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository and branch

3. **Configure the service:**
   - **Name:** `stoqman-backend` (or your preferred name)
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

4. **Set Environment Variables:**
   - `DJANGO_SECRET_KEY`: Generate a secure secret key
   - `DEBUG`: `False`
   - `DATABASE_URL`: Render will provide this automatically
   - `CORS_ALLOWED_ORIGINS`: Set to your Vercel frontend URL (e.g., `https://your-app.vercel.app`)

5. **Create PostgreSQL Database:**
   - In Render dashboard, create a new PostgreSQL service
   - Connect it to your web service
   - Render will automatically set the `DATABASE_URL`

6. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy your backend
   - Note the URL (e.g., `https://stoqman-backend.onrender.com`)

### 3. Run Migrations

After deployment, you may need to run migrations:
```bash
# Connect to your Render service shell or use Render's shell feature
python manage.py migrate
python manage.py createsuperuser
```

## Frontend Deployment on Vercel

### 1. Prepare Your Frontend

The frontend is configured with:
- `vercel.json` - Vercel configuration
- Environment variable support for API URL

### 2. Deploy to Vercel

1. **Push your code to GitHub** (if not already done)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and sign up/login
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure the project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend/stoqman-frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. **Set Environment Variables:**
   - `VITE_API_BASE_URL`: Set to your Render backend URL + `/api` (e.g., `https://stoqman-backend.onrender.com/api`)

5. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Note the URL (e.g., `https://stoqman-frontend.vercel.app`)

### 3. Update CORS Settings

After getting your Vercel URL, update the `CORS_ALLOWED_ORIGINS` environment variable in Render to include your Vercel domain.

## Post-Deployment

### 1. Test Your Application

1. **Backend Health Check:** Visit `https://your-backend.onrender.com/api/health/`
2. **Frontend:** Visit your Vercel URL and test the application
3. **API Calls:** Ensure the frontend can communicate with the backend

### 2. Monitor and Maintain

- **Render:** Monitor your service logs and database usage
- **Vercel:** Check deployment status and analytics
- **Database:** Monitor PostgreSQL performance and storage

### 3. Custom Domain (Optional)

- **Backend:** Configure custom domain in Render settings
- **Frontend:** Configure custom domain in Vercel settings
- **SSL:** Both platforms provide automatic SSL certificates

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure `CORS_ALLOWED_ORIGINS` includes your Vercel domain
   - Check that the backend is accessible

2. **Database Connection:**
   - Verify `DATABASE_URL` is set correctly in Render
   - Check PostgreSQL service status

3. **Build Failures:**
   - Check build logs in both Render and Vercel
   - Ensure all dependencies are in `requirements.txt`

4. **Environment Variables:**
   - Double-check all environment variables are set
   - Ensure no typos in variable names

### Support

- **Render:** [docs.render.com](https://docs.render.com)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)
- **Django:** [docs.djangoproject.com](https://docs.djangoproject.com)

## Security Notes

- Never commit sensitive information like secret keys
- Use environment variables for all sensitive data
- Enable HTTPS (automatic on both platforms)
- Regularly update dependencies
- Monitor for security vulnerabilities
