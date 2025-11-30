# Backend Setup Guide

## Phase 1 & 2 Setup Instructions

### Prerequisites
- Python 3.8+
- Redis server
- pip (Python package manager)

### Installation Steps

1. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Up Environment Variables**
   - Copy `.env.example` to `.env` (if it exists) or create a `.env` file in the `backend/` directory
   - Add the following variables:
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ENVIRONMENT=dev
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

3. **Start Redis Server**
   - On Windows: Download Redis from https://github.com/microsoftarchive/redis/releases or use WSL
   - On Linux/Mac: `redis-server` or `brew install redis && redis-server`
   - Verify Redis is running: `redis-cli ping` (should return `PONG`)

4. **Run Database Migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create Superuser (Optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run Development Server**
   ```bash
   python manage.py runserver
   ```
   Or with Daphne (for WebSocket support):
   ```bash
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

### API Endpoints

#### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (JWT tokens)
- `POST /api/auth/token/refresh/` - Refresh JWT token

#### User Profile
- `GET /api/auth/me/` - Get current user info
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/change-password/` - Change password

### Testing the Setup

1. **Test Registration**
   ```bash
   curl -X POST http://localhost:8000/api/auth/register/ \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'
   ```

2. **Test Login**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpass123"}'
   ```

3. **Test Profile (with token)**
   ```bash
   curl -X GET http://localhost:8000/api/auth/me/ \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

### Project Structure

```
backend/
├── config/           # Django project configuration
│   ├── settings/     # Settings module (dev/prod separation)
│   ├── asgi.py       # ASGI configuration for WebSockets
│   └── urls.py       # Main URL routing
├── users/            # User authentication & profiles
├── projects/         # Project management
├── files/            # File management
├── realtime/         # WebSocket consumers
└── versions/         # Version history
```

### Notes

- The project uses JWT authentication (djangorestframework-simplejwt)
- User profiles are automatically created when a user registers
- Redis is required for WebSocket functionality (Django Channels)
- For production, set `ENVIRONMENT=prod` in `.env` and configure PostgreSQL


