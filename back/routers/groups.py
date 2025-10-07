from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List

from models import Grupo, GrupoCreate, GrupoPublic, Usuario, UsuarioGrupo
from database import get_session
from auth_utils import get_current_user

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)


@router.post("/", response_model=GrupoPublic)
def create_group(
    group: GrupoCreate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Create a new group (requires authentication)"""
    db_group = Grupo.model_validate(group)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


@router.get("/", response_model=List[GrupoPublic])
def list_groups(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """List all groups (requires authentication)"""
    statement = select(Grupo)
    groups = session.exec(statement).all()
    return groups


@router.get("/{group_id}", response_model=GrupoPublic)
def get_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get a specific group by ID (requires authentication)"""
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    return group


@router.post("/{group_id}/users/{user_id}")
def add_user_to_group(
    group_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Add a user to a group (requires authentication)"""
    # Verify group exists
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    # Verify user exists
    user = session.get(Usuario, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Check if relationship already exists
    statement = select(UsuarioGrupo).where(
        UsuarioGrupo.usuario_id == user_id,
        UsuarioGrupo.grupo_id == group_id
    )
    existing = session.exec(statement).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya pertenece al grupo")

    # Create relationship
    usuario_grupo = UsuarioGrupo(usuario_id=user_id, grupo_id=group_id)
    session.add(usuario_grupo)
    session.commit()

    return {"message": f"Usuario {user_id} agregado al grupo {group_id} exitosamente"}


@router.delete("/{group_id}/users/{user_id}")
def remove_user_from_group(
    group_id: int,
    user_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Remove a user from a group (requires authentication)"""
    statement = select(UsuarioGrupo).where(
        UsuarioGrupo.usuario_id == user_id,
        UsuarioGrupo.grupo_id == group_id
    )
    usuario_grupo = session.exec(statement).first()

    if not usuario_grupo:
        raise HTTPException(status_code=404, detail="El usuario no pertenece al grupo")

    session.delete(usuario_grupo)
    session.commit()

    return {"message": f"Usuario {user_id} removido del grupo {group_id} exitosamente"}


@router.get("/{group_id}/users", response_model=List[int])
def get_group_users(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Get all users in a group (requires authentication)"""
    # Verify group exists
    group = session.get(Grupo, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    statement = select(UsuarioGrupo.usuario_id).where(UsuarioGrupo.grupo_id == group_id)
    user_ids = session.exec(statement).all()
    return user_ids
