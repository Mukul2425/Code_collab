# Real-Time Code Collaboration Platform

## Prerequisites
- Python 3.8+
- Node.js 14+
- Redis (Running on localhost:6379)

## Setup

### Backend
1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install django channels channels_redis djangorestframework djangorestframework-simplejwt django-cors-headers daphne
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend
1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features
- **User Auth**: Register and Login (JWT Authentication).
- **Projects**: Create and manage projects.
- **Files**: Create and manage files within projects.
- **Editor**: Monaco Editor integration.
- **Real-Time**: Collaborative editing using WebSockets.
