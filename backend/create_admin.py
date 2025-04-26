# Add this to main.py temporarily or run as a separate script
from database import SessionLocal
from models import User
from auth import get_password_hash


def create_initial_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if admin:
            print("Admin user already exists")
            return

        # Create admin user
        admin_user = User(
            name="Administrator",
            email="admin@gmail.com",
            hashed_password=get_password_hash("admin123"),  # Replace with a secure password
            is_admin=True
        )
        db.add(admin_user)
        db.commit()
        print("Initial admin user created successfully")
    except Exception as e:
        db.rollback()
        print(f"Error creating admin user: {e}")
    finally:
        db.close()


# Call this function once when setting up the application
if __name__ == "__main__":
    create_initial_admin()