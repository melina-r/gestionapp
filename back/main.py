# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, expenses, auth, groups
from database import create_db_and_tables
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear tablas al iniciar
create_db_and_tables()


app = FastAPI()

# Configurar CORS para múltiples puertos comunes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Create React App default
        "http://localhost:5173",      # Vite default
        "http://127.0.0.1:3000",      # Localhost alternativo
        "http://127.0.0.1:5173",      # Vite localhost alternativo
        "http://localhost:8080",      # Otros frameworks
        "http://localhost:4200"       # Angular default
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(auth.router)
app.include_router(groups.router)
