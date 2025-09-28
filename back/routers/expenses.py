from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from datetime import date
from decimal import Decimal
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from typing import Optional, List

router = APIRouter(
    prefix="/expenses",
    tags=["expenses"]
)

# Modelo Pydantic para validar los datos del gasto
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

# Modelo para actualización de gastos (todos los campos opcionales excepto ID)
class ExpenseUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    valor: Optional[float] = None
    fecha: Optional[date] = None
    autor: Optional[str] = None
    comprobante: Optional[str] = None

# Función para obtener conexión a la base de datos
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "gestionapp"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            port=os.getenv("DB_PORT", "5432")
        )
        return conn
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error conectando a la base de datos: {str(e)}")

@router.post("/", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate):
    """
    Crea un nuevo gasto en la base de datos
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Insertar el gasto en la base de datos
            insert_query = """
                INSERT INTO gastos (titulo, descripcion, valor, fecha, autor, usuario_id, comprobante)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante;
            """
            cursor.execute(insert_query, (
                expense.titulo,
                expense.descripcion,
                expense.valor,
                expense.fecha,
                expense.autor,
                expense.usuario_id,
                expense.comprobante
            ))
            
            # Obtener el gasto recién creado
            new_expense = cursor.fetchone()
            conn.commit()
            
            if new_expense:
                return ExpenseResponse(**dict(new_expense))
            else:
                raise HTTPException(status_code=500, detail="Error al crear el gasto")
                
    except psycopg2.IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error de integridad: {str(e)}")
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error en la base de datos: {str(e)}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
    finally:
        conn.close()

@router.get("/")
def list_expenses():
    """
    Lista todos los gastos de la base de datos
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                ORDER BY fecha DESC;
            """)
            expenses = cursor.fetchall()
            return [dict(expense) for expense in expenses]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos: {str(e)}")
    finally:
        conn.close()

@router.get("/{expense_id}")
def get_expense(expense_id: int):
    """
    Obtiene un gasto específico por ID
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE id = %s;
            """, (expense_id,))
            expense = cursor.fetchone()
            
            if expense:
                return dict(expense)
            else:
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener el gasto: {str(e)}")
    finally:
        conn.close()

@router.delete("/{expense_id}")
def delete_expense(expense_id: int):
    """
    Elimina un gasto específico por ID
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verificar si el gasto existe
            cursor.execute("SELECT id FROM gastos WHERE id = %s;", (expense_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            
            # Eliminar el gasto
            cursor.execute("DELETE FROM gastos WHERE id = %s;", (expense_id,))
            conn.commit()
            
            return {"message": f"Gasto con ID {expense_id} eliminado exitosamente"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el gasto: {str(e)}")
    finally:
        conn.close()

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense_update: ExpenseUpdate):
    """
    Actualiza un gasto específico por ID
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Verificar si el gasto existe
            cursor.execute("SELECT * FROM gastos WHERE id = %s;", (expense_id,))
            existing_expense = cursor.fetchone()
            if not existing_expense:
                raise HTTPException(status_code=404, detail="Gasto no encontrado")
            
            # Construir la query de actualización dinámicamente
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
            
            # Ejecutar la actualización
            update_values.append(expense_id)
            update_query = f"""
                UPDATE gastos 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante;
            """
            
            cursor.execute(update_query, update_values)
            updated_expense = cursor.fetchone()
            conn.commit()
            
            return ExpenseResponse(**dict(updated_expense))
            
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar el gasto: {str(e)}")
    finally:
        conn.close()

@router.get("/user/{user_id}")
def get_expenses_by_user(user_id: int):
    """
    Obtiene todos los gastos de un usuario específico
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE usuario_id = %s
                ORDER BY fecha DESC;
            """, (user_id,))
            expenses = cursor.fetchall()
            return [dict(expense) for expense in expenses]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos del usuario: {str(e)}")
    finally:
        conn.close()

@router.get("/group/{group_id}")
def get_expenses_by_group(group_id: int):
    """
    Obtiene todos los gastos de los usuarios que pertenecen a un grupo específico
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT g.id, g.titulo, g.descripcion, g.valor, g.fecha, g.autor, 
                       g.usuario_id, g.comprobante, u.nombre, u.apellido
                FROM gastos g
                JOIN usuario_grupos ug ON g.usuario_id = ug.usuario_id
                JOIN usuarios u ON g.usuario_id = u.id
                WHERE ug.grupo_id = %s
                ORDER BY g.fecha DESC;
            """, (group_id,))
            expenses = cursor.fetchall()
            return [dict(expense) for expense in expenses]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener gastos del grupo: {str(e)}")
    finally:
        conn.close()

@router.get("/filter/date")
def filter_expenses_by_date(
    fecha: date = Query(..., description="Fecha específica (YYYY-MM-DD)")
):
    """
    Filtra gastos por una fecha específica
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE fecha = %s
                ORDER BY fecha DESC;
            """, (fecha,))
            expenses = cursor.fetchall()
            return [dict(expense) for expense in expenses]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al filtrar gastos por fecha: {str(e)}")
    finally:
        conn.close()

@router.get("/filter/title")
def filter_expenses_by_title(
    titulo: str = Query(..., description="Texto a buscar en el título (búsqueda parcial)")
):
    """
    Filtra gastos por título (búsqueda parcial)
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT id, titulo, descripcion, valor, fecha, autor, usuario_id, comprobante
                FROM gastos
                WHERE titulo ILIKE %s
                ORDER BY fecha DESC;
            """, (f"%{titulo}%",))
            expenses = cursor.fetchall()
            return [dict(expense) for expense in expenses]
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Error al filtrar gastos por título: {str(e)}")
    finally:
        conn.close()
