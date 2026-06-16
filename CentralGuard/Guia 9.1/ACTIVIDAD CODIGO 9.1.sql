CREATE DATABASE GASTOS_ZAMBRANO_MARTINEZ_DB;
USE GASTOS_ZAMBRANO_MARTINEZ_DB;

CREATE TABLE METODO_PAGO
(
	idMetodo_Pago INT NOT NULL auto_increment,
    Nombre VARCHAR(80) NOT NULL,
    Descripcion VARCHAR(500) NOT NULL,
    
    PRIMARY KEY (idMetodo_Pago)
);

CREATE TABLE USUARIO
(
	idUsuario INT NOT NULL auto_increment,
    PrimerNombre VARCHAR(45)NOT NULL,
    SegundoNombre VARCHAR(45) NOT NULL,
    PrimerApellido VARCHAR(45) NOT NULL,
    SegundoApellido VARCHAR(45) NOT NULL,
    correo VARCHAR(80) NOT NULL,
    contraseña VARCHAR(50) NOT NULL,
    fecha_Registro DATETIME NOT NULL,
    
    PRIMARY KEY(idUsuario)
);

CREATE TABLE CATEGORIA
(
	idCategoria INT NOT NULL auto_increment,
    nombre VARCHAR(45) NOT NULL,
    descripcion VARCHAR(80) NOT NULL,
    
    PRIMARY KEY (idCategoria)
);
CREATE TABLE PRESUPUESTO
(
	idPresupuesto INT NOT NULL auto_increment,
    idUsuario_FK INT NOT NULL,
    idCategoria_FK INT NOT NULL,
    monto_Planificado INT NOT NULL,
    fecha_Inicio DATE NOT NULL,
    fecha_Fin DATE NOT NULL,
    
    PRIMARY KEY (idPresupuesto),
    FOREIGN KEY (idUsuario_FK) REFERENCES USUARIO(idUsuario),
    FOREIGN KEY (idCategoria_FK) REFERENCES CATEGORIA(idCategoria)
);
SHOW TABLES;
DESC METODO_PAGO;
DESC USUARIO;
DESC CATEGORIA;
DESC PRESUPUESTO;

INSERT INTO METODO_PAGO (idMetodo_Pago,Nombre,Descripcion)
	VALUES (159, 'CARLOS ANDRES', 'Tarjeta Credito',
			160, 'CARLOS ANDRES', 'Billetera Digital',
            161, 'CARLOS ANDRES', 'Tarjeta Débito',
            162, "CARLOS ANDRES", 'Transferencia',
            163, "CARLOS ANDRES", 'Efectivo')

