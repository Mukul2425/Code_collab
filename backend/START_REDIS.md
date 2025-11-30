# Quick Redis Start Guide

## Option 1: WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# Open WSL terminal
wsl

# Start Redis
sudo service redis-server start

# Verify it's running
redis-cli ping
# Should return: PONG
```

## Option 2: Docker

If you have Docker Desktop:

```bash
docker run -d -p 6379:6379 --name redis-server redis
```

## Option 3: Memurai (Windows Native)

Download and install from: https://www.memurai.com/get-memurai
- It runs as a Windows service automatically

## Option 4: Disable WebSocket Temporarily

If you just want to test file creation/editing without real-time features, you can comment out the WebSocket connection in the frontend temporarily.

---

## Verify Redis is Running

After starting Redis, test it:

```bash
python test_redis.py
```

Or:

```bash
python -c "import redis; r = redis.Redis(host='127.0.0.1', port=6379); print('✅ Redis works!' if r.ping() else '❌ Redis not working')"
```

---

## Note

- **File creation/editing works WITHOUT Redis** ✅
- **Real-time WebSocket sync requires Redis** ⚠️
- You can still use the app for single-user editing without Redis

