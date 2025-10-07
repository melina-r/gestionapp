-- Migración: Agregar campo 'codigo' a la tabla grupos
-- Fecha: 2025-10-07
-- Descripción: Agrega un campo de código alfanumérico único para invitaciones a grupos

-- Agregar columna codigo a tabla grupos
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS codigo VARCHAR(10) UNIQUE;

-- Crear índice para búsquedas por código
CREATE INDEX IF NOT EXISTS idx_grupos_codigo ON grupos(codigo);

-- Generar códigos para grupos existentes (si los hay)
-- Nota: Este código debe ejecutarse manualmente o ajustarse según necesidad
-- UPDATE grupos SET codigo = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) WHERE codigo IS NULL;
