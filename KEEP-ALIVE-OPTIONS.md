# 🔄 Keep-Alive Solutions for Free Deployment

## Built-in Solution (Included)

✅ **Automatic Keep-Alive Service** - Already configured in `render.yaml`
- Pings your services every 10 minutes
- Prevents Render free tier from sleeping
- No additional setup required

## Alternative Free Keep-Alive Services

### 1. **UptimeRobot (Recommended External)**
- 🆓 **Free**: 50 monitors
- 📱 **Setup**: 2 minutes
- 🔗 **Website**: [uptimerobot.com](https://uptimerobot.com)

**Setup Steps:**
1. Sign up at UptimeRobot
2. Add monitors for:
   - `https://lokr-backend.onrender.com/health`
   - `https://lokr-frontend.onrender.com`
3. Set check interval to **10 minutes**
4. Done! Your services stay awake 24/7

### 2. **Better Stack (Formerly Ping Bot)**
- 🆓 **Free**: 10 monitors
- 📧 **Bonus**: Email alerts when down
- 🔗 **Website**: [betterstack.com](https://betterstack.com)

### 3. **Cron-Job.org**
- 🆓 **Free**: Unlimited HTTP requests
- ⏰ **Setup**: Simple cron scheduling
- 🔗 **Website**: [cron-job.org](https://cron-job.org)

**Cron Setup:**
```
*/10 * * * * curl -s https://lokr-backend.onrender.com/health
*/10 * * * * curl -s https://lokr-frontend.onrender.com
```

### 4. **GitHub Actions (Advanced)**
- 🆓 **Free**: 2000 minutes/month
- 🔄 **Auto**: Runs from your repo
- ⚡ **Setup**: Add workflow file

**Create `.github/workflows/keep-alive.yml`:**
```yaml
name: Keep Alive
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: curl -s https://lokr-backend.onrender.com/health
      - name: Ping Frontend
        run: curl -s https://lokr-frontend.onrender.com
```

## 📊 Comparison

| Service | Free Monitors | Setup Time | Reliability |
|---------|---------------|------------|-------------|
| Built-in (Included) | ∞ | 0 min | ⭐⭐⭐⭐ |
| UptimeRobot | 50 | 2 min | ⭐⭐⭐⭐⭐ |
| Better Stack | 10 | 3 min | ⭐⭐⭐⭐⭐ |
| Cron-Job.org | ∞ | 5 min | ⭐⭐⭐⭐ |
| GitHub Actions | ∞ | 10 min | ⭐⭐⭐ |

## 🎯 Recommendation

**Use the built-in solution** - it's already configured and works automatically.

**For extra reliability**, add UptimeRobot as a backup:
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add your service URLs
3. Set 10-minute intervals
4. Get email alerts if anything goes down

## ⚡ Quick Test

After deployment, test your keep-alive:

```bash
# Check if services respond
curl https://lokr-backend.onrender.com/health
curl https://lokr-frontend.onrender.com

# Should return success responses
```

## 💡 Pro Tips

- **Don't use intervals shorter than 10 minutes** (wastes resources)
- **Monitor both frontend and backend** for full coverage
- **UptimeRobot sends alerts** if your app actually goes down
- **Built-in solution is automatic** - no external dependencies