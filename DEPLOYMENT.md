# 🚀 **Deployment & Automation Guide**

## **🤖 Current Status**

Right now, your speed collector **only runs when you manually start it**. Here are your options for continuous monitoring:

---

## **Option 1: 🖥️ Local Background Service (Recommended for Development)**

### **Windows (using Task Scheduler)**

1. **Create a batch file** `start_collector.bat`:

```batch
@echo off
cd /d "D:\vsc\react\internet_speed_tracker\collector"
python speed_tracker.py
```

2. **Open Task Scheduler** → Create Basic Task:
   - **Name**: "Internet Speed Collector"
   - **Trigger**: "When the computer starts"
   - **Action**: Start your batch file
   - **Settings**: ✅ "Run whether user is logged on or not"

### **macOS/Linux (using systemd)**

1. **Create service file** `/etc/systemd/system/speed-collector.service`:

```ini
[Unit]
Description=Internet Speed Collector
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/internet_speed_tracker/collector
ExecStart=/usr/bin/python3 speed_tracker.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

2. **Enable and start**:

```bash
sudo systemctl enable speed-collector.service
sudo systemctl start speed-collector.service
```

---

## **Option 2: 🐳 Docker (Best for Production)**

Your project already has Docker Compose configured! Just run:

```bash
# Start all services (collector, backend, frontend, database)
docker-compose up -d

# Check collector logs
docker-compose logs -f collector

# Stop all services
docker-compose down
```

**Benefits:**

- ✅ Runs independently of your development environment
- ✅ Automatic restart on failure
- ✅ Easy to deploy anywhere
- ✅ Isolated environment

---

## **Option 3: ☁️ Cloud Deployment (Production Ready)**

### **Backend + Collector on Railway/Render**

1. **Deploy Backend**:

   - Push to GitHub
   - Connect Railway/Render to your repo
   - Set environment variables
   - Deploy Node.js app

2. **Deploy Collector as Separate Service**:
   - Same repo, different service
   - Set `Dockerfile` for Python collector
   - Configure PostgreSQL database

### **Frontend on Vercel/Netlify**

1. **Build Settings**:
   - **Build Command**: `cd frontend && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment**: `VITE_API_URL=https://your-backend.railway.app`

---

## **Option 4: 🔄 GitHub Actions (Free Automation)**

Create `.github/workflows/speed-collector.yml`:

```yaml
name: Speed Collector
on:
  schedule:
    - cron: "*/10 * * * *" # Every 10 minutes
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      - name: Install dependencies
        run: |
          cd collector
          pip install -r requirements.txt
      - name: Run speed test
        env:
          DB_URL: ${{ secrets.DATABASE_URL }}
        run: |
          cd collector
          python -c "
          import asyncio
          from speed_tracker import Collector
          async def single_run():
              collector = Collector()
              await collector._run_once()
              collector.repo.close()
          asyncio.run(single_run())
          "
```

---

## **🎯 Quick Test Current Setup**

Let's test your collector right now:

```bash
# 1. Start collector in background
cd collector
python speed_tracker.py &

# 2. Check if it's working
ps aux | grep speed_tracker

# 3. Check database after a few minutes
cd ../backend
node -e "
const { SpeedTest } = require('./src/models/speedtest.model.js');
SpeedTest.findAll({ limit: 5, order: [['timestamp', 'DESC']] })
  .then(tests => console.log('Recent tests:', tests.length))
"
```

---

## **📊 Monitoring Your Collector**

### **Check if it's running**:

```bash
# Windows
tasklist | findstr python

# macOS/Linux
ps aux | grep speed_tracker
```

### **View logs**:

```bash
# If running in Docker
docker-compose logs -f collector

# If running locally, redirect output
python speed_tracker.py > collector.log 2>&1 &
tail -f collector.log
```

### **Database verification**:

```bash
cd backend
node -e "
const { SpeedTest } = require('./src/models/speedtest.model.js');
SpeedTest.count().then(count => console.log(\`Total tests: \${count}\`));
"
```

---

## **🎯 Recommendation**

For your current setup, I recommend:

1. **Development**: Use Docker Compose (`docker-compose up -d`)
2. **Production**: Deploy to Railway/Render + Vercel
3. **Always-on monitoring**: Cloud deployment with proper database

Would you like me to help you set up any of these options? 🚀
