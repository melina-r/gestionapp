from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from typing import List
import secrets
import string

from models import Grupo, GrupoCreate, GrupoPublic, Usuario, UsuarioGrupo
from database import get_session
from auth_utils import get_current_user

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)


def generate_group_code(length: int = 8) -> str:
    """Generate a random alphanumeric code for group invitation"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


@router.post("/", response_model=GrupoPublic)
def create_group(
    group: GrupoCreate,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Create a new group and automatically add the creator as a member (requires authentication)"""
    # Generate a unique code
    while True:
        codigo = generate_group_code()
        # Check if code already exists
        statement = select(Grupo).where(Grupo.codigo == codigo)
        existing = session.exec(statement).first()
        if not existing:
            break

    # Create group with the generated code
    group_data = group.model_dump()
    group_data["codigo"] = codigo
    db_group = Grupo(**group_data)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    # Automatically add the creator to the group
    usuario_grupo = UsuarioGrupo(usuario_id=current_user.id, grupo_id=db_group.id)
    session.add(usuario_grupo)
    session.commit()

    return db_group


@router.get("/", response_model=List[GrupoPublic])
def list_groups(
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """List groups where the current user is a member (requires authentication)"""
    # Get group IDs where the user is a member
    statement = select(UsuarioGrupo.grupo_id).where(UsuarioGrupo.usuario_id == current_user.id)
    grupo_ids = session.exec(statement).all()

    if not grupo_ids:
        return []

    # Get the actual groups
    statement = select(Grupo).where(Grupo.id.in_(grupo_ids))
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


@router.post("/join/{codigo}")
def join_group_by_code(
    codigo: str,
    session: Session = Depends(get_session),
    current_user: Usuario = Depends(get_current_user)
):
    """Join a group using its invitation code (requires authentication)"""
    # Find group by code
    statement = select(Grupo).where(Grupo.codigo == codigo.upper())
    group = session.exec(statement).first()

    if not group:
        raise HTTPException(status_code=404, detail="Código de grupo inválido")

    # Check if user is already in the group
    statement = select(UsuarioGrupo).where(
        UsuarioGrupo.usuario_id == current_user.id,
        UsuarioGrupo.grupo_id == group.id
    )
    existing = session.exec(statement).first()

    if existing:
        raise HTTPException(status_code=400, detail="Ya eres miembro de este grupo")

    # Add user to group
    usuario_grupo = UsuarioGrupo(usuario_id=current_user.id, grupo_id=group.id)
    session.add(usuario_grupo)
    session.commit()

    return {
        "message": f"Te has unido exitosamente al grupo '{group.nombre}'",
        "group": GrupoPublic.model_validate(group)
    }
