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


# Member schemas
class MemberBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = None


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = None


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class Member(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Optional[str] = None
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

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

    class Config:
        orm_mode = True


# Authentication schemas
class Token(BaseModel):
    token: str
    token_type: str
    user: User