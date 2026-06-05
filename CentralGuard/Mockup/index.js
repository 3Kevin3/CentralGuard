const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Secreto para firmar tokens de seguridad
const JWT_SECRET = process.env.JWT_SECRET || "secreto_corporativo_para_saas_2026";

// Configuración del Pool de Conexiones a MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sistema_vigilancia_saas',
    waitForConnections: true,
    connectionLimit: 10
});

// Middleware para proteger rutas por token JWT
const autenticarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: "Acceso denegado. Token no provisto." });

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({ error: "Token inválido o expirado." });
        req.usuario = usuario;
        next();
    });
};

// ========================================================
// ENDPOINTS DE AUTENTICACIÓN
// ========================================================

// Registro de nuevos usuarios
app.post('/api/auth/registrar', async (req, res) => {
    const { username, password, nombre_completo, rol_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query(
            'INSERT INTO usuarios (username, password_hash, nombre_completo, rol_id) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, nombre_completo, rol_id],
            (err, resultado) => {
                if (err) return res.status(400).json({ error: "El nombre de usuario ya está registrado." });
                res.status(201).json({ mensaje: "Usuario creado exitosamente." });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor al procesar el registro." });
    }
});

// Inicio de sesión (Login)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.query(
        'SELECT u.*, r.nombre AS rol_nombre FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.username = ?',
        [username],
        async (err, resultados) => {
            if (err || resultados.length === 0) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

            const usuario = resultados[0];
            const passwordValido = await bcrypt.compare(password, usuario.password_hash);
            if (!passwordValido) return res.status(401).json({ error: "Usuario o contraseña incorrectos." });

            const token = jwt.sign(
                { id: usuario.id, username: usuario.username, rol: usuario.rol_nombre },
                JWT_SECRET,
                { expiresIn: '12h' }
            );

            res.json({
                token,
                usuario: {
                    nombre: usuario.nombre_completo,
                    rol: usuario.rol_nombre
                }
            });
        }
    );
});

// ========================================================
// ENDPOINTS OPERATIVOS (RONDAS, ACCESOS, NOVEDADES)
// ========================================================

// Registrar una ronda (Rol: Vigilante)
app.post('/api/operacion/rondas', autenticarToken, (req, res) => {
    const { turno_id, fecha, hora_inicio, hora_finalizacion, sector_recorrido, observaciones } = req.body;
    db.query(
        'INSERT INTO libro_rondas (turno_id, fecha, hora_inicio, hora_finalizacion, sector_recorrido, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [turno_id, fecha, hora_inicio, hora_finalizacion, sector_recorrido, observaciones],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al guardar el registro de ronda." });
            res.status(201).json({ mensaje: "Ronda registrada en el libro digital." });
        }
    );
});

// Registrar un acceso de vehículo o persona (Rol: Vigilante)
app.post('/api/operacion/accesos', autenticarToken, (req, res) => {
    const { turno_id, nombre_persona, placa_vehiculo, apartamento_destino, tipo_ingreso, observaciones } = req.body;
    db.query(
        'INSERT INTO registro_accesos (turno_id, nombre_persona, placa_vehiculo, apartamento_destino, tipo_ingreso, observaciones) VALUES (?, ?, ?, ?, ?, ?)',
        [turno_id, nombre_persona, placa_vehiculo, apartamento_destino, tipo_ingreso, observaciones],
        (err) => {
            if (err) return res.status(500).json({ error: "Error al registrar el acceso." });
            res.status(201).json({ mensaje: "Acceso autorizado y guardado." });
        }
    );
});

// Listar novedades globales (Rol: Supervisor / Administrador)
app.get('/api/operacion/novedades', autenticarToken, (req, res) => {
    db.query(
        'SELECT n.*, u.nombre_completo AS vigilante_nombre FROM novedades n LEFT JOIN turnos_programacion t ON n.turno_id = t.id LEFT JOIN usuarios u ON t.usuario_id = u.id ORDER BY n.fecha DESC, n.hora DESC',
        (err, resultados) => {
            if (err) return res.status(500).json({ error: "Error al consultar las novedades." });
            res.json(resultados);
        }
    );
});

// ========================================================
// START SERVER
// ========================================================
const PORT = 3000;
app.listen(PORT, () => console.log(`API de Seguridad activa en http://localhost:${PORT}`));
