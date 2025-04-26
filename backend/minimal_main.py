# Step 1: Add database connection
from fastapi import FastAPI, Depends, HTTPException, status
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
# Import auth modules
from auth import create_access_token, get_password_hash
from auth import get_current_user_dict  # Create this function
from auth import get_current_user
# Replace the simplified authentication with the real one
from auth import get_current_user, create_access_token, verify_password
# Import database module
from database import engine, SessionLocal
# Add this after importing database
import models
# Import crud operations for tasks
import crud
# Import schemas
import schemas
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Create the database tables
models.Base.metadata.create_all(bind=engine)
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/auth/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=user_credentials.email)
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }


# @app.get("/api/tasks")
# def read_tasks(
#         skip: int = 0,
#         limit: int = 100,
#         member_id: Optional[int] = None,
#         team_id: Optional[int] = None,
#         status: Optional[str] = None,
#         search: Optional[str] = None,
#         start_date: Optional[str] = None,
#         end_date: Optional[str] = None,
#         db: Session = Depends(get_db),
#         current_user: dict = Depends(get_current_user_dict)  # Use dict instead of schema
# ):
#     # Return dummy data
#     return [{"id": 1, "title": "Task 1"}]


# @app.post("/api/tasks")
# def create_task(
#         task: schemas.TaskCreate,
#         db: Session = Depends(get_db),
#         current_user: schemas.User = Depends(get_current_user)
# ):
#     return crud.create_task(db=db, task=task, user_id=current_user.id)


# Add this simplified auth function first
def get_fake_user():
    # Returns a dummy user for testing purposes
    return {"id": 1, "name": "Test User", "email": "test@example.com"}


@app.get("/api/me")
def read_current_user(current_user=Depends(get_fake_user)):
    return current_user


# Simplified get_current_user without schema validation
async def get_simplified_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        # Simple validation - in a real app, you'd verify the token properly
        payload = {"sub": "test@example.com"}
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = {"id": 1, "email": email, "name": "Test User"}
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


@app.get("/api/protected")
def read_protected(current_user=Depends(get_simplified_user)):
    return {"message": "This is protected", "user": current_user}


@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Management API"}


@app.get("/api/tasks/protected")
def read_tasks_protected(
        db: Session = Depends(get_db),
        current_user=Depends(get_simplified_user)  # Use our simplified function
):
    # Return dummy data
    return [{"id": 1, "title": "Protected Task"}]


@app.get("/api/tasks/{task_id}")
def read_task(task_id: int, db: Session = Depends(get_db)):
    task = crud.get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.post("/api/tasks")
def create_task_simple(task: dict, db: Session = Depends(get_db)):
    # This is a simplified version without proper schema validation
    # We'll replace it with the proper schema validation later
    return {"id": 1, **task}


# Add simple auth endpoints without schema validation
@app.post("/api/auth/login")
def login_simple(credentials: dict):
    # Simple in-memory authentication for testing
    if credentials.get("email") == "admin@example.com" and credentials.get("password") == "admin123":
        return {
            "token": "dummy-token",
            "token_type": "bearer",
            "user": {
                "id": 1,
                "name": "Admin User",
                "email": "admin@example.com"
            }
        }
    raise HTTPException(
        status_code=401,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )


@app.post("/api/tasks")
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task=task, user_id=1)  # Hardcoded user_id for now


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("minimal_main:app", host="0.0.0.0", port=8000, reload=True)
