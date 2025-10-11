from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from typing import List
from datetime import date

from database import get_session
from models import Deuda, Gasto, GastoCreate, GastoUpdate, GastoPublic, Usuario, UsuarioGrupo

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post("/", response_model=GastoPublic)
def create_expense(expense: GastoCreate, session: Session = Depends(get_session)):
    """Create a new expense"""
    try:
        db_expense = Gasto(**expense.model_dump())
        session.add(db_expense)
        session.commit()
        session.refresh(db_expense)

        # Get all users in the same group
        statement = select(Usuario).join(UsuarioGrupo).where(
            UsuarioGrupo.grupo_id == expense.grupo_id
        )
        group_members = session.exec(statement).all()
        
        # Calculate individual debt amount
        total_members = len(group_members)
        if total_members > 1:  # Only create debts if there's more than 1 person
            individual_amount = expense.valor / total_members

            # Create debt entries for each member except the expense creator
            for member in group_members:
                if member.id != expense.usuario_id:
                    debt = Deuda(
                        gasto_id=db_expense.id,
                        deudor_id=member.id,
                        acreedor_id=expense.usuario_id,
                        grupo_id=expense.grupo_id,
                        monto=individual_amount,
                        estado=0  # pending status
                    )
                    session.add(debt)
            
            session.commit()


        return db_expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el gasto - {e}")

@router.get("/", response_model=List[GastoPublic])
def list_expenses(session: Session = Depends(get_session)):
    """List all expenses ordered by date"""
    statement = select(Gasto).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/{expense_id}", response_model=GastoPublic)
def get_expense(expense_id: int, session: Session = Depends(get_session)):
    """Get a specific expense by ID"""
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return expense

@router.get("/credits/{user_id}", response_model=List[Deuda])
def get_credits(user_id: int, session: Session = Depends(get_session)):
    """Get all credits (amounts owed to the user)"""
    statement = select(Deuda).where(Deuda.acreedor_id == user_id)
    credits = session.exec(statement).all()
    return credits

@router.get("/debts/{user_id}", response_model=List[Deuda])
def get_debts(user_id: int, session: Session = Depends(get_session)):
    """Get all debts (amounts the user owes)"""
    statement = select(Deuda).where(Deuda.deudor_id == user_id)
    debts = session.exec(statement).all()
    return debts

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    """Delete an expense by ID"""
    # First delete associated debts (if CASCADE is not set up in DB)
    statement = select(Deuda).where(Deuda.gasto_id == expense_id)
    debts = session.exec(statement).all()
    for debt in debts:
        session.delete(debt)
    
    # Then delete the expense
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
    session: Session = Depends(get_session)
):
    """Update an expense"""
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    # Update only provided fields
    update_data = expense_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

    # If the amount is being updated, we need to update the debts too
    if "valor" in update_data:
        # Get all related debts
        statement = select(Deuda).where(Deuda.gasto_id == expense_id)
        debts = session.exec(statement).all()
        
        # Get group members count
        statement = select(Usuario).join(UsuarioGrupo).where(
            UsuarioGrupo.grupo_id == expense.grupo_id
        )
        total_members = len(session.exec(statement).all())
        
        # Calculate new individual amount
        new_individual_amount = update_data["valor"] / total_members
        
        # Update each debt
        for debt in debts:
            debt.monto = new_individual_amount
            session.add(debt)

    # Update expense fields
    for key, value in update_data.items():
        setattr(expense, key, value)

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.get("/user/{user_id}", response_model=List[GastoPublic])
def get_expenses_by_user(user_id: int, session: Session = Depends(get_session)):
    """Get all expenses for a specific user"""
    statement = select(Gasto).where(Gasto.usuario_id == user_id).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/group/{group_id}", response_model=List[GastoPublic])
def get_expenses_by_group(group_id: int, session: Session = Depends(get_session)):
    """Get all expenses for a group - placeholder until groups feature is added"""
    # TODO: Implement proper group filtering once groups feature is added
    statement = select(Gasto).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/date", response_model=List[GastoPublic])
def filter_expenses_by_date(
    fecha: date = Query(..., description="Fecha (YYYY-MM-DD)"),
    session: Session = Depends(get_session)
):
    """Filter expenses by specific date"""
    statement = select(Gasto).where(Gasto.fecha == fecha).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/title", response_model=List[GastoPublic])
def filter_expenses_by_title(
    titulo: str = Query(..., description="Texto a buscar en el título"),
    session: Session = Depends(get_session)
):
    """Filter expenses by title (case insensitive)"""
    statement = select(Gasto).where(Gasto.titulo.ilike(f"%{titulo}%")).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses