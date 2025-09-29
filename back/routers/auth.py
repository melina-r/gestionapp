from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


class User(BaseModel):
    email: str
    password: str
    nombre: str
    apellido: str

class UserLogin(BaseModel):
    email: str
    password: str

fake_users_db = {}

@router.post("/register")
def register(user: User):
    if user.email in fake_users_db:
        raise HTTPException(status_code=400, detail="El email ingresado ya se encuentra en uso")
    fake_users_db[user.email] = user
    return {"msg": "Usuario creado con éxito"}

@router.post("/login")
def login(user: UserLogin):
    if user.email not in fake_users_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if fake_users_db[user.email].password != user.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    return {"msg": "Usuario logeado con éxito"}