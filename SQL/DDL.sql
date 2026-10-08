create database centralguard;
use centralguard;

create table roles (
idroles int not null auto_increment comment 'Identificador único secuencial de cada rol.',
nombre_rol varchar(50) not null comment 'Nombre del perfil (Administrador, Supervisor, Vigilante).',
primary key (idroles));

create table tipo_novedad (
idtipo_novedad int not null auto_increment comment 'Código único de la categoría del incidente.',
nombre_tipo varchar(70) not null comment 'Descripción del evento (Accidente, Robo, Ruido excesivo).',
primary key (idtipo_novedad));

create table tipo_puesto (
idtipo_puesto INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único del tipo de puesto.',
nombre_tipo VARCHAR(45) NOT NULL COMMENT 'Describe la categoría o naturaleza del puesto de vigilancia.',
primary key (`idtipo_puesto`));

create table usuarios (
idusuario int not null auto_increment comment 'Llave primaria y control de cuenta de usuario.',
idroles int not null comment 'Conecta la cuenta con sus permisos en el sistema.',
usuario varchar(50) not null unique comment 'Nombre de usuario único para realizar el login.',
`contraseña` char(64) not null comment 'Hash SHA-256 de (salt + contraseña).',
salt char(32) not null comment 'Valor aleatorio único por usuario usado para el hash.',
nombre varchar(45) not null comment 'Nombre del usuario.',
apellido varchar(45) not null comment 'Apellido del usuario.',
fecha_creacion timestamp null default current_timestamp comment 'Registro de auditoría de cuándo se creó la cuenta.',
primary key (idusuario),
foreign key (idroles)
references centralguard.roles (idroles));

create table tipo_telefono (
idtipo_telefono int not null comment 'Identificador único (PK).',
nombre_tipo varchar(45) not null comment 'Categoría del contacto.',
primary key (idtipo_telefono));

create table telefono (
idtelefono int not null auto_increment comment 'Identificador único del registro telefónico.',
idtipo_telefono int not null comment 'Referencia a la categoría del teléfono (FK).',
numero_contacto varchar(15) not null comment 'El número telefónico plano.',
primary key (idtelefono),
foreign key (idtipo_telefono)
references centralguard.tipo_telefono (idtipo_telefono));

create table conjunto (
idconjunto int not null auto_increment comment 'Código único del cliente corporativo.',
nombre_conjunto varchar(120) not null comment 'Nombre oficial de la copropiedad o edificio.',
nit_identificacion varchar(45) null comment 'Documento tributario (NIT).',
nombre_contacto varchar(45) not null comment 'Nombre del administrador delegado.',
dirección varchar(100) not null comment 'Dirección del conjunto.',
idtelefono int not null comment 'Teléfono de la persona de contacto. (FK)',
correo_electronico varchar(100) null comment 'Correo para reportes o facturas.',
primary key (idconjunto),
foreign key (idtelefono)
references centralguard.telefono (idtelefono));

create table puesto_vigilancia (
idpuesto_vigilancia int not null auto_increment comment 'Código del puesto físico de control.',
idconjunto int not null comment 'Conjunto residencial al que pertenece.',
idtipo_puesto int not null comment 'Tipo de frente de la tabla maestra.',
nombre_identificador varchar(100) null comment 'Nombre específico.',
primary key (idpuesto_vigilancia),
foreign key (idconjunto)
references centralguard.conjunto (idconjunto),
foreign key (idtipo_puesto)
references centralguard.tipo_puesto (idtipo_puesto));

create table documento (  
iddocumento int not null auto_increment COMMENT 'Identificador único del documento.',
numero_documento varchar(45) not null COMMENT 'Número de identificación.',
primary key (`iddocumento`)
);  

create table empleado (
idempleado int not null auto_increment COMMENT 'Identificador interno del expediente.',
idusuario int not null comment 'Cuenta de usuario vinculada.',
iddocumento int not null comment 'Referencia a la tabla del documento (FK).',
fecha_nacimiento date not null comment 'Fecha de nacimiento.',
historial_laboral text null comment 'Trayectoria previa.',
reconocimientos text null comment 'Logros en el servicio.',
primary key (`idempleado`,`idusuario`),
index `fk_empleados_usuarios1_idx` (`idusuario` ASC),
index `fk_empleado_documento1_idx` (`iddocumento` ASC),
constraint `fk_empleados_usuarios1` foreign key (`idusuario`) references `centralguard`.`usuarios` (`idusuario`)
on delete no action
on update no action,
constraint `fk_empleado_documento1` foreign key (`iddocumento`) references `centralguard`.`documento` (`iddocumento`)
on delete no action
on update no action);

create table advertencia_disciplinaria (  
idadvertencia_disciplinaria int not null auto_increment comment 'Código del proceso disciplinario.',
idempleado int not null comment 'Funcionario que cometió o recibió la falta.',
fecha date not null comment 'Fecha del suceso.',
motivo varchar(100) not null comment 'Título corto de la infracción.',
descripcion varchar(100) not null comment 'Relato detallado.',
nivel_gravedad ENUM('Leve', 'Moderado', 'Grave') null default 'Leve',
primary key (`idadvertencia_disciplinaria`),
index `fk_advertencias_disciplinarias_empleados1_idx` (`idempleado` asc),
constraint `fk_advertencias_disciplinarias_empleados1` foreign key (`idempleado`) references `centralguard`.`empleado` (`idempleado`)
on delete no action
on update no action);

create table evaluacion_desempeño (  
idevaluacion_desempeño int not null auto_increment comment 'Código único de la evaluación',
idempleado int not null comment 'Funcionario evaluado.',
idusuario int not null comment 'Administrador o supervisor.',
fecha_evaluacion date not null comment 'Día de auditoría',
puntaje_numerico int not null comment 'Calificación cuantitativa (1 a 100).',
comentarios_retroalimentacion varchar(45) null,
primary key (`idevaluacion_desempeño`),
index `fk_evaluaciones_desempeño_empleados1_idx` (`idempleado` asc),
index `fk_evaluaciones_desempeño_usuario1_idx` (`idusuario` asc),
constraint `fk_evaluaciones_desempeño_empleados1` foreign key (`idempleado`) references `centralguard`.`empleado` (`idempleado`)
on delete no action
on update no action,
constraint `fk_evaluaciones_desempeño_usuario1` foreign key (`idusuario`) references `centralguard`.`usuarios` (`idusuario`)
on delete no action
on update no action);

create table equipo (
idequipo int not null auto_increment comment 'Identificador interno del activo.',
nombre_activo varchar(100) not null comment 'Nombre comercial.',
serial_unico varchar(50) not null comment 'Serial de fábrica único.',
estado enum('Excelente','Bueno','Regular','Deficiente','En Mantenimiento') not null,  
primary key (`idequipo`), unique index `serial_unico_UNIQUE` (`serial_unico` asc));

create table asignacion_equipo (  
idasignacion_equipo int not null auto_increment comment 'Código de la asignación.',
idusuario int not null comment 'Trabajador que recibe el equipo.',
idequipo int not null comment 'Dispositivo prestado.',
fecha_entrega datetime not null comment 'Fecha y hora exacta.',
fecha_devolucion datetime null,
observaciones_entrega varchar(255) null,
primary key (`idasignacion_equipo`),  
index `fk_asignaciones_equipo_equipo1_idx` (`idequipo` asc),  
index `fk_asignaciones_equipo_usuarios1_idx` (`idusuario` asc),  
constraint `fk_asignaciones_equipo_equipos1` foreign key (`idequipo`) references `centralguard`.`equipo` (`idequipo`)  
on delete no action
on update no action,
constraint `fk_asignaciones_equipo_usuarios1` foreign key (`idusuario`) references `centralguard`.`usuarios` (`idusuario`)
on delete no action
on update no action);

create table turno (
idturno int not null auto_increment comment 'Identificador único del turno.',
idusuario int not null,
idempleado int not null,
idpuesto_vigilancia int not null,
fecha date not null,
hora_inicio time not null,
hora_fin time not null,  
estado enum('Programado','En Progreso','Cumplido','Cancelado','Inasistencia') not null,
primary key (`idturno`),
index `fk_turnos_puestos_vigilancia1_idx` (`idpuesto_vigilancia` asc),
index `fk_turno_empleado1_idx` (`idempleado` asc),
index `fk_turno_usuarios1_idx` (`idusuario` asc),
constraint `fk_turnos_puesto_vigilancia1_idx` foreign key (`idpuesto_vigilancia`) references `centralguard`.`puesto_vigilancia` (`idpuesto_vigilancia`)  
on delete no action
on update no action,
constraint `fk_turnos_puesto_empleado1_idx` foreign key (`idempleado`) references `centralguard`.`empleado` (`idempleado`)  
on delete no action
on update no action,
constraint `fk_turnos_puesto_usuarios1_idx` foreign key (`idusuario`) references `centralguard`.`usuarios` (`idusuario`)  
on delete no action
on update no action);

create table ronda (  
idronda int not null auto_increment,
idturno int not null,
hora_marcacion_inicio time not null,
hora_marcacion_fin time not null,
puntos_validados varchar(255) not null,
observaciones_ronda text null,
primary key (`idronda`),  
index `fk_rondas_turnos1_idx` (`idturno` asc),
constraint `fk_rondas_turnos1_idx` foreign key (`idturno`) references `centralguard`.`turno` (`idturno`)  
on delete no action
on update no action);  

create table empresa_procedencia (
idempresa_procedencia int not null auto_increment,
nombre_empresa varchar(45) not null,
primary key (`idempresa_procedencia`));

create table persona_acceso (
idpersona_acceso int not null auto_increment,
primer_nombre varchar(50) not null,
primer_apellido varchar(50) not null,
tipo_persona enum('Residente','Visitante','Domiciliario') not null,
idempresa_procedencia int null,
primary key (`idpersona_acceso`),  
index `fk_persona_acceso_empresa_procedencia1_idx` (`idempresa_procedencia` asc),
constraint `fk_persona_acceso_empresa_procedencia1` foreign key (`idempresa_procedencia`) references `centralguard`.`empresa_procedencia` (`idempresa_procedencia`)
on delete no action
on update no action);

create table vehiculo (
idvehiculo int not null auto_increment,
placa varchar(15) not null,
marca varchar(50) null,
modelo varchar(45) null,
color varchar(20) null,
primary key (`idvehiculo`),
unique index `placa_UNIQUE` (`placa` asc));

create table registro_acceso (
idregistro_acceso int not null,
idturno int not null,
idpersona_acceso int not null,
apartamento_destino varchar(30) not null,
hora_entrada timestamp not null default current_timestamp,
hora_salida timestamp null,
observaciones_acceso text null,
primary key (`idregistro_acceso`),
index `fk_registro_acceso_visitantes1_idx` (`idpersona_acceso` asc),
constraint `fk_registro_accesos_turnos1` foreign key (`idturno`) references `centralguard`.`turno` (`idturno`)
on delete no action
on update no action,
constraint `fk_registro_accesos_visitantes1` foreign key (`idpersona_acceso`) references `centralguard`.`persona_acceso` (`idpersona_acceso`)
on delete no action
on update no action);

create table novedades (
idnovedad int not null auto_increment,
idturno int not null,
idtipo_novedad int not null,
hora_reporte time not null,
descripcion_hechos text not null,
estado enum('Pendiente','En Proceso','Resuelta') not null,
primary key (`idnovedad`),
index `fk_novedades_turnos1_idx` (`idturno` asc),
index `fk_novedades_tipo_novedad1_idx` (`idtipo_novedad` asc),
constraint `fk_novedades_turnos1` foreign key (`idturno`) references `centralguard`.`turno` (`idturno`)
on delete no action
on update no action,
constraint `fk_novedades_tipo_novedad1` foreign key (`idtipo_novedad`) references `centralguard`.`tipo_novedad` (`idtipo_novedad`)
on delete no action
on update no action);

create table evidencia (
idevidencia int not null,
url_imagen_evidencia varchar(255) not null,
fecha_captura timestamp not null,
idnovedad int not null,
primary key (idevidencia),
index fk_evidencia_novedades1_idx (idnovedad asc),
constraint fk_evidencia_novedades1 foreign key (idnovedad) references centralguard.novedades (idnovedad)
on delete no action
on update no action);

create table objeto_perdido (
idobjeto_perdido int not null auto_increment,
idevidencia int not null,
idpuesto_vigilancia int not null,
nombre_objeto varchar(45) not null,
descripcion_detallada text null,
fecha_hallazgo varchar(45) not null,
estado enum('Entregado', 'En custodia', 'Desechado', 'Donado') not null,
primary key (idobjeto_perdido),
index fk_objetos_perdidos_puestos_vigilancia1_idx (idpuesto_vigilancia asc),
index fk_objetos_perdidos_evidencias1_idx (idevidencia asc),
constraint fk_objetos_perdidos_puestos_vigilancia1
foreign key (idpuesto_vigilancia) references centralguard.puesto_vigilancia (idpuesto_vigilancia)
on delete no action
on update no action,
constraint fk_objetos_perdidos_evidencias1
foreign key (idevidencia) references centralguard.evidencia (idevidencia)
on delete no action
on update no action);

create table pedido (
idpedidos int not null auto_increment,
idregistro_acceso int not null,
nombre_pedido varchar(100) not null,
descripcion text null,
nombre_destinatario varchar(100) null,
hora_llegada timestamp null,
estado enum('Entregado', 'En custodia', 'Desechado', 'Donado') not null,
primary key (idpedidos),
index fk_pedido_registro_acceso1_idx (idregistro_acceso asc),
constraint fk_pedido_registro_acceso1
foreign key (idregistro_acceso) references centralguard.registro_acceso (idregistro_acceso)
on delete no action
on update no action);

create table vehiculos_personas (
id_vehiculo_persona int not null,
id_vehiculo int not null,
id_personas_acceso int not null,
es_conductor_principal tinyint null default 1,
primary key (id_vehiculo, id_personas_acceso, id_vehiculo_persona),
index fk_vehiculo_has_persona_acceso_persona_acceso1_idx (id_personas_acceso asc),
index fk_vehiculo_has_persona_acceso_vehiculo1_idx (id_vehiculo asc),
constraint fk_vehiculo_has_persona_acceso_vehiculo1
foreign key (id_vehiculo) references centralguard.vehiculo (idvehiculo)
on delete no action
on update no action,
constraint fk_vehiculo_has_persona_acceso_persona_acceso1
foreign key (id_personas_acceso) references centralguard.persona_acceso (idpersona_acceso)
on delete no action
on update no action);

create table control_vehicular (
idcontrol_vehicular int not null auto_increment,
idvehiculo int not null,
idturno int not null,
fecha_entrada timestamp not null default current_timestamp,
fecha_salida timestamp null,
observaciones text null,
primary key (idcontrol_vehicular),
index fk_control_vehicular_vehiculo_idx (idvehiculo asc),
index fk_control_vehicular_turno_idx (idturno asc),
constraint fk_control_vehicular_vehiculo
    foreign key (idvehiculo) references centralguard.vehiculo (idvehiculo)
    on delete no action on update no action,
constraint fk_control_vehicular_turno
    foreign key (idturno) references centralguard.turno (idturno)
    on delete no action on update no action
);