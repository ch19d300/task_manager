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
                "email": user.email
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


# Task routes
@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(
        skip: int = 0,
        limit: int = 100,
        member_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    return crud.get_tasks(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        member_id=member_id,
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
    return db_task


@app.post("/api/tasks", response_model=schemas.Task)
def create_task(
        task: schemas.TaskCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
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
    return crud.update_task_status(db=db, task_id=task_id, status=status_update.status)


@app.delete("/api/tasks/{task_id}", response_model=schemas.Task)
def delete_task(
        task_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.delete_task(db=db, task_id=task_id)


# Member routes
@app.get("/api/members", response_model=List[schemas.Member])
def read_members(
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user),
        skip: int = 0,
        limit: int = 100
):
    try:
        return crud.get_members(db, user_id=current_user.id, skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get members: {str(e)}")


@app.get("/api/members/{member_id}", response_model=schemas.Member)
def read_member(
        member_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    db_member = crud.get_member(db, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    # Check if member belongs to current user
    if db_member.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this member")
    return db_member


@app.post("/api/members", response_model=schemas.Member)
def create_member(
        member: schemas.MemberCreate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    try:
        print(f"Creating member: {member.dict()}")
        return crud.create_member(db=db, member=member, user_id=current_user.id)
    except Exception as e:
        print(f"Error creating member: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to create member: {str(e)}")


@app.put("/api/members/{member_id}", response_model=schemas.Member)
def update_member(
        member_id: int,
        member: schemas.MemberUpdate,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    try:
        db_member = crud.get_member(db, member_id=member_id)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        # Check if member belongs to current user
        if db_member.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this member")
        return crud.update_member(db=db, member_id=member_id, member=member)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update member: {str(e)}")


@app.delete("/api/members/{member_id}", response_model=schemas.Member)
def delete_member(
        member_id: int,
        db: Session = Depends(get_db),
        current_user: schemas.User = Depends(get_current_user)
):
    try:
        db_member = crud.get_member(db, member_id=member_id)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        # Check if member belongs to current user
        if db_member.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this member")
        return crud.delete_member(db=db, member_id=member_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete member: {str(e)}")


# Add a simple root route
@app.get("/")
def read_root():
    return {"message": "Welcome to the Task Management API"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)