import secrets
import json
from urllib.request import Request, urlopen
from urllib.error import URLError

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from app.config import settings

_initialized = False


def init_firebase():
    global _initialized
    if not _initialized and settings.FIREBASE_CREDENTIALS_PATH:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        _initialized = True


def verify_firebase_token(token: str) -> dict:
    init_firebase()
    return firebase_auth.verify_id_token(token)


def _rest_api_create_user(email: str, password: str) -> bool:
    """Create a Firebase Auth user via REST API (no service account needed)."""
    if not settings.FIREBASE_API_KEY:
        return False

    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signUp"
        f"?key={settings.FIREBASE_API_KEY}"
    )
    payload = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }).encode("utf-8")

    req = Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        urlopen(req)
        return True
    except (URLError, Exception):
        # EMAIL_EXISTS means user already exists — that's fine
        return False


def ensure_firebase_user(email: str):
    """Ensure user exists in Firebase Auth (create with random password if not)."""
    init_firebase()
    if _initialized:
        try:
            firebase_auth.get_user_by_email(email)
        except firebase_auth.UserNotFoundError:
            firebase_auth.create_user(email=email, password=secrets.token_urlsafe(32))
    else:
        # Fallback: use REST API when service account is not configured
        _rest_api_create_user(email, secrets.token_urlsafe(32))


def ensure_firebase_user_with_password(email: str, password: str):
    """Create or update Firebase Auth user with a known password (for migration)."""
    init_firebase()
    if _initialized:
        try:
            user = firebase_auth.get_user_by_email(email)
            firebase_auth.update_user(user.uid, password=password)
        except firebase_auth.UserNotFoundError:
            firebase_auth.create_user(email=email, password=password)
    else:
        # Fallback: use REST API when service account is not configured
        _rest_api_create_user(email, password)


def verify_firebase_password(email: str, password: str) -> bool:
    """Verify email/password against Firebase Auth using the REST API.

    Returns True if Firebase accepts the credentials, False otherwise.
    Requires FIREBASE_API_KEY to be set in settings.
    """
    if not settings.FIREBASE_API_KEY:
        return False

    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={settings.FIREBASE_API_KEY}"
    )
    payload = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }).encode("utf-8")

    req = Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        urlopen(req)
        return True
    except (URLError, Exception):
        return False
