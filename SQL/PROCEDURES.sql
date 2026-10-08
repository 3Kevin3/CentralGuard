-- Stored Procedures: Bloques de código que ejecutan acciones y operaciones bajo demanda mediante la orden CALL.

-- Añadir persona a la base de datos
DELIMITER //
CREATE PROCEDURE registrar_persona_acceso(
    IN p_primer_nombre VARCHAR(50),
    IN p_primer_apellido VARCHAR(50),
    IN p_tipo_persona ENUM('Residente', 'Visitante', 'Domiciliario'),
    IN p_idempresa_procedencia INT
)
BEGIN
    IF p_tipo_persona <> 'Residente' AND p_idempresa_procedencia IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM empresa_procedencia WHERE idempresa_procedencia = p_idempresa_procedencia) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: El ID de la empresa de procedencia especificada no existe.';
        END IF;
    END IF;

    INSERT INTO persona_acceso (primer_nombre, primer_apellido, tipo_persona, idempresa_procedencia)
    VALUES (p_primer_nombre, p_primer_apellido, p_tipo_persona, 
            CASE WHEN p_tipo_persona = 'Residente' THEN NULL ELSE p_idempresa_procedencia END);
END;
//
DELIMITER ;

-- Registrar un nuevo acceso de persona 
DELIMITER //
CREATE PROCEDURE registrar_acceso_persona(
    IN p_idturno INT,
    IN p_idpersona_acceso INT,
    IN p_apartamento_destino VARCHAR(30),
    IN p_observaciones TEXT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM turno WHERE idturno = p_idturno) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El ID de turno especificado no existe.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM persona_acceso WHERE idpersona_acceso = p_idpersona_acceso) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: La persona de acceso especificada no existe.';
    END IF;

    INSERT INTO registro_acceso (idturno, idpersona_acceso, apartamento_destino, observaciones_acceso)
    VALUES (p_idturno, p_idpersona_acceso, p_apartamento_destino, p_observaciones);
END;
//
DELIMITER ;

-- Registrar la salida de una persona en el control de acceso
DELIMITER //
CREATE PROCEDURE registrar_salida_acceso(
    IN p_idregistro_acceso INT
)
BEGIN
    UPDATE registro_acceso
    SET hora_salida = CURRENT_TIMESTAMP
    WHERE idregistro_acceso = p_idregistro_acceso AND hora_salida IS NULL;
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No se encontró un registro de acceso activo con ese ID o ya tiene hora de salida.';
    END IF;
END;
//
DELIMITER ;

-- Registrar una nueva novedad en un turno de vigilancia
DELIMITER //
CREATE PROCEDURE registrar_novedad(
    IN p_idturno INT,
    IN p_idtipo_novedad INT,
    IN p_descripcion TEXT,
    IN p_estado VARCHAR(20)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM turno WHERE idturno = p_idturno) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El ID de turno especificado no existe.';
    END IF;

    INSERT INTO novedades (idturno, idtipo_novedad, hora_reporte, descripcion_hechos, estado)
    VALUES (p_idturno, p_idtipo_novedad, CURRENT_TIME(), p_descripcion, p_estado);
END;
//
DELIMITER ;


-- Actualizar el estado de un pedido (Entregado, En custodia, etc.)
DELIMITER //
CREATE PROCEDURE actualizar_estado_pedido(
    IN p_idpedidos INT,
    IN p_nuevo_estado VARCHAR(30)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pedido WHERE idpedidos = p_idpedidos) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El pedido especificado no existe.';
    END IF;

    -- Realizar la actualización del estado
    UPDATE pedido
    SET estado = p_nuevo_estado
    WHERE idpedidos = p_idpedidos;
END;
//
DELIMITER ;

-- Registrar entrada de vehiculo
DELIMITER //
CREATE PROCEDURE registrar_ingreso_vehiculo(
    IN p_idvehiculo INT,
    IN p_idturno INT,
    IN p_observaciones TEXT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vehiculo WHERE idvehiculo = p_idvehiculo) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El ID del vehículo especificado no existe.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM turno WHERE idturno = p_idturno) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El ID de turno especificado no existe.';
    END IF;

    INSERT INTO control_vehicular (idvehiculo, idturno, observaciones)
    VALUES (p_idvehiculo, p_idturno, p_observaciones);
END;
//
DELIMITER ;

-- Registrar un usuario con la contraseña protegida (SHA-256 + salt aleatorio)
DELIMITER //
CREATE PROCEDURE sp_registrar_usuario(
    IN p_idroles INT,
    IN p_usuario VARCHAR(50),
    IN p_contrasena VARCHAR(100),
    IN p_nombre VARCHAR(45),
    IN p_apellido VARCHAR(45)
)
BEGIN
    DECLARE v_salt CHAR(32);
    SET v_salt = MD5(CONCAT(UUID(), RAND()));

    INSERT INTO usuarios (idroles, usuario, `contraseña`, salt, nombre, apellido)
    VALUES (p_idroles, p_usuario,
            SHA2(CONCAT(v_salt, p_contrasena), 256),
            v_salt, p_nombre, p_apellido);
END;
//
DELIMITER ;