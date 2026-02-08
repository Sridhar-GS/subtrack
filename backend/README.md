# SubTrack Backend

FastAPI backend for the SubTrack Subscription Management System.

## 📋 Requirements

- Python 3.10 or higher
- PostgreSQL (or adjust connection string for SQLite)

## 🛠️ Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration:**
   Create a `.env` file in the `backend` directory (if not exists) with the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/subtrack
   SECRET_KEY=your_super_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   FIREBASE_CREDENTIALS_PATH=firebase-service-account.json
   FIREBASE_API_KEY=your_firebase_api_key
   ```

4. **Database Migration:**
   If using Alembic for migrations:
   ```bash
   alembic upgrade head
   ```

## 🚀 Running the Server

Start the application with live reload:
```bash
python -m uvicorn main:app --reload
```
The API will be available at [http://localhost:8000](http://localhost:8000).
Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs).

## 🌱 Seeding Data

The application automatically checks for an admin user on startup. The `seed_admin()` function in `app/utils/seed.py` creates a default admin if one doesn't exist.

## 🧪 Testing

To run tests (if available):
```bash
pytest
```
