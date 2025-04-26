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


# def create_user(db: Session, user: schemas.UserCreate):
#     hashed_password = get_password_hash(user.password)
#     db_user = models.User(
#         email=user.email,
#         name=user.name,
#         hashed_password=hashed_password
#     )
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
#     return db_user


# Team CRUD operations
def get_teams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Team).offset(skip).limit(limit).all()


def get_team(db: Session, team_id: int):
    return db.query(models.Team).filter(models.Team.id == team_id).first()


# def create_team(db: Session, team: schemas.TeamCreate):
#     db_team = models.Team(**team.dict())
#     db.add(db_team)
#     db.commit()
#     db.refresh(db_team)
#     return db_team


# def update_team(db: Session, team_id: int, team: schemas.TeamUpdate):
#     db_team = get_team(db, team_id)
#     for key, value in team.dict().items():
#         setattr(db_team, key, value)
#     db.commit()
#     db.refresh(db_team)
#     return db_team


def delete_team(db: Session, team_id: int):
    db_team = get_team(db, team_id)
    db.delete(db_team)
    db.commit()
    return db_team


# Member CRUD operations
def get_members(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Member).offset(skip).limit(limit).all()


def get_member(db: Session, member_id: int):
    return db.query(models.Member).filter(models.Member.id == member_id).first()


def create_member(db: Session, member: schemas.MemberCreate):
    db_member = models.Member(**member.dict())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


# def update_member(db: Session, member_id: int, member: schemas.MemberUpdate):
#     db_member = get_member(db, member_id)
#     for key, value in member.dict().items():
#         setattr(db_member, key, value)
#     db.commit()
#     db.refresh(db_member)
#     return db_member


def delete_member(db: Session, member_id: int):
    db_member = get_member(db, member_id)
    db.delete(db_member)
    db.commit()
    return db_member


# Task CRUD operations
def get_tasks(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        member_id: Optional[int] = None,
        team_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
):
    query = db.query(models.Task)

    # Apply filters
    if member_id:
        query = query.filter(models.Task.assignee_id == member_id)

    if team_id:
        query = query.filter(models.Task.team_id == team_id)

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


def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()


# def create_task(db: Session, task: schemas.TaskCreate, user_id: int):
#     db_task = models.Task(**task.dict(), creator_id=user_id)
#     db.add(db_task)
#     db.commit()
#     db.refresh(db_task)
#     return db_task


# def update_task(db: Session, task_id: int, task: schemas.TaskUpdate):
#     db_task = get_task(db, task_id)
#     for key, value in task.dict().items():
#         setattr(db_task, key, value)
#     db.commit()
#     db.refresh(db_task)
#     return db_task


def update_task_status(db: Session, task_id: int, status: str):
    db_task = get_task(db, task_id)
    db_task.status = status
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    db.delete(db_task)
    db.commit()
    return db_task
