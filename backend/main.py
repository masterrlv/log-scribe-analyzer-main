from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.schema import ForeignKey
from pydantic import BaseModel
from datetime import datetime
import jwt
import os
from passlib.context import CryptContext
from backend import parser
from typing import List

# FastAPI app setup
app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://host.docker.internal:8080")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "postgresql://logs:logs_db@host.docker.internal:5432/logs_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Authentication setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Database Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="viewer")

class Upload(Base):
    __tablename__ = "log_file"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    filename = Column(String)
    size = Column(Integer)
    timestamp = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    status = Column(String, default="processing")

class LogEntry(Base):
    __tablename__ = "log_entries"
    id = Column(Integer, primary_key=True, index=True)
    log_file_id = Column(Integer)
    user_id = Column(Integer)
    timestamp = Column(String)
    log_level = Column(String, index=True)
    source = Column(String, index=True)
    message = Column(String)
    additional_fields = Column(JSON)

# Table creation
Base.metadata.create_all(bind=engine)

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "viewer"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    class Config:
        from_attributes = True

class LogEntryResponse(BaseModel):
    id: int
    timestamp: str
    log_level: str
    source: str
    message: str
    additional_fields: dict
    class Config:
        from_attributes = True

class SearchResponse(BaseModel):
    logs: list[LogEntryResponse]
    total: int
    page: int
    per_page: int

class TimeSeriesPoint(BaseModel):
    x: str
    y: int

class SeriesData(BaseModel):
    name: str
    data: list[TimeSeriesPoint]

class DistributionItem(BaseModel):
    name: str
    value: int

class AnalyticsResponse(BaseModel):
    series: list[SeriesData]

class UploadResponse(BaseModel):
    id: int
    filename: str
    size: int
    timestamp: str
    status: str
    class Config:
        from_attributes = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Authentication Helpers
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# CRUD Operations
def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, email=user.email, password_hash=hashed_password, role=user.role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_upload(db: Session, user_id: int, filename: str, size: int):
    upload = Upload(user_id=user_id, filename=filename, size=size)
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload

def bulk_insert_log_entries(db, upload_id: int, log_entries: list, upload_timestamp: str):
    entries = [LogEntry(
        log_file_id=upload_id,
        user_id=entry.get('user_id'),
        timestamp=upload_timestamp,  # Use the upload's timestamp
        log_level=entry.get('log_level'),
        message=entry.get('message'),
        source=entry.get('source'),
        additional_fields=entry.get('additional_fields', {})
    ) for entry in log_entries]
    db.bulk_save_objects(entries)
    db.commit()

def update_upload_status(db: Session, upload_id: int, status: str):
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if upload:
        upload.status = status
        db.commit()

def search_logs(db: Session, q: str = None, log_level: str = None, start_time: datetime = None, 
               end_time: datetime = None, source: str = None, upload_id: int = None, 
               page: int = 1, per_page: int = 20):
    query = db.query(LogEntry)
    print(upload_id)
    # Filter by upload_id if provided
    if upload_id is not None:
        query = query.filter(LogEntry.log_file_id == upload_id)
        
    if q:
        query = query.filter(LogEntry.message.ilike(f"%{q}%"))
    if log_level:
        query = query.filter(LogEntry.log_level == log_level.upper())
    if start_time:
        query = query.filter(LogEntry.timestamp >= start_time.strftime("%Y-%m-%d %H:%M:%S"))
    if end_time:
        query = query.filter(LogEntry.timestamp <= end_time.strftime("%Y-%m-%d %H:%M:%S"))
    if source:
        query = query.filter(LogEntry.source == source)
        
    total = query.count()
    logs = query.order_by(LogEntry.timestamp.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return SearchResponse(logs=[LogEntryResponse.from_orm(log) for log in logs], total=total, page=page, per_page=per_page)

def get_time_series(db: Session, start_time: datetime, end_time: datetime, interval: str, upload_id: int = None):
    time_trunc = func.date_trunc(interval, func.to_timestamp(LogEntry.timestamp, 'YYYY-MM-DD HH24:MI:SS'))
    query = db.query(time_trunc.label('time'), func.count().label('count')).filter(
        func.to_timestamp(LogEntry.timestamp, 'YYYY-MM-DD HH24:MI:SS') >= start_time,
        func.to_timestamp(LogEntry.timestamp, 'YYYY-MM-DD HH24:MI:SS') <= end_time
    )
    
    # Add upload_id filter if provided
    if upload_id is not None:
        query = query.filter(LogEntry.log_file_id == upload_id)
        
    query = query.group_by('time').order_by('time')
    results = query.all()
    data = [{"x": row.time.isoformat(), "y": row.count} for row in results]
    return [SeriesData(name="Log Count", data=data)]

def get_distribution(db: Session, field: str, upload_id: int = None):
    try:
        if field == "log_level":
            query = db.query(
                LogEntry.log_level.label('name'),
                func.count(LogEntry.id).label('value')
            )
        elif field == "source":
            query = db.query(
                LogEntry.source.label('name'),
                func.count(LogEntry.id).label('value')
            )
        else:
            return []
            
        # Add upload_id filter if provided
        if upload_id is not None:
            query = query.filter(LogEntry.log_file_id == upload_id)
            
        query = query.group_by('name')
        results = query.all()
        return [{"name": str(name) if name else "Unknown", "value": value} for name, value in results]
    except Exception as e:
        print(f"Error in get_distribution: {str(e)}")
        return []

def get_top_errors(db: Session, n: int, upload_id: int = None):
    try:
        query = db.query(
            LogEntry.message.label('name'),
            func.count(LogEntry.id).label('value')
        ).filter(
            LogEntry.log_level == 'ERROR'
        )
        
        # Add upload_id filter if provided
        if upload_id is not None:
            query = query.filter(LogEntry.log_file_id == upload_id)
            
        query = query.group_by(
            LogEntry.message
        ).order_by(
            func.count(LogEntry.id).desc()
        ).limit(n)
        
        results = query.all()
        return [{"name": str(msg) if msg else "Unknown", "value": count} for msg, count in results]
    except Exception as e:
        print(f"Error in get_top_errors: {str(e)}")
        return []

def parse_log_file(upload_id: int, file_path: str, db: Session = Depends(get_db)):
    try:
        # Get the upload record to retrieve its timestamp
        upload = db.query(Upload).filter(Upload.id == upload_id).first()
        if not upload:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        upload_timestamp = upload.timestamp  # Use the upload's timestamp
        with open(file_path, 'r') as f:
            lines = f.readlines()
        log_entries = []
        for line in lines:
            parsed = parser.LogParserFactory.parse_line(line.strip())
            if parsed:
                log_entries.append(parsed)
            
        if not log_entries:
            update_upload_status(db, upload_id, 'failed')
            return
        bulk_insert_log_entries(db, upload_id, log_entries, upload_timestamp)
        update_upload_status(db, upload_id, 'completed')
    except Exception as e:
        db.rollback()
        update_upload_status(db, upload_id, 'failed')
        raise HTTPException(status_code=500, detail=f"Log parsing failed: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

# API Endpoints
@app.post("/auth/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db, user)

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_username(db, form_data.username)
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/logs/upload")
async def upload_log(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    if not file.filename.endswith(('.log', '.txt', '.json')):
        raise HTTPException(status_code=400, detail="Invalid file type")
    file_path = f"temp_{file.filename}"
    try:
        file_content = await file.read()
        file_size = len(file_content)
        with open(file_path, "wb") as f:
            f.write(file_content)
        upload = create_upload(db, current_user.id, file.filename, file_size)
        background_tasks.add_task(parse_log_file, upload.id, file_path, db)
        return {"upload_id": upload.id, "status": "processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@app.get("/logs/upload/{upload_id}/status")
def get_upload_status(upload_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    upload = db.query(Upload).filter(Upload.id == upload_id, Upload.user_id == current_user.id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return {"status": upload.status}

@app.get("/logs/search", response_model=SearchResponse)
def search_logs_endpoint(
    q: str = None,
    log_level: str = None,
    start_time: datetime = None,
    end_time: datetime = None,
    source: str = None,
    upload_id: int = None,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(upload_id)
    return search_logs(
        db=db,
        q=q,
        log_level=log_level,
        start_time=start_time,
        end_time=end_time,
        source=source,
        upload_id=upload_id,
        page=page,
        per_page=per_page
    )

@app.get("/logs/upload/history", response_model=List[UploadResponse])
def get_file_upload_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    uploads = db.query(Upload).filter(Upload.user_id == current_user.id).order_by(Upload.timestamp.desc()).all()
    for data in uploads:
        print(data)
    if not uploads:
        raise HTTPException(status_code=404, detail="No upload history found")
    return [UploadResponse.from_orm(upload) for upload in uploads]

@app.get("/analytics/time-series", response_model=AnalyticsResponse)
def get_time_series_endpoint(
    start_time: datetime,
    end_time: datetime,
    interval: str = "hour",
    upload_id: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_id = int(upload_id)
    valid_intervals = ["minute", "hour", "day", "week", "month"]
    if interval not in valid_intervals:
        raise HTTPException(status_code=400, detail=f"Invalid interval. Must be one of {valid_intervals}")
    data = get_time_series(db, start_time, end_time, interval, upload_id=upload_id)
    print("-------------------------")
    print(data)
    print(AnalyticsResponse(series=data))
    print("-------------------------")
    return AnalyticsResponse(series=data)

@app.get("/analytics/distribution", response_model=AnalyticsResponse)
def get_distribution_endpoint(
    field: str = "log_level",
    upload_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_fields = ["log_level", "source"]
    if field not in valid_fields:
        raise HTTPException(status_code=400, detail=f"Invalid field. Must be one of {valid_fields}")
    data = get_distribution(db, field, upload_id=upload_id)
    # Transform data to match TimeSeriesPoint format
    formatted_data = [{"x": item["name"], "y": item["value"]} for item in data]
    print("-------------------------")
    print(formatted_data)
    print(AnalyticsResponse(series=[SeriesData(name=field, data=formatted_data)]))
    print("-------------------------")
    return AnalyticsResponse(series=[SeriesData(name=field, data=formatted_data)])

@app.get("/analytics/top-errors", response_model=AnalyticsResponse)
def get_top_errors_endpoint(
    n: int = 10,
    upload_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if n <= 0:
        raise HTTPException(status_code=400, detail="n must be positive")
    data = get_top_errors(db, n, upload_id=upload_id)
    # Transform data to match TimeSeriesPoint format
    formatted_data = [{"x": item["name"], "y": item["value"]} for item in data]

    print("-------------------------")
    print(formatted_data)
    print(AnalyticsResponse(series=[SeriesData(name="Top Errors", data=formatted_data)]))
    print("-------------------------")
    return AnalyticsResponse(series=[SeriesData(name="Top Errors", data=formatted_data)])