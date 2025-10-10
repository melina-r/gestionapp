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
    grupo_id: Optional[int] = Field(foreign_key="grupos.id", index=True)
    comprobante: Optional[str] = Field(default=None, max_length=500)
    creado_en: Optional[datetime] = Field(default_factory=datetime.now)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.now)

    usuario: Optional[Usuario] = Relationship(back_populates="gastos")
    grupo: Optional["Grupo"] = Relationship(back_populates="gastos")  # Add back_populates

class Deuda(SQLModel, table=True):
    __tablename__ = "deudas"

    id: Optional[int] = Field(default=None, primary_key=True)
    gasto_id: int = Field(foreign_key="gastos.id", index=True)  
    deudor_id: int = Field(foreign_key="usuarios.id", index=True)
    acreedor_id: int = Field(foreign_key="usuarios.id", index=True)
    estado: int = Field(default=0)  # 0: pendiente, 1: pagado, etc
    grupo_id: int = Field(foreign_key="grupos.id", index=True)
    monto: float
    creado_en: Optional[datetime] = Field(default_factory=datetime.now)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.now)

    # Relationships
    deudor: Optional["Usuario"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Deuda.deudor_id]"}
    )
    acreedor: Optional["Usuario"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Deuda.acreedor_id]"}
    )
    grupo: Optional["Grupo"] = Relationship()


class Grupo(SQLModel, table=True):
    __tablename__ = "grupos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=255)
    direccion: Optional[str] = None
    descripcion: Optional[str] = None
    creado_en: Optional[datetime] = Field(default_factory=datetime.now)
    actualizado_en: Optional[datetime] = Field(default_factory=datetime.now)

    # Relationships
    gastos: List["Gasto"] = Relationship(back_populates="grupo")
    miembros: List["UsuarioGrupo"] = Relationship(back_populates="grupo")

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
    grupo_id: int 
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

class GrupoCreate(SQLModel):
    nombre: str
    direccion: Optional[str] = None
    descripcion: Optional[str] = None

class GrupoUpdate(SQLModel):
    nombre: Optional[str] = None
    direccion: Optional[str] = None
    descripcion: Optional[str] = None

class GrupoPublic(SQLModel):
    id: int
    nombre: str
    direccion: Optional[str]
    descripcion: Optional[str]
    creado_en: datetime  # Add missing field

class UsuarioGrupo(SQLModel, table=True):
    __tablename__ = "usuario_grupos"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuarios.id", index=True)
    grupo_id: int = Field(foreign_key="grupos.id", index=True)
    creado_en: Optional[datetime] = Field(default_factory=datetime.utcnow)  # Change to utcnow

    # Relationships
    usuario: Optional["Usuario"] = Relationship(back_populates="grupos")  # Add back_populates
    grupo: Optional["Grupo"] = Relationship(back_populates="miembros")  # Add back_populates

# Actualizar referencias para forward refs
Usuario.update_forward_refs()
Grupo.update_forward_refs()
UsuarioGrupo.update_forward_refs()
