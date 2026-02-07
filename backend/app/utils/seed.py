from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password
from app.enums import UserRole


def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@subtrack.com").first()
        if not existing:
            admin = User(
                email="admin@subtrack.com",
                hashed_password=hash_password("Admin@123!"),
                full_name="System Admin",
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            print("Admin user created: admin@subtrack.com / Admin@123!")
        else:
            print("Admin already exists.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
