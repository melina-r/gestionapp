-- Esquema de Base de Datos GestionApp
-- Este script crea la estructura inicial de la base de datos

-- Crear tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    mail VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla grupos
CREATE TABLE IF NOT EXISTS grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    direccion TEXT,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla intermedia usuario_grupos
CREATE TABLE IF NOT EXISTS usuario_grupos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, grupo_id)
);

-- Crear tabla gastos con claves foráneas usuario_id y grupo_id
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    valor DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL,
    usuario_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    comprobante VARCHAR(500),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agregar restricciones de clave foránea
ALTER TABLE usuario_grupos
    ADD CONSTRAINT fk_usuario_grupos_usuario_id
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE usuario_grupos
    ADD CONSTRAINT fk_usuario_grupos_grupo_id
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;

ALTER TABLE gastos
    ADD CONSTRAINT fk_gastos_usuario_id
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

ALTER TABLE gastos
    ADD CONSTRAINT fk_gastos_grupo_id
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_mail ON usuarios(mail);
CREATE INDEX IF NOT EXISTS idx_grupos_nombre ON grupos(nombre);
CREATE INDEX IF NOT EXISTS idx_grupos_codigo ON grupos(codigo);
CREATE INDEX IF NOT EXISTS idx_usuario_grupos_usuario_id ON usuario_grupos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_grupos_grupo_id ON usuario_grupos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_usuario_id ON gastos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_gastos_grupo_id ON gastos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_gastos_valor ON gastos(valor);

-- Crear función para actualizar timestamp actualizado_en
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para actualización automática de actualizado_en
CREATE TRIGGER actualizar_usuarios_timestamp
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER actualizar_grupos_timestamp
    BEFORE UPDATE ON grupos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER actualizar_gastos_timestamp
    BEFORE UPDATE ON gastos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();