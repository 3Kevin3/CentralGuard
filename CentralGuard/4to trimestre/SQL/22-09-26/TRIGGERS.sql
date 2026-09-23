-- TRIGGERS: Acciones automáticas que se disparan solas

-- No permite que los vehiculos que no se han marcado como que salieron 
-- puedan volver a ingresar
DELIMITER //
CREATE TRIGGER control_vehiculo_activo 
BEFORE INSERT ON control_vehicular 
FOR EACH ROW 
BEGIN 
    IF EXISTS ( 
        SELECT 1  
        FROM control_vehicular  
        WHERE idvehiculo = NEW.idvehiculo AND fecha_salida IS NULL 
    ) THEN 
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Acceso denegado: Este vehículo ya se encuentra registrado dentro del conjunto.'; 
    END IF; 
END;
//
DELIMITER ;

-- Validar que un equipo no se asigne si ya se encuentra entregado y sin devolver
DELIMITER //
CREATE TRIGGER validar_hora_salida
BEFORE INSERT ON registro_acceso
FOR EACH ROW
BEGIN
    IF NEW.hora_salida IS NOT NULL AND NEW.hora_salida < NEW.hora_entrada THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: La hora de salida no puede ser anterior a la hora de entrada.';
    END IF;
END;
//
DELIMITER ;

--  Cambiar el estado del equipo a "en mantenimiento" si recibe una advertencia disciplinaria grave o similar
DELIMITER //
CREATE TRIGGER alidar_advertencia
BEFORE INSERT ON advertencia_disciplinaria
FOR EACH ROW
BEGIN
    IF TRIM(NEW.motivo) = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Error: El motivo de la advertencia disciplinaria no puede estar vacío.';
    END IF;
END;
//
DELIMITER ;

-- Controlar fecha de captura en la tabla evidencia
DELIMITER //
CREATE TRIGGER fecha_evidencia
BEFORE INSERT ON evidencia
FOR EACH ROW
BEGIN
    IF NEW.fecha_captura IS NULL THEN
        SET NEW.fecha_captura = CURRENT_TIMESTAMP;
    END IF;
END;
//
DELIMITER ;
