-- Funciones Almacenadas: Bloques de código diseñados para calcular y devolver un único valor

-- Verificar si un vehiculo está actualmente dentro del conjunto
DELIMITER //
CREATE FUNCTION fn_vehiculo_esta_adentro(p_idvehiculo INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_resultado INT;
    
    SELECT COUNT(*) INTO v_resultado
    FROM control_vehicular
    WHERE idvehiculo = p_idvehiculo AND fecha_salida IS NULL;
    
    IF v_resultado > 0 THEN
        RETURN TRUE;  -- Está adentro
    ELSE
        RETURN FALSE; -- Está afuera
    END IF;
END;
//
DELIMITER ;

-- Función para saber si un empleado tiene advertencias disciplinarias graves
DELIMITER //
CREATE FUNCTION fn_empleado_tiene_faltas_graves(p_idempleado INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_existe INT;
    
    SELECT COUNT(*) INTO v_existe
    FROM advertencia_disciplinaria
    WHERE idempleado = p_idempleado AND nivel_gravedad = 'Grave';
    
    IF v_existe > 0 THEN
        RETURN TRUE;  -- Tiene al menos una falta grave
    ELSE
        RETURN FALSE; -- No tiene faltas graves
    END IF;
END;
//
DELIMITER ;

-- Función para verificar si un equipo asignado está actualmente prestado
DELIMITER //
CREATE FUNCTION fn_equipo_esta_prestado(p_idequipo INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_prestado INT;
    
    SELECT COUNT(*) INTO v_prestado
    FROM asignacion_equipo
    WHERE idequipo = p_idequipo AND fecha_devolucion IS NULL;
    
    IF v_prestado > 0 THEN
        RETURN TRUE;  -- Sigue en poder del empleado
    ELSE
        RETURN FALSE; -- Ya fue devuelto o nunca se prestó
    END IF;
END;
//
DELIMITER ;

-- Función para verificar si un empleado está en turno activo en este momento
DELIMITER //
CREATE FUNCTION fn_empleado_en_turno(p_idempleado INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_activo INT;
    
    SELECT COUNT(*) INTO v_activo
    FROM turno
    WHERE idempleado = p_idempleado 
      AND fecha = CURDATE() 
      AND estado = 'En Progreso';
    
    IF v_activo > 0 THEN
        RETURN TRUE;  -- Está de turno ahora mismo
    ELSE
        RETURN FALSE; -- No se encuentra en turno activo
    END IF;
END;
//
DELIMITER ;

-- Función para saber si una persona está dentro del conjunto
DELIMITER //
CREATE FUNCTION persona_esta_adentro(p_idpersona_acceso INT) 
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE v_resultado INT;
    
    SELECT COUNT(*) INTO v_resultado
    FROM registro_acceso
    WHERE idpersona_acceso = p_idpersona_acceso AND hora_salida IS NULL;
    
    IF v_resultado > 0 THEN
        RETURN TRUE;  -- Sigue dentro de la copropiedad
    ELSE
        RETURN FALSE; -- Ya salió o no ha ingresado
    END IF;
END;
//
DELIMITER ;