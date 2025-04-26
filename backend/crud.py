# crud.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import models, schemas
from auth import get_password_hash
from datetime import datetime
from typing import Optional


# User CRUD operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        is_admin=user.is_admin  # Set admin status from the schema
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    try:
        db_user = get_user(db, user_id)

        # Only include fields that were actually provided (exclude_unset=True)
        update_data = user.dict(exclude_unset=True)
        print(f"Updating user with data: {update_data}")

        for key, value in update_data.items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Error updating user: {e}")
        raise


def delete_user(db: Session, user_id: int):
    try:
        db_user = get_user(db, user_id)
        db.delete(db_user)
        db.commit()
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Error deleting user: {e}")
        raise


# Task CRUD operations
def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()


# For admin users to view all tasks with filtering
def get_tasks_by_admin(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        assignee_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
):
    query = db.query(models.Task)

    # Apply filters
    if assignee_id:
        query = query.filter(models.Task.assignee_id == assignee_id)

    if status:
        query = query.filter(models.Task.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Task.title.ilike(search_term),
                models.Task.description.ilike(search_term)
            )
        )

    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(
            or_(
                and_(
                    models.Task.start_date >= start,
                    models.Task.start_date <= end
                ),
                and_(
                    models.Task.end_date >= start,
                    models.Task.end_date <= end
                ),
                and_(
                    models.Task.start_date <= start,
                    models.Task.end_date >= end
                )
            )
        )

    return query.offset(skip).limit(limit).all()


# For regular users to view only their assigned tasks
def get_tasks_by_assignee(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
):
    # Only show tasks assigned to this user
    query = db.query(models.Task).filter(models.Task.assignee_id == user_id)

    # Apply filters
    if status:
        query = query.filter(models.Task.status == status)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Task.title.ilike(search_term),
                models.Task.description.ilike(search_term)
            )
        )

    if start_date and end_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(
            or_(
                and_(
                    models.Task.start_date >= start,
                    models.Task.start_date <= end
                ),
                and_(
                    models.Task.end_date >= start,
                    models.Task.end_date <= end
                ),
                and_(
                    models.Task.start_date <= start,
                    models.Task.end_date >= end
                )
            )
        )

    return query.offset(skip).limit(limit).all()


def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
    try:
        db_task = models.Task(**task.dict(), creator_id=user_id)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error creating task: {e}")
        raise


def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
    try:
        db_task = get_task(db, task_id)

        # Only update fields that were provided
        update_data = task.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_task, key, value)

        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error updating task: {e}")
        raise


def update_task_status(db: Session, task_id: int, status: str):
    try:
        db_task = get_task(db, task_id)
        db_task.status = status
        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error updating task status: {e}")
        raise


def delete_task(db: Session, task_id: int):
    try:
        db_task = get_task(db, task_id)
        db.delete(db_task)
        db.commit()
        return db_task
    except Exception as e:
        db.rollback()
        print(f"Error deleting task: {e}")
        raise