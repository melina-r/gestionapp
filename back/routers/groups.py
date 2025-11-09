from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from models import Grupo, Usuario, UsuarioGrupo, GrupoCreate, Gasto, Deuda
from database import get_session
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
import secrets

router = APIRouter(prefix="/groups", tags=["groups"])

# Invitaciones en memoria (puedes migrarlo a DB luego)
INVITES = {}  # code -> {"group_id": int, "expires_at": datetime|None, "max_uses": int|None, "used": int}

def _now():
    return datetime.now(timezone.utc)

def _gen_code(group_id: int) -> str:
    return f"G{group_id}-{secrets.token_urlsafe(8)}"


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


def _recalculate_debts_for_group(session: Session, group_id: int):
    """
    Recalcula todas las deudas para todos los gastos del grupo.
    Se debe llamar cuando se agrega un nuevo miembro al grupo.
    """
    # Obtener todos los miembros del grupo
    statement = select(Usuario).join(UsuarioGrupo).where(
        UsuarioGrupo.grupo_id == group_id
    )
    group_members = session.exec(statement).all()
    total_members = len(group_members)

    if total_members <= 1:
        return  # No hay nada que recalcular

    # Obtener todos los gastos del grupo
    gastos = session.exec(select(Gasto).where(Gasto.grupo_id == group_id)).all()

    for gasto in gastos:
        # Eliminar deudas existentes para este gasto
        deudas_existentes = session.exec(
            select(Deuda).where(Deuda.gasto_id == gasto.id)
        ).all()
        for deuda in deudas_existentes:
            session.delete(deuda)

        # Recalcular shares con todos los miembros actuales
        amount_cents = _to_cents(gasto.valor)
        base = amount_cents // total_members
        remainder = amount_cents % total_members

        members_sorted = sorted(group_members, key=lambda u: u.id)
        shares = {}
        for idx, m in enumerate(members_sorted):
            cents = base + (1 if idx < remainder else 0)
            shares[m.id] = _from_cents(cents)

        # Crear nuevas deudas para todos los miembros (excepto el que pagó)
        for member in group_members:
            if member.id != gasto.usuario_id:
                _net_or_create_debt(
                    session=session,
                    grupo_id=group_id,
                    deudor_id=member.id,
                    acreedor_id=gasto.usuario_id,
                    monto=shares[member.id],
                    gasto_id=gasto.id,
                )

    session.commit()


@router.get("/", response_model=List[dict])
def get_user_groups(email: str, session: Session = Depends(get_session)):
    """
    Devuelve los grupos a los que pertenece el usuario.
    Cada grupo incluye: id, nombre y cantidad de miembros.
    """
    user = session.exec(select(Usuario).where(Usuario.mail == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    statement = (
        select(Grupo)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .where(UsuarioGrupo.usuario_id == user.id)
    )
    grupos = session.exec(statement).all()

    result = []
    for grupo in grupos:
        miembros_count = len(session.exec(
            select(UsuarioGrupo).where(UsuarioGrupo.grupo_id == grupo.id)
        ).all())
        result.append({
            "id": grupo.id,
            "name": grupo.nombre,
            "members": miembros_count
        })

    return result


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
def create_group(data: GrupoCreate, session: Session = Depends(get_session)):
    """
    Crea un nuevo grupo y lo asocia al usuario.
    """
    user = session.exec(select(Usuario).where(Usuario.mail == data.email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    nuevo_grupo = Grupo(nombre=data.name)
    session.add(nuevo_grupo)
    session.commit()
    session.refresh(nuevo_grupo)

    user_grupo = UsuarioGrupo(usuario_id=user.id, grupo_id=nuevo_grupo.id)
    session.add(user_grupo)
    session.commit()

    return {
        "id": nuevo_grupo.id,
        "name": nuevo_grupo.nombre,
        "members": 1
    }


@router.get("/{group_id}/members", response_model=list[dict])
def get_group_members(group_id: int, session: Session = Depends(get_session)):
    """
    Devuelve los miembros del grupo especificado.
    """
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    miembros = (
        session.query(Usuario)
        .join(UsuarioGrupo, Usuario.id == UsuarioGrupo.usuario_id)
        .filter(UsuarioGrupo.grupo_id == group_id)
        .all()
    )

    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "correo": u.mail,
            "avatar": f"https://ui-avatars.com/api/?name={u.nombre.replace(' ', '+')}"
        }
        for u in miembros
    ]


@router.post("/{group_id}/invites", response_model=dict)
def create_invite(
    group_id: int,
    expires_in_minutes: Optional[int] = Query(None, ge=1),
    max_uses: Optional[int] = Query(None, ge=1),
    session: Session = Depends(get_session)
):
    """
    Genera un código de invitación para un grupo.
    """
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    code = _gen_code(group_id)
    expires_at = _now() + timedelta(minutes=expires_in_minutes) if expires_in_minutes else None
    INVITES[code] = {
        "group_id": group_id,
        "expires_at": expires_at,
        "max_uses": max_uses,
        "used": 0
    }

    url = f"/join/{code}"  # ajusta si querés URL absoluta
    return {
        "code": code,
        "url": url,
        "group_id": group_id,
        "expires_at": expires_at.isoformat() if expires_at else None,
        "max_uses": max_uses,
        "used_count": 0
    }


@router.post("/{group_id}/recalculate-debts", response_model=dict)
def recalculate_group_debts(
    group_id: int,
    session: Session = Depends(get_session)
):
    """
    Endpoint manual para recalcular todas las deudas del grupo.
    Útil cuando se agregan miembros o se necesita recalcular.
    """
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    try:
        _recalculate_debts_for_group(session, group_id)
        return {
            "success": True,
            "group_id": group_id,
            "message": "Deudas recalculadas exitosamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al recalcular: {str(e)}")


@router.post("/accept/{code}", response_model=dict, tags=["invites"])
def accept_invite(
    code: str,
    user_id: int = Query(..., description="ID del usuario que se une"),
    session: Session = Depends(get_session)
):
    """
    Acepta una invitación y añade al usuario al grupo.
    """
    meta = INVITES.get(code)
    if not meta:
        raise HTTPException(status_code=404, detail="Código inválido")

    if meta["expires_at"] and _now() > meta["expires_at"]:
        raise HTTPException(status_code=400, detail="Código expirado")

    if meta["max_uses"] is not None and meta["used"] >= meta["max_uses"]:
        raise HTTPException(status_code=400, detail="Código sin usos disponibles")

    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    group = session.get(Grupo, meta["group_id"])
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    ya_miembro = session.exec(
        select(UsuarioGrupo).where(
            (UsuarioGrupo.usuario_id == user_id) &
            (UsuarioGrupo.grupo_id == meta["group_id"])
        )
    ).first()
    if ya_miembro:
        return {"joined": True, "group_id": meta["group_id"], "message": "Ya es miembro"}

    # Agregar el usuario al grupo
    session.add(UsuarioGrupo(usuario_id=user_id, grupo_id=meta["group_id"]))
    session.commit()

    # Recalcular todas las deudas del grupo con el nuevo miembro
    print(f"🔄 Recalculando deudas para el grupo {meta['group_id']} con el nuevo miembro {user_id}")
    _recalculate_debts_for_group(session, meta["group_id"])

    meta["used"] += 1

    miembros_count = len(session.exec(
        select(UsuarioGrupo).where(UsuarioGrupo.grupo_id == meta["group_id"])
    ).all())

    return {
        "joined": True,
        "group_id": meta["group_id"],
        "members": miembros_count,
        "used_count": meta["used"],
        "message": "Deudas recalculadas con el nuevo miembro"
    }
