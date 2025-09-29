# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, expenses, auth

app = FastAPI()

# Permitir que React acceda al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # dominio de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(auth.router)
