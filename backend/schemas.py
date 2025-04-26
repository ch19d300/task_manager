# schemas.py
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any
from datetime import datetime
from models import TaskStatus, TaskPriority


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Team schemas
class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class TeamUpdate(TeamBase):
    pass


class Team(TeamBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Member schemas
class MemberBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = None
    team_id: Optional[int] = None


class MemberCreate(MemberBase):
    pass


class MemberUpdate(MemberBase):
    pass


class Member(MemberBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    team: Optional[Team] = None

    class Config:
        orm_mode = True


# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.pending
    priority: Optional[TaskPriority] = TaskPriority.medium
    start_date: datetime
    end_date: datetime
    assignee_id: int
    team_id: Optional[int] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(TaskBase):
    pass


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class Task(TaskBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    assignee: Member
    team: Optional[Team] = None

    class Config:
        orm_mode = True


# Authentication schemas
class Token(BaseModel):
    token: str
    token_type: str
    user: User
