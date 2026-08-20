"""
app/routers/auth.py
Signup, login, and profile management for care manager accounts.
Passwords are salted + PBKDF2-hashed (app/core/security.py) — never stored
or returned in plaintext.
"""
import sqlite3
from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db
from app.schemas.user import UserSignup, UserLogin, UserProfileUpdate, UserResponse
from app.crud import user as crud
from app.core.security import verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/signup", response_model=UserResponse, status_code=201,
             summary="Create a new care manager account")
def signup(body: UserSignup, db: sqlite3.Connection = Depends(get_db)):
    try:
        user = crud.create_user(
            db, full_name=body.full_name, email=body.email, password=body.password,
            organization=body.organization, role=body.role,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return UserResponse(**user)


@router.post("/login", response_model=UserResponse,
             summary="Authenticate with email + password")
def login(body: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    user = crud.authenticate(db, email=body.email, password=body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return UserResponse(**user)


@router.get("/users/{user_id}", response_model=UserResponse, summary="Get a user profile")
def get_user(user_id: str, db: sqlite3.Connection = Depends(get_db)):
    user = crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
    return UserResponse(**user)


@router.put("/users/{user_id}", response_model=UserResponse, summary="Update profile / change password")
def update_profile(user_id: str, body: UserProfileUpdate, db: sqlite3.Connection = Depends(get_db)):
    existing_row = None
    cursor = db.cursor()
    cursor.execute("SELECT * FROM USERS WHERE user_id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found.")
    existing_row = dict(row)

    # Changing email or password requires re-confirming the current password.
    if body.new_password or (body.email and body.email.lower() != existing_row["email"]):
        if not body.current_password or not verify_password(
            body.current_password, existing_row["password_salt"], existing_row["password_hash"]
        ):
            raise HTTPException(status_code=401, detail="Current password is incorrect.")

    try:
        updated = crud.update_user(db, user_id, body.model_dump(exclude_unset=True))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return UserResponse(**updated)
