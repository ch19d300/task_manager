# simplified_schemas.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


class UserBase(BaseModel):
    email: str
    name: str


class User(UserBase):
    id: int

    class Config:
        orm_mode = True
