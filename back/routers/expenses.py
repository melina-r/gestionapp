from fastapi import APIRouter, HTTPException, Query, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import aliased
from typing import List, Optional
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from database import get_session
from models import Deuda, Gasto, GastoCreate, GastoUpdate, GastoPublic, Usuario, UsuarioGrupo

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _to_cents(x) -> int:
    d = x if isinstance(x, Decimal) else Decimal(str(x))
    return int((d * Decimal("100")).to_integral_value(rounding=ROUND_HALF_UP))


def _from_cents(c: int) -> Decimal:
    return (Decimal(c) / Decimal("100")).quantize(Decimal("0.01"))


def _net_or_create_debt(
    *,
    session: Session,
    grupo_id: int,
    deudor_id: int,
    acreedor_id: int,
    monto: Decimal,
    gasto_id: Optional[int] = None,
):
    if monto <= 0:
        return

    stmt_opuesta = select(Deuda).where(
        (Deuda.grupo_id == grupo_id)
        & (Deuda.deudor_id == acreedor_id)
        & (Deuda.acreedor_id == deudor_id)
        & (Deuda.estado == 0)
    )
    opuesta = session.exec(stmt_opuesta).first()

    new_c = _to_cents(monto)

    if opuesta:
        opp_c = _to_cents(opuesta.monto)

        if opp_c > new_c:
            opuesta.monto = _from_cents(opp_c - new_c)
            session.add(opuesta)
            return
        elif opp_c < new_c:
            session.delete(opuesta)
            remain = new_c - opp_c
            if remain > 0:
                session.add(Deuda(
                    gasto_id=gasto_id,
                    deudor_id=deudor_id,
                    acreedor_id=acreedor_id,
                    grupo_id=grupo_id,
                    monto=_from_cents(remain),
                    estado=0
                ))
            return
        else:
            session.delete(opuesta)
            return

    session.add(Deuda(
        gasto_id=gasto_id,
        deudor_id=deudor_id,
        acreedor_id=acreedor_id,
        grupo_id=grupo_id,
        monto=monto,
        estado=0
    ))


@router.post("/", response_model=GastoPublic)
def create_expense(expense: GastoCreate, session: Session = Depends(get_session)):
    try:
        db_expense = Gasto(**expense.model_dump())
        session.add(db_expense)
        session.commit()
        session.refresh(db_expense)

        statement = select(Usuario).join(UsuarioGrupo).where(
            UsuarioGrupo.grupo_id == expense.grupo_id
        )
        group_members = session.exec(statement).all()

        total_members = len(group_members)
        if total_members > 1:
            amount_cents = _to_cents(expense.valor)
            base = amount_cents // total_members
            remainder = amount_cents % total_members

            members_sorted = sorted(group_members, key=lambda u: u.id)
            shares = {}
            for idx, m in enumerate(members_sorted):
                cents = base + (1 if idx < remainder else 0)
                shares[m.id] = _from_cents(cents)

            for member in group_members:
                if member.id != expense.usuario_id:
                    _net_or_create_debt(
                        session=session,
                        grupo_id=expense.grupo_id,
                        deudor_id=member.id,
                        acreedor_id=expense.usuario_id,
                        monto=shares[member.id],
                        gasto_id=db_expense.id,
                    )

            session.commit()

        return db_expense
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el gasto - {e}")


@router.get("/", response_model=List[GastoPublic])
def list_expenses(
    grupo_id: int = Query(..., description="ID del grupo"),
    usuario_id: int = Query(..., description="ID del usuario"),
    session: Session = Depends(get_session)
):
    stmt_autor = select(Gasto).where(
        (Gasto.grupo_id == grupo_id) & (Gasto.usuario_id == usuario_id)
    )

    stmt_deudas = select(Gasto).join(Deuda).where(
        (Deuda.deudor_id == usuario_id) & (Deuda.grupo_id == grupo_id)
    )

    gastos_autor = session.exec(stmt_autor).all()
    gastos_deudor = session.exec(stmt_deudas).all()

    gastos_totales = {g.id: g for g in gastos_autor + gastos_deudor}.values()

    return sorted(gastos_totales, key=lambda g: g.fecha, reverse=True)


@router.get("/credits/{user_id}", response_model=List[dict])
def get_credits(
    user_id: int,
    grupo_id: Optional[int] = Query(None),
    session: Session = Depends(get_session)
):
    UDeudor = aliased(Usuario)
    UAcreedor = aliased(Usuario)

    stmt = (
        select(Deuda, UDeudor.nombre, UAcreedor.nombre)
        .join(UDeudor, Deuda.deudor_id == UDeudor.id)
        .join(UAcreedor, Deuda.acreedor_id == UAcreedor.id)
        .where(Deuda.acreedor_id == user_id)
    )
    if grupo_id is not None:
        stmt = stmt.where(Deuda.grupo_id == grupo_id)

    rows = session.exec(stmt).all()
    out = []
    for deuda, deudor_nombre, acreedor_nombre in rows:
        out.append({
            "id": deuda.id,
            "gasto_id": deuda.gasto_id,
            "grupo_id": deuda.grupo_id,
            "deudor_id": deuda.deudor_id,
            "deudor_nombre": deudor_nombre,
            "acreedor_id": deuda.acreedor_id,
            "acreedor_nombre": acreedor_nombre,
            "monto": float(deuda.monto),
            "estado": deuda.estado,
        })
    return out


@router.get("/debts/{user_id}", response_model=List[dict])
def get_debts(
    user_id: int,
    grupo_id: Optional[int] = Query(None),
    session: Session = Depends(get_session)
):
    UDeudor = aliased(Usuario)
    UAcreedor = aliased(Usuario)

    stmt = (
        select(Deuda, UDeudor.nombre, UAcreedor.nombre)
        .join(UDeudor, Deuda.deudor_id == UDeudor.id)
        .join(UAcreedor, Deuda.acreedor_id == UAcreedor.id)
        .where(Deuda.deudor_id == user_id)
    )
    if grupo_id is not None:
        stmt = stmt.where(Deuda.grupo_id == grupo_id)

    rows = session.exec(stmt).all()
    out = []
    for deuda, deudor_nombre, acreedor_nombre in rows:
        out.append({
            "id": deuda.id,
            "gasto_id": deuda.gasto_id,
            "grupo_id": deuda.grupo_id,
            "deudor_id": deuda.deudor_id,
            "deudor_nombre": deudor_nombre,
            "acreedor_id": deuda.acreedor_id,
            "acreedor_nombre": acreedor_nombre,
            "monto": float(deuda.monto),
            "estado": deuda.estado,
        })
    return out


@router.get("/summary")
def debts_summary(
    grupo_id: int = Query(..., description="ID del grupo"),
    usuario_id: int = Query(..., description="ID del usuario"),
    session: Session = Depends(get_session)
):
    try:
        stmt_recv = select(Deuda).where(
            (Deuda.grupo_id == grupo_id) & (Deuda.acreedor_id == usuario_id) & (Deuda.estado == 0)
        )
        stmt_pay = select(Deuda).where(
            (Deuda.grupo_id == grupo_id) & (Deuda.deudor_id == usuario_id) & (Deuda.estado == 0)
        )
        to_receive = sum((d.monto for d in session.exec(stmt_recv).all()), Decimal("0.00"))
        to_pay = sum((d.monto for d in session.exec(stmt_pay).all()), Decimal("0.00"))
        return {
            "grupo_id": grupo_id,
            "usuario_id": usuario_id,
            "to_receive": str(Decimal(to_receive).quantize(Decimal("0.01"))),
            "to_pay": str(Decimal(to_pay).quantize(Decimal("0.01")))
        }
    except Exception as e:
        return {
            "grupo_id": grupo_id,
            "usuario_id": usuario_id,
            "to_receive": "0.00",
            "to_pay": "0.00",
            "error": str(e),
        }


@router.get("/settlements")
def compute_settlements(
    grupo_id: int = Query(..., description="ID del grupo"),
    session: Session = Depends(get_session)
):
    stmt = select(Deuda).where((Deuda.grupo_id == grupo_id) & (Deuda.estado == 0))
    debts = session.exec(stmt).all()
    if not debts:
        return {"grupo_id": grupo_id, "settlements": [], "summary": {"total_transfers": 0, "total_amount": "0.00"}}

    net = {}
    for d in debts:
        cents = _to_cents(d.monto)
        net[d.acreedor_id] = net.get(d.acreedor_id, 0) + cents
        net[d.deudor_id] = net.get(d.deudor_id, 0) - cents

    creditors = [[uid, amt] for uid, amt in net.items() if amt > 0]
    debtors = [[uid, -amt] for uid, amt in net.items() if amt < 0]
    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    transfers = []
    total_amount_cents = 0
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debtor_amt = debtors[i]
        creditor_id, creditor_amt = creditors[j]
        transfer_cents = min(debtor_amt, creditor_amt)
        total_amount_cents += transfer_cents
        transfers.append({
            "from": debtor_id,
            "to": creditor_id,
            "amount": str(_from_cents(transfer_cents))
        })
        debtor_amt -= transfer_cents
        creditor_amt -= transfer_cents
        if debtor_amt == 0:
            i += 1
        else:
            debtors[i][1] = debtor_amt
        if creditor_amt == 0:
            j += 1
        else:
            creditors[j][1] = creditor_amt

    return {
        "grupo_id": grupo_id,
        "settlements": transfers,
        "summary": {
            "total_transfers": len(transfers),
            "total_amount": str(_from_cents(total_amount_cents))
        }
    }


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, session: Session = Depends(get_session)):
    statement = select(Deuda).where(Deuda.gasto_id == expense_id)
    debts = session.exec(statement).all()
    for debt in debts:
        session.delete(debt)

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
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    update_data = expense_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

    if "valor" in update_data:
        statement = select(Deuda).where(Deuda.gasto_id == expense_id)
        debts = session.exec(statement).all()
        for d in debts:
            session.delete(d)

        members_stmt = select(Usuario).join(UsuarioGrupo).where(
            UsuarioGrupo.grupo_id == expense.grupo_id
        )
        members = session.exec(members_stmt).all()
        total_members = len(members)

        if total_members > 1:
            amount_cents = _to_cents(update_data["valor"])
            base = amount_cents // total_members
            remainder = amount_cents % total_members
            members_sorted = sorted(members, key=lambda u: u.id)
            shares = {}
            for idx, m in enumerate(members_sorted):
                cents = base + (1 if idx < remainder else 0)
                shares[m.id] = _from_cents(cents)

            for m in members:
                if m.id != expense.usuario_id:
                    _net_or_create_debt(
                        session=session,
                        grupo_id=expense.grupo_id,
                        deudor_id=m.id,
                        acreedor_id=expense.usuario_id,
                        monto=shares[m.id],
                        gasto_id=expense_id,
                    )

    for key, value in update_data.items():
        setattr(expense, key, value)

    session.add(expense)
    session.commit()
    session.refresh(expense)
    return expense


@router.get("/user/{user_id}", response_model=List[GastoPublic])
def get_expenses_by_user(user_id: int, session: Session = Depends(get_session)):
    statement = select(Gasto).where(Gasto.usuario_id == user_id).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/group/{group_id}", response_model=List[GastoPublic])
def get_expenses_by_group(group_id: int, session: Session = Depends(get_session)):
    # Antes: statement = select(Gasto).order_by(Gasto.fecha.desc())
    # Ahora filtramos por grupo_id correctamente:
    statement = select(Gasto).where(Gasto.grupo_id == group_id).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/date", response_model=List[GastoPublic])
def filter_expenses_by_date(
    fecha: date = Query(..., description="Fecha (YYYY-MM-DD)"),
    session: Session = Depends(get_session)
):
    statement = select(Gasto).where(Gasto.fecha == fecha).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


@router.get("/filter/title", response_model=List[GastoPublic])
def filter_expenses_by_title(
    titulo: str = Query(..., description="Texto a buscar en el título"),
    session: Session = Depends(get_session)
):
    statement = select(Gasto).where(Gasto.titulo.ilike(f"%{titulo}%")).order_by(Gasto.fecha.desc())
    expenses = session.exec(statement).all()
    return expenses


# Ruta dinámica al final para no pisar /summary o /settlements
@router.get("/{expense_id}", response_model=GastoPublic)
def get_expense(expense_id: int, session: Session = Depends(get_session)):
    expense = session.get(Gasto, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return expense
