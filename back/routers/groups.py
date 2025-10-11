from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from models import Grupo, Usuario, UsuarioGrupo, GrupoCreate
from database import get_session

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("/", response_model=List[dict])
def get_user_groups(email: str, session: Session = Depends(get_session)):
    """
    Devuelve los grupos a los que pertenece el usuario.
    Cada grupo incluye: id, nombre y cantidad de miembros.
    """
    # Buscar usuario
    user = session.exec(select(Usuario).where(Usuario.mail == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Traer grupos del usuario
    statement = (
        select(Grupo)
        .join(UsuarioGrupo, UsuarioGrupo.grupo_id == Grupo.id)
        .where(UsuarioGrupo.usuario_id == user.id)
    )
    grupos = session.exec(statement).all()

    # Contar miembros de cada grupo
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

    # Obtener miembros desde la tabla de relación
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