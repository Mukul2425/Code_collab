"""
Simple script to test Redis connection.
Run: python test_redis.py
"""
import redis
import sys

def test_redis():
    """Test if Redis is running and accessible."""
    try:
        print("Testing Redis connection...")
        r = redis.Redis(host='127.0.0.1', port=6379, decode_responses=True, socket_connect_timeout=2)
        response = r.ping()
        
        if response:
            print("✅ Redis is running and accessible!")
            info = r.info()
            print(f"   Redis version: {info.get('redis_version', 'unknown')}")
            print(f"   Connected to: 127.0.0.1:6379")
            return True
        else:
            print("❌ Redis is not responding")
            return False
            
    except redis.ConnectionError as e:
        print("❌ Cannot connect to Redis server")
        print(f"   Error: {e}")
        print("\n   Redis is not running or not installed.")
        print("   Please check REDIS_SETUP.md for installation instructions.")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_redis()
    sys.exit(0 if success else 1)


