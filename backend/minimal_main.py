# minimal_main.py with registration endpoint
from fastapi import FastAPI, Depends, HTTPException, status
from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
# Import auth modules
from auth import create_access_token, get_password_hash
from auth import get_current_user, verify_password
# Import database module
from database import engine, SessionLocal
# Add this after importing database
import models
# Import crud operations
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


# Authentication routes
@app.post("/api/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)


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


# Simple routes for testing
@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Management API"}


@app.get("/api/me")
def read_current_user(current_user=Depends(get_current_user)):
    return current_user


# Task routes
@app.get("/api/tasks")
def read_tasks(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    return crud.get_tasks(db, skip=skip, limit=limit)


@app.get("/api/tasks/{task_id}")
def read_task(
        task_id: int,
        db: Session = Depends(get_db),
        current_user=Depends(get_current_user)
):
    task = crud.get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("minimal_main:app", host="0.0.0.0", port=8000, reload=True)