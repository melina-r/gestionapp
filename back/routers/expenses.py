from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from datetime import date
from typing import List

from models import Gasto, GastoCreate, GastoUpdate, GastoPublic, Usuario, UsuarioGrupo
from database import get_session
from auth_utils import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("/", response_model=GastoPublic)
def create_expense(
    expense: GastoCreate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Create a new expense (requires authentication)"""
    db_expense = Gasto.model_validate(expense)
    session.add(db_expense)
    session.commit()
    session.refresh(db_expense)
    return db_expense


@router.get("/", response_model=List[GastoPublic])
def list_expenses(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """List all expenses ordered by date descending (requires authentication)"""
    statement = select(Gasto).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/{expense_id}", response_model=GastoPublic)
def get_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get a specific expense by ID (requires authentication)"""
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Delete an expense by ID (requires authentication)"""
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    session.delete(expense)
    session.commit()
    return {"message": f"Gasto con ID {expense_id} eliminado exitosamente"}


@router.put("/{expense_id}", response_model=GastoPublic)
def update_expense(
    expense_id: int,
    expense_update: GastoUpdate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Update an expense by ID (requires authentication)"""
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    # Update only provided fields
    expense_data = expense_update.model_dump(exclude_unset=True)
    if not expense_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

    for key, value in expense_data.items():
        setattr(expense, key, value)

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.get("/user/{user_id}", response_model=List[GastoPublic])
def get_expenses_by_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get all expenses for a specific user (requires authentication)"""
    statement = select(Gasto).where(Gasto.usuario_id == user_id).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/group/{group_id}", response_model=List[GastoPublic])
def get_expenses_by_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get all expenses for a specific group (requires authentication)"""
    # Get all users in the group
    statement = select(UsuarioGrupo.usuario_id).where(UsuarioGrupo.grupo_id == group_id)
    user_ids = session.exec(statement).all()

    if not user_ids:
        return []

    # Get all expenses for those users
    statement = select(Gasto).where(Gasto.usuario_id.in_(user_ids)).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/date", response_model=List[GastoPublic])
def filter_expenses_by_date(
    fecha: date = Query(..., description="Fecha (YYYY-MM-DD)"),
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Filter expenses by specific date (requires authentication)"""
    statement = select(Gasto).where(Gasto.fecha == fecha).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/title", response_model=List[GastoPublic])
def filter_expenses_by_title(
    titulo: str = Query(..., description="Texto a buscar en el título"),
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Filter expenses by title (requires authentication)"""
    statement = select(Gasto).where(Gasto.titulo.ilike(f"%{titulo}%")).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses
