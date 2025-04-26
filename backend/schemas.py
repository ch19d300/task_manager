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
    is_admin: Optional[bool] = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_admin: Optional[bool] = None


class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
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


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    assignee_id: Optional[int] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class Task(TaskBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    assignee: User

    class Config:
        orm_mode = True


# Authentication schemas
class Token(BaseModel):
    token: str
    token_type: str
    user: User