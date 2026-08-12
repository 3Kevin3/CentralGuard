create database centralguard;
use centralguard;

create table roles (
  idroles INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único secuencial de cada rol.',
  nombre_rol VARCHAR(50) NOT NULL COMMENT 'Nombre del perfil (Administrador, Supervisor, Vigilante).',
  PRIMARY KEY (`idroles`));


create table tipos_novedad (
  idtipo_novedad INT NOT NULL AUTO_INCREMENT COMMENT 'Código único de la categoría del incidente.',
  nombre_tipo VARCHAR(70) NOT NULL COMMENT 'Descripción del evento (Accidente, Robo, Ruido excesivo).',
  PRIMARY KEY (`idtipo_novedad`));


create table tipo_puesto (
  idtipo_puesto INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del tipo de puesto.',
  nombre_tipo VARCHAR(45) NOT NULL COMMENT 'Describe la categoría o naturaleza del puesto de vigilancia (Ej: \'Portería Principal\', \'Sótano\', \'Zona Social\').',
  PRIMARY KEY (`idtipo_puesto`));


create table usuarios (
  idusuario INT NOT NULL AUTO_INCREMENT COMMENT 'Llave primaria y control de cuenta de usuario.',
  idroles INT NOT NULL COMMENT 'Conecta la cuenta con sus permisos en el sistema.',
  usuario VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de usuario único para realizar el Login.',
  contraseña VARCHAR(255) NOT NULL COMMENT 'Contraseña cifrada de forma segura.',
  nombre VARCHAR(45) NOT NULL COMMENT 'Nombre del usuario.',
  apellido VARCHAR(45) NOT NULL COMMENT 'Apellido del usuario.',
  fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Registro de auditoría de cuándo se creó la cuenta.',
  PRIMARY KEY (`idusuario`),
  FOREIGN KEY (`idroles`)
	REFERENCES `centralguard`.`roles` (`idroles`));


create table tipo_telefono (
  idtipo_telefono INT NOT NULL COMMENT 'Identificador único (PK).',
  nombre_tipo VARCHAR(45) NOT NULL COMMENT 'Categoría del contacto (ej: \"Fijo\", \"Celular\", \"Emergencias\", \"Recepción\").',
  PRIMARY KEY (`idtipo_telefono`));


create table telefono (
  idtelefono INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del registro telefónico.',
  idtipo_telefono INT NOT NULL COMMENT 'Referencia a la categoría del teléfono (FK).',
  numero_contacto VARCHAR(15) NOT NULL COMMENT 'El número telefónico plano (celular o fijo de 7 a 10 dígitos).',
  PRIMARY KEY (`idtelefono`), 
  FOREIGN KEY (`idtipo_telefono`)
    REFERENCES `centralguard`.`tipo_telefono` (`idtipo_telefono`));


create table conjunto (
  idconjunto INT NOT NULL AUTO_INCREMENT COMMENT 'Código único del contrato/cliente corporativo.',
  nombre_conjunto VARCHAR(120) NOT NULL COMMENT 'Nombre oficial de la copropiedad o edificio.',
  nit_identificacion VARCHAR(45) NULL COMMENT 'Documento tributario (NIT) de la copropiedad.',
  nombre_contacto VARCHAR(45) NOT NULL COMMENT 'Nombre del administrador delegado del conjunto.',
  dirección VARCHAR(100) NOT NULL COMMENT 'Vincula al usuario con su dirección atómica en Bogotá cuando entidad_tipo = \'Empleado\'. Cumple las reglas de la 3FN.',
  idtelefono INT NOT NULL COMMENT 'Telefóno de la persona de contacto. (FK) ',
  correo_electronico VARCHAR(100) NULL COMMENT 'Correo para enviar reportes o facturas.',
  PRIMARY KEY (`idconjunto`),
  FOREIGN KEY (`idtelefono`)
	REFERENCES `centralguard`.`telefono` (`idtelefono`));


CREATE TABLE puesto_vigilancia (
    idpuesto_vigilancia INT NOT NULL AUTO_INCREMENT COMMENT 'Código del puesto físico de control.',
    idconjunto INT NOT NULL COMMENT 'Conjunto residencial al que pertenece este puesto.',
    idtipo_puesto INT NOT NULL COMMENT 'Tipo de frente de la tabla maestra.',
    nombre_identificador VARCHAR(100) NULL COMMENT 'Nombre específico (Ej: Portería Vehicular Norte).',
    PRIMARY KEY (idpuesto_vigilancia),
    FOREIGN KEY (idconjunto)
		REFERENCES centralguard.conjunto (idconjunto),
    FOREIGN KEY (idtipo_puesto)
        REFERENCES centralguard.tipo_puesto (idtipo_puesto));


create table tipo_documento ( 
  `idtipo_documento` INT NOT NULL,
  `nombre_tipo` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idtipo_documento`));

-- -----------------------------------------------------
-- Table `mydb`.`documento`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`documento` (
  `iddocumento` INT NOT NULL,
  `idtipo_documento` INT NOT NULL,
  `numero_documento` INT NOT NULL,
  PRIMARY KEY (`iddocumento`),
  INDEX `fk_documento_tipo_documento1_idx` (`idtipo_documento` ASC) VISIBLE,
  CONSTRAINT `fk_documento_tipo_documento1`
    FOREIGN KEY (`idtipo_documento`)
    REFERENCES `mydb`.`tipo_documento` (`idtipo_documento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`empleado`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`empleado` (
  `idempleado` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del expediente.',
  `idusuario` INT NOT NULL COMMENT 'Cuenta de usuario vinculada. No se repiten.',
  `iddocumento` INT NOT NULL,
  `fecha_nacimiento` DATE NOT NULL COMMENT 'Fecha de nacimiento para control de edad legal.',
  `historial_laboral` TEXT NULL COMMENT 'Trayectoria y empresas de seguridad previas.',
  `reconocimientos` TEXT NULL COMMENT 'Felicitaciones, medallas o logros en el servicio.',
  PRIMARY KEY (`idempleado`, `idusuario`),
  INDEX `fk_empleados_usuarios1_idx` (`idusuario` ASC) VISIBLE,
  INDEX `fk_empleado_documento1_idx` (`iddocumento` ASC) VISIBLE,
  CONSTRAINT `fk_empleados_usuarios1`
    FOREIGN KEY (`idusuario`)
    REFERENCES `mydb`.`usuarios` (`idusuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_empleado_documento1`
    FOREIGN KEY (`iddocumento`)
    REFERENCES `mydb`.`documento` (`iddocumento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`advertencia_disciplinaria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`advertencia_disciplinaria` (
  `idadvertencia_disciplinaria` INT NOT NULL AUTO_INCREMENT COMMENT 'Código del proceso disciplinario.',
  `idempleado` INT NOT NULL COMMENT 'Funcionario que cometió o recibió la falta.',
  `fecha` DATE NOT NULL COMMENT 'Fecha del suceso o reporte.',
  `motivo` VARCHAR(100) NOT NULL COMMENT 'Título corto de la infracción (Retardo, Abandono de puesto).',
  `descripcion` TEXT NOT NULL COMMENT 'Relato detallado de la falta observada.',
  `nivel_gravedad` ENUM('Leve', 'Moderado', 'Grave') NULL DEFAULT 'Leve' COMMENT 'Escala parametrizada: \'Leve\', \'Moderado\', \'Grave\'.',
  PRIMARY KEY (`idadvertencia_disciplinaria`),
  INDEX `fk_advertencias_disciplinarias_empleados1_idx` (`idempleado` ASC) VISIBLE,
  CONSTRAINT `fk_advertencias_disciplinarias_empleados1`
    FOREIGN KEY (`idempleado`)
    REFERENCES `mydb`.`empleado` (`idempleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`evaluacion_desempeño`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`evaluacion_desempeño` (
  `idevaluacion_desempeño` INT NOT NULL AUTO_INCREMENT COMMENT 'Código único de la evaluación.',
  `idempleado` INT NOT NULL COMMENT 'Funcionario operativo que está siendo evaluado.',
  `idusuario` INT NOT NULL COMMENT 'Administrador o Supervisor que ejecuta la calificación.',
  `fecha_evaluacion` DATE NOT NULL COMMENT 'Día en que se procesó la auditoría.',
  `puntaje_numerico` INT NOT NULL COMMENT 'Calificación cuantitativa (Escala métrica de 1 a 100).',
  `comentarios_retroalimentacion` VARCHAR(45) NULL COMMENT 'Sugerencias o felicitaciones cualitativas.',
  PRIMARY KEY (`idevaluacion_desempeño`),
  INDEX `fk_evaluaciones_desempeño_empleados1_idx` (`idempleado` ASC) VISIBLE,
  INDEX `fk_evaluaciones_desempeño_usuarios1_idx` (`idusuario` ASC) VISIBLE,
  CONSTRAINT `fk_evaluaciones_desempeño_empleados1`
    FOREIGN KEY (`idempleado`)
    REFERENCES `mydb`.`empleado` (`idempleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_evaluaciones_desempeño_usuarios1`
    FOREIGN KEY (`idusuario`)
    REFERENCES `mydb`.`usuarios` (`idusuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`equipo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`equipo` (
  `idequipo` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador interno del activo.',
  `nombre_activo` VARCHAR(100) NOT NULL COMMENT 'Nombre comercial de la herramienta (Radio Motorola, Linterna LED).',
  `serial_unico` VARCHAR(50) NOT NULL COMMENT 'Serial de fábrica único para evitar duplicación o fraudes.',
  `estado` ENUM('Excelente', 'Bueno', 'Regular', 'Deficiente', 'En Mantenimiento') NOT NULL,
  PRIMARY KEY (`idequipo`),
  UNIQUE INDEX `serial_unico_UNIQUE` (`serial_unico` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`asignacion_equipo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`asignacion_equipo` (
  `idasignacion_equipo` INT NOT NULL AUTO_INCREMENT COMMENT 'Código de la asignación.',
  `idusuario` INT NOT NULL COMMENT 'El trabajador que recibe el equipo y responde por él.',
  `idequipos` INT NOT NULL COMMENT 'El dispositivo tecnológico prestado.',
  `fecha_entrega` DATETIME NOT NULL COMMENT 'Fecha y hora exacta del desembolso de la dotación.',
  `fecha_devolucion` DATETIME NULL COMMENT 'Queda vacío hasta que el trabajador regrese el equipo al almacén.',
  `observaciones_entrega` VARCHAR(255) NULL COMMENT 'Notas sobre el estado del aparato al ser prestado.',
  PRIMARY KEY (`idasignacion_equipo`),
  INDEX `fk_asignaciones_equipo_equipos1_idx` (`idequipos` ASC) VISIBLE,
  INDEX `fk_asignaciones_equipo_usuarios1_idx` (`idusuario` ASC) VISIBLE,
  CONSTRAINT `fk_asignaciones_equipo_equipos1`
    FOREIGN KEY (`idequipos`)
    REFERENCES `mydb`.`equipo` (`idequipo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_asignaciones_equipo_usuarios1`
    FOREIGN KEY (`idusuario`)
    REFERENCES `mydb`.`usuarios` (`idusuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`turno`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`turno` (
  `idturno` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del cuadrante/turno.',
  `idusuario` INT NOT NULL,
  `idempleado` INT NOT NULL,
  `idpuesto_vigilancia` INT NOT NULL COMMENT 'La portería o frente exacto a custodiar.',
  `fecha` DATE NOT NULL COMMENT 'Día calendario programado para el turno.',
  `hora_inicio` TIME NOT NULL COMMENT 'Hora estipulada de entrada.',
  `hora_fin` TIME NOT NULL COMMENT 'Hora estipulada de salida.',
  `estado` ENUM('Programado', 'En Progreso', 'Cumplido', 'Cancelado', 'Inasistencia') NOT NULL,
  PRIMARY KEY (`idturno`),
  INDEX `fk_turnos_puestos_vigilancia1_idx` (`idpuesto_vigilancia` ASC) VISIBLE,
  INDEX `fk_turno_empleado1_idx` (`idempleado` ASC) VISIBLE,
  INDEX `fk_turno_usuarios1_idx` (`idusuario` ASC) VISIBLE,
  CONSTRAINT `fk_turnos_puestos_vigilancia1`
    FOREIGN KEY (`idpuesto_vigilancia`)
    REFERENCES `mydb`.`puesto_vigilancia` (`idpuesto_vigilancia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_turno_empleado1`
    FOREIGN KEY (`idempleado`)
    REFERENCES `mydb`.`empleado` (`idempleado`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_turno_usuarios1`
    FOREIGN KEY (`idusuario`)
    REFERENCES `mydb`.`usuarios` (`idusuario`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`ronda`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`ronda` (
  `idronda` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la ronda.',
  `idturno` INT NOT NULL COMMENT 'Vincula la ronda al turno activo para evitar fraudes horariós.',
  `hora_marcacion_inicio` TIME NOT NULL COMMENT 'Momento exacto en que soltó la base física.',
  `hora_marcacion_fin` TIME NOT NULL COMMENT 'Momento en que regresó a asegurar el puesto.',
  `puntos_validados` VARCHAR(255) NOT NULL COMMENT 'Resumen de los puntos de control validados (Ej: Botones 1 al 5).',
  `observaciones_ronda` TEXT NULL COMMENT 'Novedades menores encontradas en las áreas comunes.',
  PRIMARY KEY (`idronda`),
  INDEX `fk_rondas_turnos1_idx` (`idturno` ASC) VISIBLE,
  CONSTRAINT `fk_rondas_turnos1`
    FOREIGN KEY (`idturno`)
    REFERENCES `mydb`.`turno` (`idturno`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`empresa_procedencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`empresa_procedencia` (
  `idempresa_procedencia` INT NOT NULL COMMENT 'Llave primaria. Identificador único para cada entidad externa.',
  `nombre_empresa` VARCHAR(45) NOT NULL COMMENT 'Razón social o nombre comercial de la empresa proveedora.',
  PRIMARY KEY (`idempresa_procedencia`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`persona_acceso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`persona_acceso` (
  `idpersona_acceso` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del visitante en el sistema.',
  `primer_nombre` VARCHAR(50) NOT NULL COMMENT 'Primer nombre del visitante.',
  `primer_apellido` VARCHAR(50) NOT NULL COMMENT 'Primer apellido del visitante.',
  `tipo_persona` ENUM('Residente', 'Visitante', 'Domiciliario') NOT NULL COMMENT 'Define la categoría del sujeto (\'Residente\', \'Visitante\', \'Domiciliario\').',
  `idempresa_procedencia` INT NOT NULL COMMENT 'Llave foránea que indica la empresa a la que pertenece el visitante o domiciliario.',
  PRIMARY KEY (`idpersona_acceso`),
  INDEX `fk_persona_acceso_empresa_procedencia1_idx` (`idempresa_procedencia` ASC) VISIBLE,
  CONSTRAINT `fk_persona_acceso_empresa_procedencia1`
    FOREIGN KEY (`idempresa_procedencia`)
    REFERENCES `mydb`.`empresa_procedencia` (`idempresa_procedencia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`vehiculo`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`vehiculo` (
  `idvehiculo` INT NOT NULL COMMENT 'Identificador numérico del vehículo.',
  `placa` VARCHAR(15) NOT NULL COMMENT 'Matrícula única vehicular. Máximo filtro de auditoría vial.',
  `marca` VARCHAR(50) NULL COMMENT 'Características comerciales del coche (Mazda 3, Renault Logan).',
  `modelo` VARCHAR(45) NULL,
  `color` VARCHAR(20) NULL COMMENT 'Tono de pintura exterior del carro.',
  PRIMARY KEY (`idvehiculo`),
  UNIQUE INDEX `placa_UNIQUE` (`placa` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`registro_acceso`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`registro_acceso` (
  `idregistro_accesos` INT NOT NULL COMMENT 'Número único de radicado de la entrada.',
  `idturno` INT NOT NULL COMMENT 'Turno y vigilante que validó y autorizó el ingreso.',
  `idpersona_acceso` INT NOT NULL COMMENT 'Ciudadano que ingresa.',
  `apartamento_destino` VARCHAR(30) NOT NULL COMMENT 'Destino final que otorgó el permiso (Ej: Torre 3 Apto 402).',
  `hora_entrada` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora automatizada de entrada.',
  `hora_salida` TIMESTAMP NULL COMMENT 'Se llena cuando el guardia marca la salida física del recinto.',
  `observaciones_acceso` TEXT NULL COMMENT 'Detalles preventivos adicionales del ingreso.',
  PRIMARY KEY (`idregistro_accesos`),
  INDEX `fk_registro_accesos_turnos1_idx` (`idturno` ASC) VISIBLE,
  INDEX `fk_registro_accesos_visitantes1_idx` (`idpersona_acceso` ASC) VISIBLE,
  CONSTRAINT `fk_registro_accesos_turnos1`
    FOREIGN KEY (`idturno`)
    REFERENCES `mydb`.`turno` (`idturno`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_registro_accesos_visitantes1`
    FOREIGN KEY (`idpersona_acceso`)
    REFERENCES `mydb`.`persona_acceso` (`idpersona_acceso`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`novedades`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`novedades` (
  `idnovedades` INT NOT NULL AUTO_INCREMENT COMMENT 'Consecutivo único del informe de novedad.',
  `idturno` INT NOT NULL COMMENT 'Turno y funcionario que presenció y redactó el informe.',
  `idtipos_novedad` INT NOT NULL COMMENT 'Vínculo con la tabla maestra de categorías.',
  `hora_reporte` TIME NOT NULL COMMENT 'Momento exacto en que sucedió u se observó el evento.',
  `descripcion_hechos` TEXT NOT NULL COMMENT 'Narrativa descriptiva y técnica de lo ocurrido.',
  `idestadonovedad` INT NOT NULL COMMENT 'Llave foránea que vincula la novedad con su estado actual de resolución.',
  `estado` ENUM('Pendiente', 'En Proceso', 'Resuelta') NOT NULL,
  PRIMARY KEY (`idnovedades`),
  INDEX `fk_novedades_turnos1_idx` (`idturno` ASC) VISIBLE,
  INDEX `fk_novedades_tipos_novedad1_idx` (`idtipos_novedad` ASC) VISIBLE,
  CONSTRAINT `fk_novedades_turnos1`
    FOREIGN KEY (`idturno`)
    REFERENCES `mydb`.`turno` (`idturno`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_novedades_tipos_novedad1`
    FOREIGN KEY (`idtipos_novedad`)
    REFERENCES `mydb`.`tipos_novedad` (`idtipos_novedad`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`evidencia`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`evidencia` (
  `idevidencia` INT NOT NULL COMMENT 'Código identificador de la prueba.',
  `url_imagen_evidencia` VARCHAR(255) NOT NULL COMMENT 'Ruta de almacenamiento del archivo en el servidor.',
  `fecha_captura` TIMESTAMP NOT NULL COMMENT 'Fecha y hora en la que se subió el archivo.',
  `idnovedades` INT NOT NULL COMMENT 'Llave foránea que indica la llave principal de la tabla \"Novedades\".\n',
  PRIMARY KEY (`idevidencia`),
  INDEX `fk_evidencia_novedades1_idx` (`idnovedades` ASC) VISIBLE,
  CONSTRAINT `fk_evidencia_novedades1`
    FOREIGN KEY (`idnovedades`)
    REFERENCES `mydb`.`novedades` (`idnovedades`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`objeto_perdido`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`objeto_perdido` (
  `idobjeto_perdido` INT NOT NULL AUTO_INCREMENT COMMENT 'Número de inventario del objeto en custodia.',
  `idevidencia` INT NOT NULL COMMENT 'Permite asociar una evidencia fotográfica o documento al objeto encontrado o extraviado.',
  `idpuesto_vigilancia` INT NOT NULL COMMENT 'Portería o área común donde fue hallado/entregado.',
  `nombre_objeto` VARCHAR(45) NOT NULL COMMENT 'Título del artículo (Billetera, Llaves, Gafas).',
  `descripcion_detallada` TEXT NULL COMMENT 'Características específicas del estado del elemento.',
  `fecha_hallazgo` VARCHAR(45) NOT NULL COMMENT 'Día calendario del hallazgo.',
  `estado` ENUM('Entregado', 'En custodia', 'Desechado', 'Donado') NOT NULL,
  PRIMARY KEY (`idobjeto_perdido`),
  INDEX `fk_objetos_perdidos_puestos_vigilancia1_idx` (`idpuesto_vigilancia` ASC) VISIBLE,
  INDEX `fk_objetos_perdidos_evidencias1_idx` (`idevidencia` ASC) VISIBLE,
  CONSTRAINT `fk_objetos_perdidos_puestos_vigilancia1`
    FOREIGN KEY (`idpuesto_vigilancia`)
    REFERENCES `mydb`.`puesto_vigilancia` (`idpuesto_vigilancia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_objetos_perdidos_evidencias1`
    FOREIGN KEY (`idevidencia`)
    REFERENCES `mydb`.`evidencia` (`idevidencia`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`pedido`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`pedido` (
  `idpedidos` INT NOT NULL COMMENT 'Identificador único del pedido',
  `idregistro_accesos` INT NOT NULL COMMENT 'Llave foránea que vincula el pedido con el evento de entrada que lo originó.',
  `nombre_pedido` VARCHAR(100) NOT NULL COMMENT 'Ejemplo: \"Paquete Amazon\", \"Domicilio Comida\"',
  `descripcion` TEXT NULL COMMENT 'Detalles adicionales del paquete',
  `nombre_destinatario` VARCHAR(100) NULL COMMENT 'Nombre del residente que recibirá el pedido',
  `hora_llegada` TIMESTAMP NULL COMMENT 'Momento exacto de recepción en portería.',
  `estado` ENUM('Entregado', 'En custodia', 'Desechado', 'Donado') NOT NULL,
  PRIMARY KEY (`idpedidos`),
  INDEX `fk_pedido_registro_acceso1_idx` (`idregistro_accesos` ASC) VISIBLE,
  CONSTRAINT `fk_pedido_registro_acceso1`
    FOREIGN KEY (`idregistro_accesos`)
    REFERENCES `mydb`.`registro_acceso` (`idregistro_accesos`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`contrato`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`contrato` (
  `idcontrato` INT NOT NULL COMMENT 'Identificador único del contrato.',
  `idconjunto` INT NOT NULL COMMENT 'Relación hacia la tabla cliente_conjunto.',
  `fecha_inicio` DATE NOT NULL COMMENT 'Cuándo inicia el servicio.',
  `fecha_fin` DATE NULL COMMENT 'Cuándo termina (puedes dejarlo NULL si es indefinido).',
  `valor_mensual` DECIMAL NOT NULL COMMENT 'Costo del servicio.',
  `terminos_condiciones` TEXT NOT NULL COMMENT 'Campo para cláusulas adicionales o enlaces.',
  `idestadocontrato` INT NOT NULL COMMENT 'Llave foránea que referencia el estado actual del contrato (ej: Activo, Finalizado).',
  `estado` ENUM('Activo', 'Finalizado', 'Suspendido') NOT NULL,
  PRIMARY KEY (`idcontrato`),
  INDEX `fk_contrato_cliente_conjunto1_idx` (`idconjunto` ASC) VISIBLE,
  CONSTRAINT `fk_contrato_cliente_conjunto1`
    FOREIGN KEY (`idconjunto`)
    REFERENCES `mydb`.`conjunto` (`idconjunto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `mydb`.`vehiculos_personas`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `mydb`.`vehiculos_personas` (
  `id_vehiculo_persona` INT NOT NULL COMMENT 'Identificador único de la relación.',
  `id_vehiculo` INT NOT NULL COMMENT 'Llave foránea que conecta con la tabla vehiculos.',
  `id_personas_acceso` INT NOT NULL COMMENT 'Llave foránea que conecta con la tabla personas_acceso.',
  `es_conductor_principal` TINYINT NULL DEFAULT 1 COMMENT '1 si es el dueño/conductor principal, 0 si es ocasional.',
  PRIMARY KEY (`id_vehiculo`, `id_personas_acceso`, `id_vehiculo_persona`),
  INDEX `fk_vehiculo_has_persona_acceso_persona_acceso1_idx` (`id_personas_acceso` ASC) VISIBLE,
  INDEX `fk_vehiculo_has_persona_acceso_vehiculo1_idx` (`id_vehiculo` ASC) VISIBLE,
  CONSTRAINT `fk_vehiculo_has_persona_acceso_vehiculo1`
    FOREIGN KEY (`id_vehiculo`)
    REFERENCES `mydb`.`vehiculo` (`idvehiculo`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_vehiculo_has_persona_acceso_persona_acceso1`
    FOREIGN KEY (`id_personas_acceso`)
    REFERENCES `mydb`.`persona_acceso` (`idpersona_acceso`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
