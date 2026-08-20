"""
app/schemas/user.py
Pydantic v2 models for USER signup / login / profile.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserSignup(BaseModel):
    full_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=6)
    organization: Optional[str] = None
    role: Optional[str] = "Care Manager"


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6)
    current_password: Optional[str] = None


class UserResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    organization: Optional[str] = None
    role: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}
