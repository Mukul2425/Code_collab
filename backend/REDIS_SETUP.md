# Redis Setup Guide for Windows

## How to Check if Redis is Running

### Method 1: Using Python (Recommended)
```bash
python -c "import redis; r = redis.Redis(host='127.0.0.1', port=6379); print('Redis is running!' if r.ping() else 'Redis is not running')"
```

**Expected Output:**
- ✅ `Redis is running!` - Redis is working
- ❌ `ConnectionError` - Redis is not running or not installed

### Method 2: Using redis-cli (if installed)
```bash
redis-cli ping
```

**Expected Output:**
- ✅ `PONG` - Redis is running
- ❌ `Could not connect` - Redis is not running

### Method 3: Check Windows Services
1. Press `Win + R`, type `services.msc`, press Enter
2. Look for "Redis" in the services list
3. Check if it's running

### Method 4: Check if Port 6379 is Listening
```powershell
netstat -an | findstr 6379
```

If you see `127.0.0.1:6379` or `0.0.0.0:6379` in LISTENING state, Redis is running.

---

## Installing Redis on Windows

### Option 1: Using WSL (Windows Subsystem for Linux) - Recommended

1. **Install WSL** (if not already installed):
   ```powershell
   wsl --install
   ```
   Restart your computer after installation.

2. **Install Redis in WSL**:
   ```bash
   wsl
   sudo apt update
   sudo apt install redis-server
   ```

3. **Start Redis in WSL**:
   ```bash
   sudo service redis-server start
   ```

4. **Test Redis**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

5. **Make Redis start automatically**:
   ```bash
   sudo systemctl enable redis-server
   ```

### Option 2: Using Memurai (Redis-compatible for Windows)

1. **Download Memurai**:
   - Visit: https://www.memurai.com/get-memurai
   - Download the free developer edition

2. **Install Memurai**:
   - Run the installer
   - It will install as a Windows service

3. **Start Memurai**:
   - It should start automatically as a service
   - Or use Services app to start it manually

4. **Test Connection**:
   ```bash
   python -c "import redis; r = redis.Redis(host='127.0.0.1', port=6379); print('Connected!' if r.ping() else 'Not connected')"
   ```

### Option 3: Using Docker (if you have Docker Desktop)

1. **Pull Redis image**:
   ```bash
   docker pull redis
   ```

2. **Run Redis container**:
   ```bash
   docker run -d -p 6379:6379 --name redis-server redis
   ```

3. **Test Connection**:
   ```bash
   python -c "import redis; r = redis.Redis(host='127.0.0.1', port=6379); print('Connected!' if r.ping() else 'Not connected')"
   ```

### Option 4: Using Chocolatey (Package Manager)

1. **Install Chocolatey** (if not installed):
   - Visit: https://chocolatey.org/install
   - Follow installation instructions

2. **Install Redis**:
   ```powershell
   choco install redis-64
   ```

3. **Start Redis**:
   ```powershell
   redis-server
   ```

---

## Quick Test Script

Create a file `test_redis.py`:

```python
import redis
import sys

try:
    r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True)
    response = r.ping()
    if response:
        print("✅ Redis is running and accessible!")
        print(f"Redis version: {r.info()['redis_version']}")
        sys.exit(0)
    else:
        print("❌ Redis is not responding")
        sys.exit(1)
except redis.ConnectionError:
    print("❌ Cannot connect to Redis server")
    print("   Make sure Redis is installed and running on 127.0.0.1:6379")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
```

Run it:
```bash
python test_redis.py
```

---

## Starting Redis (After Installation)

### If using WSL:
```bash
wsl
sudo service redis-server start
```

### If using Memurai:
- It runs as a Windows service automatically
- Or use Services app to start/stop

### If using Docker:
```bash
docker start redis-server
```

### If using Chocolatey:
```powershell
redis-server
```

---

## Troubleshooting

### Issue: "Connection refused" error
**Solution:** Redis is not running. Start Redis using one of the methods above.

### Issue: "redis-cli not found"
**Solution:** This is normal on Windows. Use Python to test Redis instead.

### Issue: Port 6379 already in use
**Solution:** Another application is using port 6379. Either:
- Stop the other application
- Configure Redis to use a different port
- Find and stop the conflicting Redis instance

### Issue: Django Channels can't connect to Redis
**Solution:** 
1. Verify Redis is running (use test script above)
2. Check your `.env` file has correct Redis settings:
   ```
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```
3. Make sure `channels-redis` is installed:
   ```bash
   pip install channels-redis
   ```

---

## Recommended Setup for Development

**For Windows users, I recommend using WSL with Redis** because:
- ✅ Most compatible with Django Channels
- ✅ Easy to manage
- ✅ Free and open source
- ✅ Works exactly like Linux production environment

---

## Next Steps

Once Redis is running:

1. **Test the connection:**
   ```bash
   python -c "import redis; r = redis.Redis(host='127.0.0.1', port=6379); print('✅ Redis works!' if r.ping() else '❌ Redis not working')"
   ```

2. **Run Django migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Start Django server:**
   ```bash
   python manage.py runserver
   # Or with Daphne for WebSockets:
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

Your Django Channels WebSocket functionality will now work! 🎉


