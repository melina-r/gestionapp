# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, expenses, auth, groups
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()


app = FastAPI()

# Configurar CORS para múltiples puertos comunes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # More permissive during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(auth.router)
app.include_router(groups.router)
