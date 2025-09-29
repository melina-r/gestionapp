from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from datetime import date
from typing import Optional
import os
import psycopg2
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/expenses", tags=["expenses"])

class ExpenseCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    valor: float
    fecha: date
    autor: str
    usuario_id: int
    comprobante: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    titulo: str
    descripcion: Optional[str]
    valor: float
    fecha: date
    autor: str
    usuario_id: int
    comprobante: Optional[str]

class ExpenseUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    valor: Optional[float] = None
    fecha: Optional[date] = None
    autor: Optional[str] = None
    comprobante: Optional[str] = None

def get_db_connection():
    try:
        host = os.getenv("DB_HOST", "localhost")
        db   = os.getenv("DB_NAME", "gestionapp")
        user = os.getenv("DB_USER", "gestionuser")
        pwd  = os.getenv("DB_PASSWORD", "gestionpass")
        port = os.getenv("DB_PORT", "5432")

        return psycopg2.connect(
            host=host, database=db, user=user, password=pwd, port=port
        )
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error conectando a la base de datos: {e.pgerror or str(e)}")

@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                INSERT INTO gastos (titulo, descripcion, valor, fecha, autor, usuario_id, comprobante)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante;
                """,
                (
                    expense.titulo,
                    expense.descripcion,
                    expense.valor,
                    expense.fecha,
                    expense.autor,
                    expense.usuario_id,
                    expense.comprobante,
                ),
            )
            row = cursor.fetchone()
            conn.commit()
            if not row:
                raise HTTPException(status_code=500, detail="Error al crear el gasto")
            return ExpenseResponse(**dict(row))
    except psycopg2.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error de integridad: {e.pgerror or str(e)}")
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/")
def list_expenses():
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                ORDER BY fecha DESC;
                """
            )
            return [dict(r) for r in cursor.fetchall()]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/{expense_id}")
def get_expense(expense_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE id = %s;
                """,
                (expense_id,),
            )
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            return dict(row)
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el gasto: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id FROM gastos WHERE id = %s;", (expense_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            cursor.execute("DELETE FROM gastos WHERE id = %s;", (expense_id,))
            conn.commit()
            return {"message": f"Gasto con ID {expense_id} eliminado exitosamente"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el gasto: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_update: ExpenseUpdate):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM gastos WHERE id = %s;", (expense_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Gasto no encontrado")

            update_fields = []
            update_values = []

            if expense_update.titulo is not None:
                update_fields.append("titulo = %s")
                update_values.append(expense_update.titulo)
            if expense_update.descripcion is not None:
                update_fields.append("descripcion = %s")
                update_values.append(expense_update.descripcion)
            if expense_update.valor is not None:
                update_fields.append("valor = %s")
                update_values.append(expense_update.valor)
            if expense_update.fecha is not None:
                update_fields.append("fecha = %s")
                update_values.append(expense_update.fecha)
            if expense_update.autor is not None:
                update_fields.append("autor = %s")
                update_values.append(expense_update.autor)
            if expense_update.comprobante is not None:
                update_fields.append("comprobante = %s")
                update_values.append(expense_update.comprobante)

            if not update_fields:
                raise HTTPException(status_code=400, detail="No se proporcionaron campos para actualizar")

            update_values.append(expense_id)
            query = f"""
                UPDATE gastos
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante;
            """
            cursor.execute(query, update_values)
            row = cursor.fetchone()
            conn.commit()
            return ExpenseResponse(**dict(row))
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar el gasto: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/user/{user_id}")
def get_expenses_by_user(user_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE usuario_id = %s
                ORDER BY fecha DESC;
                """,
                (user_id,),
            )
            return [dict(r) for r in cursor.fetchall()]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos del usuario: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/group/{group_id}")
def get_expenses_by_group(group_id: int):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT g.id, g.titulo, g.descripcion, g.valor, g.fecha, g.autor,
                       g.usuario_id, g.comprobante, u.nombre, u.apellido
                FROM gastos g
                JOIN usuario_grupos ug ON g.usuario_id = ug.usuario_id
                JOIN usuarios u ON g.usuario_id = u.id
                WHERE ug.grupo_id = %s
                ORDER BY g.fecha DESC;
                """,
                (group_id,),
            )
            return [dict(r) for r in cursor.fetchall()]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos del grupo: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/filter/date")
def filter_expenses_by_date(fecha: date = Query(..., description="Fecha (YYYY-MM-DD)")):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE fecha = %s
                ORDER BY fecha DESC;
                """,
                (fecha,),
            )
            return [dict(r) for r in cursor.fetchall()]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al filtrar gastos por fecha: {e.pgerror or str(e)}")
    finally:
        conn.close()

@router.get("/filter/title")
def filter_expenses_by_title(titulo: str = Query(..., description="Texto a buscar en el título")):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                """
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE titulo ILIKE %s
                ORDER BY fecha DESC;
                """,
                (f"%{titulo}%",),
            )
            return [dict(r) for r in cursor.fetchall()]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al filtrar gastos por título: {e.pgerror or str(e)}")
    finally:
        conn.close()
