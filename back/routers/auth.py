from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select

from models import Usuario, UsuarioCreate, UsuarioLogin, UsuarioPublic
from database import get_session
from auth_utils import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register", response_model=UsuarioPublic)
def register(user: UsuarioCreate, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if email already exists
    try:
        statement = select(Usuario).where(Usuario.mail == user.mail)
        existing_user = session.exec(statement).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="El email ingresado ya se encuentra en uso")

        # Create new user with hashed password
        user_data = user.model_dump()
        user_data["password"] = get_password_hash(user.password)
        db_user = Usuario(**user_data)
        session.add(db_user)
        session.commit()
        session.refresh(db_user)

        return db_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar el usuario - {e}")

@router.post("/login")
def login(user_login: UsuarioLogin, session: Session = Depends(get_session)):
    """Login user"""
    # Find user by email

    try:
        statement = select(Usuario).where(Usuario.mail == user_login.mail)
        db_user = session.exec(statement).first()

        if not db_user:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        # Verify password using bcrypt
        if not verify_password(user_login.password, db_user.password):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(db_user.id), "mail": db_user.mail},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_user.id,
            "nombre": db_user.nombre,
            "apellido": db_user.apellido
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al iniciar sesión - {e}")
