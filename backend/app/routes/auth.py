import threading

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import JWTError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.config import settings
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.enums import UserRole
from app.schemas.auth import (
    SignupRequest, LoginRequest, LoginResponse, RefreshRequest,
    TokenResponse, ForgotPasswordRequest, UserOut,
    GoogleAuthRequest, FirebaseAuthRequest,
)
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token,
)
from app.services.firebase_service import (
    verify_firebase_token, ensure_firebase_user, ensure_firebase_user_with_password,
    verify_firebase_password,
)
from app.utils.password import validate_password

router = APIRouter()


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    validate_password(data.password)
    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        company=data.company,
        role=UserRole.PORTAL,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=LoginResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.oauth_provider and not user.hashed_password:
        raise HTTPException(
            status_code=401,
            detail="This account uses Google sign-in. Please use 'Continue with Google'.",
        )

    local_ok = verify_password(data.password, user.hashed_password)

    if not local_ok:
        # Fallback: password may have been reset via Firebase
        firebase_ok = verify_firebase_password(data.email, data.password)
        if firebase_ok:
            # Sync new password to local DB
            user.hashed_password = hash_password(data.password)
            db.commit()
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Sync password to Firebase Auth in background (non-blocking)
    threading.Thread(
        target=ensure_firebase_user_with_password,
        args=(data.email, data.password),
        daemon=True,
    ).start()

    token_data = {"sub": str(user.id), "role": user.role.value}
    return LoginResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserOut.model_validate(user),
    )


@router.post("/firebase", response_model=LoginResponse)
def firebase_auth(data: FirebaseAuthRequest, db: Session = Depends(get_db)):
    """Verify a Firebase ID token and find or create the user."""
    try:
        decoded = verify_firebase_token(data.token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    email = decoded.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Firebase account has no email")

    name = decoded.get("name", email.split("@")[0])
    provider = decoded.get("firebase", {}).get("sign_in_provider", "firebase")

    user = db.query(User).filter(User.email == email).first()

    if user:
        # Link provider if not already set
        if not user.oauth_provider:
            user.oauth_provider = provider
            db.commit()
            db.refresh(user)
    else:
        # Create new user from Firebase token
        user = User(
            email=email,
            full_name=data.full_name or name,
            phone=data.phone,
            company=data.company,
            oauth_provider=provider,
            role=UserRole.PORTAL,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return LoginResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserOut.model_validate(user),
    )


@router.post("/google", response_model=LoginResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Verify a Google OAuth credential and find or create the user."""
    try:
        idinfo = google_id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google account has no email")

    name = idinfo.get("name", email.split("@")[0])

    user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.oauth_provider:
            user.oauth_provider = "google"
            db.commit()
            db.refresh(user)
    else:
        user = User(
            email=email,
            full_name=name,
            oauth_provider="google",
            role=UserRole.PORTAL,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token_data = {"sub": str(user.id), "role": user.role.value}
    return LoginResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    token_data = {"sub": str(user.id), "role": user.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Check email exists in DB, ensure Firebase user so reset email can be sent."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email does not exist")

    # Ensure user exists in Firebase Auth so sendPasswordResetEmail works
    try:
        ensure_firebase_user(user.email)
    except Exception:
        pass  # Non-critical for the DB check

    return {"message": "Email verified. You can proceed with password reset."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
