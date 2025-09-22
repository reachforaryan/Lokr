# 🚀 Free Deployment Guide for Lokr

## Option 1: Render (Recommended - Easiest Free Option)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "🚀 Ready for deployment"
git push origin main
```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Blueprint"
4. Connect your Lokr repository
5. Render will automatically use `render.yaml` configuration
6. Click "Apply" and wait for deployment

**Free Tier Includes:**
- ✅ 750 hours/month (enough for demo/testing)
- ✅ Free PostgreSQL database
- ✅ Free Redis instance
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ **Keep-alive service included** - prevents sleeping!
- ❌ Apps sleep after 15 minutes (but keep-alive prevents this)

---

## Option 2: Railway (5$ Free Credits Monthly)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy
```bash
railway login
railway link
railway up
```

**Free Credits:**
- ✅ $5/month free credits
- ✅ No sleep limitations
- ✅ Full Docker Compose support
- ❌ Credits typically last ~1 week

---

## Option 3: Fly.io (Free Allowances)

### Step 1: Install Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Deploy
```bash
fly auth login
fly launch
fly deploy
```

**Free Allowances:**
- ✅ 3 shared VMs
- ✅ PostgreSQL free tier
- ✅ No sleep limitations
- ❌ More complex setup

---

## Option 4: Vercel + PlanetScale (Split Architecture)

### Frontend (Vercel - Free)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Backend (Railway/Render - Free)
Deploy backend separately and update frontend environment variables.

**Pros:** Best performance, separate scaling
**Cons:** More complex, requires CORS configuration

---

## 🎯 Recommended Path: Render

1. **Push your code to GitHub**
2. **Go to render.com and sign up**
3. **Create new Blueprint deployment**
4. **Connect your repository**
5. **Deploy automatically with render.yaml**

Your app will be live at: `https://lokr-frontend.onrender.com`

## 🔧 Post-Deployment Configuration

After deployment, you may need to:

1. **Update CORS settings** in backend for your domain
2. **Configure OAuth redirects** for your production URL
3. **Run database migrations** (usually automatic)
4. **Test file upload/download** functionality

## 📱 Mobile-Friendly

The deployed app will be fully responsive and work on mobile devices!

## 💰 Cost Comparison

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| Render | 750hrs/month | Apps sleep after 15min |
| Railway | $5 credits | Credits run out |
| Fly.io | 3 VMs | Complex setup |
| Vercel | Unlimited | Frontend only |

**Winner for Free:** Render - easiest setup with good free tier.