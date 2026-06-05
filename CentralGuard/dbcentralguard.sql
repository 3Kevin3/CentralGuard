CREATE DATABASE IF NOT EXISTS sistema_vigilancia_saas;
USE sistema_vigilancia_saas;

-- ========================================================
-- 1. TABLAS DE SEGURIDAD Y ROLES
-- ========================================================
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    rol_id INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ========================================================
-- 2. TABLAS ADMINISTRATIVAS Y DE UBICACIÓN
-- ========================================================
CREATE TABLE clientes_conjuntos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_conjunto VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    ciudad VARCHAR(50) NOT NULL,
    persona_contacto VARCHAR(100),
    telefono VARCHAR(20),
    correo_electronico VARCHAR(100),
    fecha_inicio_contrato DATE,
    estado_contrato ENUM('Activo', 'Suspendido', 'Finalizado') DEFAULT 'Activo'
);

CREATE TABLE empleados_hoja_vida (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNIQUE,
    documento_identidad VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(150),
    historial_laboral TEXT,
    reconocimientos TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE advertencias_disciplinarias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empleado_id INT,
    fecha DATE NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    nivel ENUM('Leve', 'Moderado', 'Grave') DEFAULT 'Leve',
    FOREIGN KEY (empleado_id) REFERENCES empleados_hoja_vida(id) ON DELETE CASCADE
);

-- ========================================================
-- 3. TABLAS OPERATIVAS Y DE RECURSOS
-- ========================================================
CREATE TABLE turnos_programacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT, -- Vigilante
    supervisor_id INT,
    conjunto_id INT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_finalizacion TIME NOT NULL,
    puesto_trabajo ENUM('Portería principal', 'Portería secundaria', 'Recepción', 'Parqueadero', 'Torre residencial', 'Zona social', 'Piscina', 'Ronda perimetral') NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (supervisor_id) REFERENCES usuarios(id),
    FOREIGN KEY (conjunto_id) REFERENCES clientes_conjuntos(id) ON DELETE CASCADE
);

CREATE TABLE libro_rondas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT,
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_finalizacion TIME NOT NULL,
    sector_recorrido VARCHAR(100) NOT NULL,
    observaciones TEXT,
    FOREIGN KEY (turno_id) REFERENCES turnos_programacion(id) ON DELETE CASCADE
);

CREATE TABLE registro_accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT,
    nombre_persona VARCHAR(100) NOT NULL,
    placa_vehiculo VARCHAR(20) NULL,
    apartamento_destino VARCHAR(20) NOT NULL,
    tipo_ingreso ENUM('Residente', 'Visitante', 'Domiciliario', 'Proveedor', 'Contratista') NOT NULL,
    hora_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hora_salida TIMESTAMP NULL,
    observaciones TEXT,
    FOREIGN KEY (turno_id) REFERENCES turnos_programacion(id) ON DELETE CASCADE
);

CREATE TABLE novedades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    tipo_novedad ENUM('Accidente', 'Daño en infraestructura', 'Queja de residente', 'Emergencia médica', 'Vehículo sospechoso', 'Ruido excesivo', 'Otro') NOT NULL,
    descripcion TEXT NOT NULL,
    evidencia_fotografica VARCHAR(255) NULL,
    estado_novedad ENUM('Pendiente', 'En proceso', 'Resuelta') DEFAULT 'Pendiente',
    FOREIGN KEY (turno_id) REFERENCES turnos_programacion(id) ON DELETE CASCADE
);

CREATE TABLE objetos_perdidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    objeto_encontrado VARCHAR(100) NOT NULL,
    lugar_encontrado VARCHAR(100) NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT,
    fotografia VARCHAR(255) NULL,
    estado ENUM('Encontrado', 'Entregado', 'En custodia') DEFAULT 'Encontrado'
);

CREATE TABLE equipos_dotacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo ENUM('Radio de comunicación', 'Linterna', 'Uniforme', 'Bastón de seguridad', 'Chaleco reflectivo', 'Llaves', 'Dispositivo móvil') NOT NULL,
    fecha_entrega DATE NOT NULL,
    estado ENUM('Excelente', 'Bueno', 'Regular', 'Deficiente') DEFAULT 'Excelente',
    responsable_id INT,
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
);

-- ========================================================
-- INSERCIÓN DE DATOS SEMILLA (SEEDS)
-- ========================================================
INSERT INTO roles (id, nombre) VALUES (1, 'Administrador'), (2, 'Supervisor'), (3, 'Vigilante');