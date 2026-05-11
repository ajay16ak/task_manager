from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, APIRouter 
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from tinydb import TinyDB, Query
import database
import schemas

# 1. Initialize the Router (This fixes the Render AttributeError)
router = APIRouter()

SECRET_KEY = os.environ.get("SECRET_KEY", "fallback-for-dev-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- Utility Functions ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: TinyDB = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except jwt.InvalidTokenError:
        raise credentials_exception
        
    UserQ = Query()
    user_dict = db.table('users').get(UserQ.username == token_data.username)
    
    if user_dict is None:
        raise credentials_exception
        
    user_dict["id"] = user_dict.doc_id
    return schemas.User(**user_dict)

# --- Routes for your React Frontend ---

@router.post("/register")
async def register(user_data: schemas.UserCreate, db: TinyDB = Depends(database.get_db)):
    UserQ = Query()
    users_table = db.table('users')
    
    # Check if user exists
    if users_table.search(UserQ.username == user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = get_password_hash(user_data.password)
    new_user = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_pw,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    users_table.insert(new_user)
    return {"message": "User created successfully"}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: TinyDB = Depends(database.get_db)):
    UserQ = Query()
    user = db.table('users').get(UserQ.username == form_data.username)
    
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}
