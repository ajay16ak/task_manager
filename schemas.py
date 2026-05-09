from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    priority: Optional[Literal["Low", "Medium", "High"]] = "Medium"
    due_date: Optional[datetime] = None
    category: Optional[str] = "General"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[Literal["Low", "Medium", "High"]] = None
    due_date: Optional[datetime] = None
    category: Optional[str] = None

class Task(TaskBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
