# main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import models
import schemas
import crud
from database import engine, SessionLocal
from auth import create_access_token, get_current_user, verify_password, get_password_hash
from datetime import datetime

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Management API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React frontend URL
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


# Function to check if a user is an admin
def check_admin(current_user: schemas.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation requires admin privileges"
        )
    return current_user


# Authentication routes

# Admin-only registration endpoint
@app.post("/api/auth/admin/register", response_model=schemas.User)
def register_user_by_admin(
        user: schemas.UserCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(check_admin)  # Only admins can access this endpoint
):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)


@app.post("/api/auth/login")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        print(f"Login attempt for email: {user_credentials.email}")
        user = crud.get_user_by_email(db, email=user_credentials.email)

        if not user:
            print(f"User not found with email: {user_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(user_credentials.password, user.hashed_password):
            print(f"Invalid password for user: {user_credentials.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token with user's email as the subject
        access_token = create_access_token(
            data={"sub": user.email}
        )

        print(f"Login successful for: {user.email}, token generated")

        return {
            "token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "is_admin": user.is_admin  # Include admin status
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error during login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login error: {str(e)}",
        )


# User routes (formerly Member routes)
@app.get("/api/users", response_model=List[schemas.User])
def read_users(
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(check_admin),  # Only admins can access this endpoint
        skip: int = 0,
        limit: int = 100
):
    try:
        return crud.get_users(db, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")


@app.get("/api/users/{user_id}", response_model=schemas.User)
def read_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    # Check if user is admin or accessing their own record
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this user")

    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.put("/api/users/{user_id}", response_model=schemas.User)
def update_user(
        user_id: int,
        user: schemas.UserUpdate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    try:
        # Only admins can update other users
        if not current_user.is_admin and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this user")

        db_user = crud.get_user(db, user_id=user_id)
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")

        # Regular users cannot change admin status
        if not current_user.is_admin and 'is_admin' in user.dict(exclude_unset=True):
            raise HTTPException(status_code=403, detail="Not authorized to change admin status")

        return crud.update_user(db=db, user_id=user_id, user=user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update user: {str(e)}")


@app.delete("/api/users/{user_id}", response_model=schemas.User)
def delete_user(
        user_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(check_admin)  # Only admins can delete users
):
    try:
        # Prevent self-deletion for safety
        if current_user.id == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        db_user = crud.get_user(db, user_id=user_id)
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")

        return crud.delete_user(db=db, user_id=user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete user: {str(e)}")


# Task routes
@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(
        skip: int = 0,
        limit: int = 100,
        assignee_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    # If admin, can see all tasks or filter by assignee
    if current_user.is_admin:
        return crud.get_tasks_by_admin(
            db,
            skip=skip,
            limit=limit,
            assignee_id=assignee_id,
            status=status,
            search=search,
            start_date=start_date,
            end_date=end_date
        )
    else:
        # Regular users can only see tasks assigned to them
        return crud.get_tasks_by_assignee(
            db,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
            status=status,
            search=search,
            start_date=start_date,
            end_date=end_date
        )


@app.get("/api/tasks/{task_id}", response_model=schemas.Task)
def read_task(
        task_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if user is admin or assignee
    if not current_user.is_admin and db_task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this task")

    return db_task


@app.post("/api/tasks", response_model=schemas.Task)
def create_task(
        task: schemas.TaskCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(check_admin)  # Only admins can create tasks
):
    return crud.create_task(db=db, task=task, user_id=current_user.id)


@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(
        task_id: int,
        task: schemas.TaskUpdate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if user is admin or assignee
    if not current_user.is_admin and db_task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    # Regular users can only update status
    if not current_user.is_admin and len(task.dict(exclude_unset=True)) > 1:
        raise HTTPException(status_code=403, detail="Not authorized to update task details other than status")

    return crud.update_task(db=db, task_id=task_id, task=task)


@app.patch("/api/tasks/{task_id}/status", response_model=schemas.Task)
def update_task_status(
        task_id: int,
        status_update: schemas.TaskStatusUpdate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if user is admin or assignee
    if not current_user.is_admin and db_task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")

    return crud.update_task_status(db=db, task_id=task_id, status=status_update.status)


@app.delete("/api/tasks/{task_id}", response_model=schemas.Task)
def delete_task(
        task_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(check_admin)  # Only admins can delete tasks
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.delete_task(db=db, task_id=task_id)


# Add a simple root route
@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Management API"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)