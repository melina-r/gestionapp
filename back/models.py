from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    mail: str = Field(max_length=255, unique=True, index=True)
    password: str = Field(max_length=255)
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    gastos: List["Gasto"] = Relationship(back_populates="usuario")
    grupos: List["UsuarioGrupo"] = Relationship(back_populates="usuario")  # sin link_model


class Gasto(SQLModel, table=True):
    __tablename__ = "gastos"

    id: Optional[int] = Field(default=None, primary_key=True)
    titulo: str = Field(max_length=255)
    descripcion: Optional[str] = None
    valor: float
    fecha: date = Field(index=True)
    autor: str = Field(max_length=100, index=True)
    usuario_id: int = Field(foreign_key="usuarios.id", index=True)
    comprobante: Optional[str] = Field(default=None, max_length=500)
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    usuario: Optional[Usuario] = Relationship(back_populates="gastos")


class Grupo(SQLModel, table=True):
    __tablename__ = "grupos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=255)
    direccion: Optional[str] = None
    descripcion: Optional[str] = None
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    miembros: List["UsuarioGrupo"] = Relationship(back_populates="grupo")


class UsuarioGrupo(SQLModel, table=True):
    __tablename__ = "usuario_grupos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id")
    grupo_id: int = Field(foreign_key="grupos.id")
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)

    usuario: Optional[Usuario] = Relationship(back_populates="grupos")
    grupo: Optional[Grupo] = Relationship(back_populates="miembros")


# DTOs para API
class UsuarioCreate(SQLModel):
    nombre: str
    apellido: str
    mail: str
    password: str


class UsuarioLogin(SQLModel):
    mail: str
    password: str


class UsuarioPublic(SQLModel):
    id: int
    nombre: str
    apellido: str
    mail: str
    creado_en: datetime


class GastoCreate(SQLModel):
    titulo: str
    descripcion: Optional[str] = None
    valor: float
    fecha: date
    autor: str
    usuario_id: int
    comprobante: Optional[str] = None


class GastoUpdate(SQLModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    valor: Optional[float] = None
    fecha: Optional[date] = None
    autor: Optional[str] = None
    comprobante: Optional[str] = None


class GastoPublic(SQLModel):
    id: int
    titulo: str
    descripcion: Optional[str]
    valor: float
    fecha: date
    autor: str
    usuario_id: int
    comprobante: Optional[str]
    creado_en: datetime

class GroupCreate(SQLModel):
    name: str
    email: str


# Actualizar referencias para forward refs
Usuario.update_forward_refs()
Grupo.update_forward_refs()
UsuarioGrupo.update_forward_refs()
