# 🌐 **Production Deployment Guide**

_Make your Internet Speed Monitor publicly accessible!_

---

## **🎯 Best Approach for Public Access**

For sharing with friends and the internet, I recommend this **3-tier cloud setup**:

1. **🗄️ Database**: Railway PostgreSQL (free tier)
2. **⚡ Backend + Collector**: Railway (free tier)
3. **🎨 Frontend**: Vercel (free tier)

**Total Cost: FREE** 🎉

---

## **Step 1: 🗄️ Database Setup (Railway)**

### **1.1 Create Railway Account**

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → "Deploy PostgreSQL"

### **1.2 Get Database URL**

```bash
# Railway will provide a connection string like:
postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
```

---

## **Step 2: ⚡ Backend + Collector (Railway)**

### **2.1 Prepare Your Code**

First, let's create production configs:

```bash
# Create production environment file
echo "NODE_ENV=production
DB_URL=your_railway_postgres_url_here
PORT=3001" > backend/.env.production
```

### **2.2 Create Railway Service**

1. **Railway Dashboard** → New Project → "Deploy from GitHub repo"
2. **Connect your repository**
3. **Root Directory**: `/backend`
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`

### **2.3 Environment Variables**

Set these in Railway:

```
NODE_ENV=production
DB_URL=postgresql://postgres:password@roundhouse.proxy.rlwy.net:12345/railway
PORT=3001
```

### **2.4 Deploy Collector as Separate Service**

1. **Same repository** → Add new service
2. **Root Directory**: `/collector`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `python speed_tracker.py`

---

## **Step 3: 🎨 Frontend (Vercel)**

### **3.1 Prepare Frontend**

Update your API URL for production:

```typescript
// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.PROD
  ? "https://your-backend.railway.app/api" // Production
  : "http://localhost:3001/api"; // Development
```

### **3.2 Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Framework**: Vite
4. **Root Directory**: `frontend`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### **3.3 Environment Variables**

Set in Vercel:

```
VITE_API_URL=https://your-backend.railway.app
```

---

## **Alternative: 🐳 Single Railway Deployment**

Deploy everything on Railway using Docker:

### **Create Production Dockerfile**

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:18-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3001
CMD ["npm", "start"]
```

### **Deploy with Railway**

1. Add Dockerfile to root
2. Railway auto-detects Docker
3. Set environment variables
4. Deploy! 🚀

---

## **Step 4: 🔧 Production Configuration**

### **4.1 Update Backend for Production**

**backend/src/config/database.js**:

```javascript
const config = {
  production: {
    dialect: "postgres",
    use_env_variable: "DB_URL",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};
```

### **4.2 Update Frontend API Service**

**frontend/src/services/api.ts**:

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://your-backend.railway.app/api"
    : "http://localhost:3001/api");
```

### **4.3 Update Collector for Production**

**collector/speed_tracker.py**:

```python
# Use production database
DB_URL = os.getenv("DB_URL", "postgresql://...")
```

---

## **Step 5: 🚀 Deployment Commands**

### **Quick Deploy Script**

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying to production..."

# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Vercel will auto-deploy frontend
# 3. Railway will auto-deploy backend & collector

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://your-app.vercel.app"
echo "⚡ Backend: https://your-backend.railway.app"
echo "📊 API: https://your-backend.railway.app/api/speed"
```

---

## **Step 6: 📊 Custom Domain (Optional)**

### **6.1 Vercel Custom Domain**

1. **Vercel Dashboard** → Your project → Settings → Domains
2. Add your domain: `speedmonitor.yourname.com`
3. Update DNS records as instructed

### **6.2 Railway Custom Domain**

1. **Railway** → Your service → Settings → Domains
2. Add custom domain for API: `api.speedmonitor.yourname.com`

---

## **🎯 Final URLs for Sharing**

After deployment, your friends can access:

- **🌐 Main App**: `https://your-app.vercel.app`
- **📊 API Health**: `https://your-backend.railway.app/health`
- **📈 Live Data**: `https://your-app.vercel.app` (auto-updates every 10 min)

---

## **💰 Cost Breakdown (FREE Tier)**

| Service     | Free Tier Limits | Perfect For               |
| ----------- | ---------------- | ------------------------- |
| **Railway** | 500 hours/month  | Backend + Collector + DB  |
| **Vercel**  | 100GB bandwidth  | Frontend hosting          |
| **Total**   | **$0/month**     | Personal + friend sharing |

### **Paid Upgrade (Optional)**

- **Railway Pro**: $5/month (unlimited hours)
- **Custom Domain**: $10-15/year
- **Total**: ~$60-80/year for unlimited usage

---

## **🔍 Monitoring & Maintenance**

### **Health Checks**

```bash
# Check if services are running
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/api/speed?range=day
```

### **View Logs**

- **Railway**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Project → Functions

### **Database Management**

```bash
# Connect to Railway PostgreSQL
railway login
railway connect postgres
```

---

## **🚀 Ready to Deploy?**

Would you like me to:

1. **🔧 Set up the production configs** for your code?
2. **📋 Walk through Railway setup** step-by-step?
3. **🌐 Configure Vercel deployment**?
4. **🐳 Create Docker setup** for easier deployment?

**Choose your preferred approach and I'll help you deploy it!** 🎯
