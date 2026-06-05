
DROP DATABASE IF EXISTS DB_SistemaSeguridad;
CREATE DATABASE DB_SistemaSeguridad;
USE DB_SistemaSeguridad;

-- ==========================================
-- 📂 MÓDULO 1: CONFIGURACIÓN MAESTRA Y ROLES
-- ==========================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE tipos_novedad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(70) NOT NULL UNIQUE
);

CREATE TABLE tipos_puesto (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(70) NOT NULL UNIQUE
);

-- ==========================================
-- 📂 MÓDULO 2: CUENTAS Y ENTIDADES CORE
-- ==========================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50) NULL,
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50) NULL,
    rol_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_razon_social VARCHAR(120) NOT NULL,
    nit_identificacion VARCHAR(20) NOT NULL UNIQUE,
    contacto_primer_nombre VARCHAR(50) NOT NULL,
    contacto_primer_apellido VARCHAR(50) NOT NULL,
    correo_electronico VARCHAR(100) NULL,
    fecha_inicio_contrato DATE NOT NULL,
    estado_contrato ENUM('Activo', 'Suspendido', 'Finalizado') DEFAULT 'Activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 📂 MÓDULO 3: LOCALIZACIÓN Y CONTACTO (3FN)
-- ==========================================

CREATE TABLE direcciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('Cliente', 'Empleado', 'Puesto') NOT NULL,
    entidad_id INT NOT NULL,
    ciudad VARCHAR(30) NOT NULL DEFAULT 'Bogotá',
    barrio_localidad VARCHAR(80) NOT NULL,
    direccion_completa VARCHAR(150) NOT NULL,
    detalles_structure VARCHAR(100) NULL
);

CREATE TABLE telefonos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entidad_tipo ENUM('Cliente', 'Empleado', 'Emergencia') NOT NULL,
    entidad_id INT NOT NULL,
    numero_contacto VARCHAR(15) NOT NULL
);

CREATE TABLE puestos_vigilancia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo_puesto_id INT NOT NULL,
    nombre_identificador VARCHAR(100) NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_puesto_id) REFERENCES tipos_puesto(id)
);

-- ==========================================
-- 📂 MÓDULO 4: TALENTO HUMANO Y EVALUACIONES
-- ==========================================

CREATE TABLE empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    documento_identidad VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE NOT NULL,
    historial_laboral TEXT NULL,
    reconocimientos TEXT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE advertencias_disciplinarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    fecha DATE NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT NOT NULL,
    nivel_gravedad ENUM('Leve', 'Moderado', 'Grave') DEFAULT 'Leve',
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

CREATE TABLE evaluaciones_desempeno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT NOT NULL,
    evaluador_id INT NOT NULL,
    fecha_evaluacion DATE NOT NULL,
    puntaje_numerico INT NOT NULL,
    comentarios_retroalimentacion TEXT NULL,
    FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES usuarios(id)
);

-- ==========================================
-- 📂 MÓDULO 5: LOGÍSTICA DE ACTIVOS
-- ==========================================

CREATE TABLE equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_activo VARCHAR(100) NOT NULL,
    serial_unico VARCHAR(50) NOT NULL UNIQUE,
    estado_equipo ENUM('Excelente', 'Bueno', 'Regular', 'Deficiente', 'En Mantenimiento') DEFAULT 'Excelente'
);

CREATE TABLE asignaciones_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    responsable_id INT NOT NULL,
    fecha_entrega DATETIME NOT NULL,
    fecha_devolucion DATETIME NULL,
    observaciones_entrega VARCHAR(255) NULL,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id),
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
);

-- ==========================================
-- 📂 MÓDULO 6: OPERACIÓN DIARIA Y ACCESOS
-- ==========================================

CREATE TABLE turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vigilante_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    puesto_vigilancia_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado_turno ENUM('Programado', 'En Progreso', 'Cumplido', 'Cancelado', 'Inasistencia') DEFAULT 'Programado',
    FOREIGN KEY (vigilante_id) REFERENCES usuarios(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id),
    FOREIGN KEY (puesto_vigilancia_id) REFERENCES puestos_vigilancia(id)
);

CREATE TABLE rondas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    hora_marcacion_inicio TIME NOT NULL,
    hora_marcacion_fin TIME NOT NULL,
    puntos_validados VARCHAR(255) NOT NULL,
    observaciones_ronda TEXT NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE CASCADE
);

CREATE TABLE visitantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50) NULL,
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50) NULL,
    documento_identidad VARCHAR(25) NOT NULL UNIQUE,
    empresa_procedencia VARCHAR(100) NULL
);

CREATE TABLE vehiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    placa VARCHAR(15) NOT NULL UNIQUE,
    marca_modelo VARCHAR(50) NULL,
    color VARCHAR(20) NULL
);

CREATE TABLE registro_accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    visitante_id INT NOT NULL,
    vehiculo_id INT NULL, -- NULL si entra a pie, tal cual tus interfaces
    apartamento_destino VARCHAR(30) NOT NULL,
    tipo_ingreso ENUM('Residente', 'Visitante', 'Domiciliario', 'Proveedor', 'Contratista') NOT NULL,
    hora_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_salida TIMESTAMP NULL,
    observaciones_acceso TEXT NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id),
    FOREIGN KEY (visitante_id) REFERENCES visitantes(id),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

-- ==========================================
-- 📂 MÓDULO 7: CONTINGENCIAS Y CUSTODIAS
-- ==========================================

CREATE TABLE novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    tipo_novedad_id INT NOT NULL,
    hora_reporte TIME NOT NULL,
    descripcion_hechos TEXT NOT NULL,
    estado_novedad ENUM('Pendiente', 'En Mitigación', 'Resuelta') DEFAULT 'Pendiente',
    FOREIGN KEY (turno_id) REFERENCES turnos(id),
    FOREIGN KEY (tipo_novedad_id) REFERENCES tipos_novedad(id)
);

CREATE TABLE evidencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    novedad_id INT NOT NULL,
    url_archivo_evidencia VARCHAR(255) NOT NULL,
    fecha_captura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (novedad_id) REFERENCES novedades(id) ON DELETE CASCADE
);

CREATE TABLE objetos_perdidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puesto_vigilancia_id INT NOT NULL,
    nombre_objeto VARCHAR(100) NOT NULL,
    descripcion_detallada TEXT NULL,
    fecha_hallazgo DATE NOT NULL,
    estado_objeto ENUM('En Custodia', 'Entregado a Propietario', 'Desechado / Donado') DEFAULT 'En Custodia',
    FOREIGN KEY (puesto_vigilancia_id) REFERENCES puestos_vigilancia(id)
);

-- =====================================================================
-- INSERCIÓN DE ROLES BASE OBLIGATORIOS PARA LOGIN
-- =====================================================================
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Supervisor'), ('Vigilante');