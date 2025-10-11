from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import List, Optional
from models import Grupo, Usuario, UsuarioGrupo, GrupoCreate
from database import get_session
from datetime import datetime, timedelta, timezone
import secrets

router = APIRouter(prefix="/groups", tags=["groups"])

# Invitaciones en memoria (puedes migrarlo a DB luego)
INVITES = {}  # code -> {"group_id": int, "expires_at": datetime|None, "max_uses": int|None, "used": int}

def _now():
    return datetime.now(timezone.utc)

def _gen_code(group_id: int) -> str:
    return f"G{group_id}-{secrets.token_urlsafe(8)}"


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

    session.add(UsuarioGrupo(usuario_id=user_id, grupo_id=meta["group_id"]))
    session.commit()

    meta["used"] += 1

    miembros_count = len(session.exec(
        select(UsuarioGrupo).where(UsuarioGrupo.grupo_id == meta["group_id"])
    ).all())

    return {
        "joined": True,
        "group_id": meta["group_id"],
        "members": miembros_count,
        "used_count": meta["used"]
    }
