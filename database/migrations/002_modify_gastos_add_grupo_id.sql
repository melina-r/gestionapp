-- Migración: Modificar tabla gastos - agregar grupo_id y eliminar autor
-- Fecha: 2025-10-07
-- Descripción: Agrega campo grupo_id a gastos y elimina campo autor (el autor será usuario_id)

-- Agregar columna grupo_id
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS grupo_id INTEGER;

-- Agregar foreign key constraint
ALTER TABLE gastos
    ADD CONSTRAINT fk_gastos_grupo_id
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;

-- Crear índice para grupo_id
CREATE INDEX IF NOT EXISTS idx_gastos_grupo_id ON gastos(grupo_id);

-- Eliminar índice del campo autor (si existe)
DROP INDEX IF EXISTS idx_gastos_autor;

-- Eliminar columna autor
ALTER TABLE gastos DROP COLUMN IF EXISTS autor;
