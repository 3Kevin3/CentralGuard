import { useState, useEffect } from 'react'
import { supabase } from './supabase/client'
import Swal from 'sweetalert2'
import './App.css'

import LibroRondas from './components/vigilante/LibroRondas'
import ControlAccesos from './components/vigilante/ControlAccesos'
import RegistroNovedades from './components/vigilante/RegistroNovedades'
import ObjetosPerdidos from './components/vigilante/ObjetosPerdidos'
import ControlPedidos from './components/vigilante/ControlPedidos'

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)

  const [mostrarModalLogin, setMostrarModalLogin] = useState(false)
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false)

  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [cargando, setCargando] = useState(false)

  const [regNombre, setRegNombre] = useState('')
  const [regDocumento, setRegDocumento] = useState('')
  const [regCorreo, setRegCorreo] = useState('')
  const [regPassword, setRegPassword] = useState('')

  const [seccion, setSeccion] = useState('accesos') 
  const [subSeccionVigilante, setSubSeccionVigilante] = useState('rondas') 
  const [personal, setPersonal] = useState([])

  useEffect(() => {
    const savedUser = localStorage.getItem('centralguard_user')
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUsuarioLogueado(parsedUser)
      if (parsedUser.rol === 'admin') setSeccion('personal')
      else if (parsedUser.rol === 'supervisor') setSeccion('novedades')
      else setSeccion('vigilante-panel')
    }
  }, [])

  useEffect(() => {
    if (usuarioLogueado && usuarioLogueado.rol === 'admin' && seccion === 'personal') {
      cargarPersonal()
    }
  }, [seccion, usuarioLogueado])

  const cargarPersonal = async () => {
    try {
      const { data, error } = await supabase.from('empleado').select('*')
      if (!error) setPersonal(data || [])
    } catch (e) {
      console.error("Error cargando personal:", e)
    }
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, roles(nombre_rol)')
        .eq('correo', emailInput)
        .maybeSingle()

      if (error || !data) {
        throw new Error('El correo ingresado no se encuentra registrado en el sistema.')
      }

      let rolAsignado = 'vigilante'
      if (data.roles && data.roles.nombre_rol) {
        rolAsignado = data.roles.nombre_rol.toLowerCase()
      } else if (emailInput.includes('admin')) {
        rolAsignado = 'admin'
      } else if (emailInput.includes('supervisor')) {
        rolAsignado = 'supervisor'
      }

      const userData = { 
        email: data.correo, 
        rol: rolAsignado, 
        nombre: data.nombre_completo 
      }
      
      guardarSesion(userData)

    } catch (error) {
      Swal.fire('Acceso denegado', error.message || 'Credenciales incorrectas.', 'error')
    } finally {
      setCargando(false)
    }
  }


  const guardarSesion = (userData) => {
    setUsuarioLogueado(userData)
    localStorage.setItem('centralguard_user', JSON.stringify(userData))
    setMostrarModalLogin(false)

    if (userData.rol === 'admin') setSeccion('personal')
    else if (userData.rol === 'supervisor') setSeccion('novedades')
    else {
      setSeccion('vigilante-panel')
      setSubSeccionVigilante('rondas')
    }

    Swal.fire({
      title: `¡Bienvenido, ${userData.nombre}!`,
      text: `Ingreso exitoso como ${userData.rol.toUpperCase()}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  }


  const handleRegistro = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {

      let idRolAsignado = 3 

      if (regCorreo.toLowerCase().includes('admin')) {
        idRolAsignado = 1
      } else if (regCorreo.toLowerCase().includes('supervisor')) {
        idRolAsignado = 2
      }

      const { error } = await supabase.from('usuarios').insert([{
        nombre_completo: regNombre,
        correo: regCorreo,
        contraseña: regPassword, 
        idroles: idRolAsignado
      }])

      if (error) throw error

      Swal.fire('¡Registro exitoso!', 'Su cuenta ha sido creada con éxito. Ya puede iniciar sesión.', 'success')
      setMostrarModalRegistro(false)
      setRegNombre(''); setRegCorreo(''); setRegPassword('');

    } catch (error) {
      Swal.fire('Error en el registro', error.message, 'error')
    } finally {
      setCargando(false)
    }
  }

  const handleLogout = () => {
    setUsuarioLogueado(null)
    localStorage.removeItem('centralguard_user')
    setEmailInput('')
    setPasswordInput('')
  }

  if (usuarioLogueado) {
    return (
      <div className="container py-4">
        <header className="navbar navbar-dark bg-dark px-4 rounded shadow-sm mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="text-white m-0 fs-4">🛡️ CentralGuard</h2>
            <span className="text-info small">Usuario: {usuarioLogueado.nombre} ({usuarioLogueado.rol.toUpperCase()})</span>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm fw-bold">
            Cerrar Sesión
          </button>
        </header>

        <ul className="nav nav-tabs mb-4">
          {usuarioLogueado.rol === 'vigilante' && (
            <>
              <li className="nav-item"><button className={`nav-link ${subSeccionVigilante === 'rondas' ? 'active' : ''}`} onClick={() => setSubSeccionVigilante('rondas')}>📖 Libro de Rondas</button></li>
              <li className="nav-item"><button className={`nav-link ${subSeccionVigilante === 'accesos' ? 'active' : ''}`} onClick={() => setSubSeccionVigilante('accesos')}>🚗 Accesos</button></li>
              <li className="nav-item"><button className={`nav-link ${subSeccionVigilante === 'novedades' ? 'active' : ''}`} onClick={() => setSubSeccionVigilante('novedades')}>⚠️ Novedades</button></li>
              <li className="nav-item"><button className={`nav-link ${subSeccionVigilante === 'objetos' ? 'active' : ''}`} onClick={() => setSubSeccionVigilante('objetos')}>📦 Objetos Perdidos</button></li>
              <li className="nav-item"><button className={`nav-link ${subSeccionVigilante === 'pedidos' ? 'active' : ''}`} onClick={() => setSubSeccionVigilante('pedidos')}>🍔 Pedidos</button></li>
            </>
          )}
          {usuarioLogueado.rol === 'supervisor' && (
            <li className="nav-item"><button className="nav-link active">Gestión de Novedades</button></li>
          )}
          {usuarioLogueado.rol === 'admin' && (
            <li className="nav-item"><button className="nav-link active">Gestión de Personal</button></li>
          )}
        </ul>

        <main className="card shadow-sm p-4 bg-white border-0">
          {usuarioLogueado.rol === 'vigilante' && (
            <div>
              {subSeccionVigilante === 'rondas' && <LibroRondas usuario={usuarioLogueado} />}
              {subSeccionVigilante === 'accesos' && <ControlAccesos />}
              {subSeccionVigilante === 'novedades' && <RegistroNovedades />}
              {subSeccionVigilante === 'objetos' && <ObjetosPerdidos />}
              {subSeccionVigilante === 'pedidos' && <ControlPedidos />}
            </div>
          )}

          {usuarioLogueado.rol === 'admin' && (
            <div>
              <h4 className="mb-3 text-secondary">Gestión de Personal Autorizado</h4>
              <div className="table-responsive bg-white rounded shadow-sm p-2">
                <table className="table table-striped table-hover mb-0 align-middle">
                  <thead className="table-dark">
                    <tr><th>Nombre</th><th>Documento</th><th>Cargo</th><th>Correo</th></tr>
                  </thead>
                  <tbody>
                    {personal.length === 0 ? <tr><td colSpan="4" className="text-center text-muted py-3">No hay empleados registrados.</td></tr> :
                      personal.map((emp, i) => (
                        <tr key={i}><td>{emp.nombre}</td><td>{emp.numero_documento}</td><td>{emp.cargo}</td><td>{emp.correo}</td></tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {usuarioLogueado.rol === 'supervisor' && (
            <div>
              <h4 className="text-secondary">Panel de Supervisor</h4>
              <p className="text-muted">Supervisión general de reportes y novedades operativas.</p>
            </div>
          )}
        </main>
      </div>
    )
  }


  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      

      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4 py-3 sticky-top shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-dark fs-4" href="#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }}>
            🛡️ CENTRALGUARD
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
            <ul className="navbar-nav mx-auto gap-3">
              <li className="nav-item">
                <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('inicio')}>
                  INICIO
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('funciones')}>
                  ¿PARA QUÉ FUNCIONA?
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('contacto')}>
                  CONTÁCTENOS
                </button>
              </li>
            </ul>

            <div className="d-flex gap-2">
              <button onClick={() => setMostrarModalRegistro(true)} className="btn btn-outline-dark px-3 fw-semibold rounded-pill">
                Registrarse
              </button>
              <button onClick={() => setMostrarModalLogin(true)} className="btn btn-dark px-3 fw-semibold rounded-pill">
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>


      <div className="flex-grow-1">
        

        <section id="inicio" className="position-relative text-white text-center d-flex align-items-center justify-content-center" style={{ minHeight: '90vh', background: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url("https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1500&q=80") center/cover no-repeat' }}>
          <div className="container px-3">
            <h1 className="display-3 fw-bold mb-4">Seguridad y Control Inteligente</h1>
            <p className="lead mb-5 mx-auto" style={{ maxWidth: '700px' }}>
              La plataforma definitiva para la gestión integral de porterías, control de accesos, libro de rondas y novedades en conjuntos residenciales y empresariales.
            </p>
            <button onClick={() => scrollToSection('funciones')} className="btn btn-primary btn-lg px-5 fw-bold rounded-pill shadow">
              Explorar Funciones
            </button>
          </div>
        </section>

        <section id="funciones" className="container py-5 my-5">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark display-5">¿Para qué funciona CentralGuard?</h2>
            <p className="text-muted lead">Optimiza todas las operaciones de vigilancia y portería en un sistema centralizado y moderno.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card shadow-sm h-100 p-4 border-0 bg-light">
                <div className="fs-1 mb-3">📖</div>
                <h4 className="fw-bold text-dark">Libro de Rondas</h4>
                <p className="text-muted">Permite registrar los horarios, sectores recorridos y observaciones de seguridad en tiempo real para auditorías y control continuo.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm h-100 p-4 border-0 bg-light">
                <div className="fs-1 mb-3">🚗</div>
                <h4 className="fw-bold text-dark">Control de Accesos</h4>
                <p className="text-muted">Lleva un registro detallado de residentes, visitantes y domiciliarios, controlando matrículas de vehículos y destinos exactos.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm h-100 p-4 border-0 bg-light">
                <div className="fs-1 mb-3">⚠️</div>
                <h4 className="fw-bold text-dark">Registro de Novedades</h4>
                <p className="text-muted">Reporta incidentes críticos, emergencias médicas, daños en infraestructura o requerimientos con niveles de prioridad definidos.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm h-100 p-4 border-0 bg-light">
                <div className="fs-1 mb-3">📦</div>
                <h4 className="fw-bold text-dark">Objetos Perdidos y Encontrados</h4>
                <p className="text-muted">Inventario organizado de pertenencias halladas en zonas comunes bajo custodia en portería hasta su devolución al propietario.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm h-100 p-4 border-0 bg-light">
                <div className="fs-1 mb-3">🍔</div>
                <h4 className="fw-bold text-dark">Control de Pedidos y Deliveries</h4>
                <p className="text-muted">Gestión rápida de encomiendas y entregas a domicilio para notificar y entregar al residente de forma segura y ágil.</p>
              </div>
            </div>
          </div>
        </section>


        <section id="contacto" className="py-5 bg-light border-top">
          <div className="container my-3" style={{ maxWidth: '600px' }}>
            <div className="card shadow border-0 p-5 bg-white">
              <h2 className="fw-bold text-dark mb-3 text-center">Contáctenos</h2>
              <p className="text-muted text-center mb-4">¿Interesado en implementar CentralGuard en su conjunto residencial o empresa? Escríbanos.</p>
              <form onSubmit={e => { e.preventDefault(); Swal.fire('¡Enviado!', 'Su mensaje ha sido enviado con éxito. Nos pondremos en contacto pronto.', 'success'); }}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre Completo:</label>
                  <input type="text" className="form-control" placeholder="Ingrese su nombre completo" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Correo Electrónico:</label>
                  <input type="email" className="form-control" placeholder="correo@dominio.com" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Mensaje:</label>
                  <textarea className="form-control" rows="4" placeholder="Describa su solicitud o requerimiento..." required></textarea>
                </div>
                <button type="submit" className="btn btn-dark w-100 fw-bold py-2">Enviar Mensaje</button>
              </form>
            </div>
          </div>
        </section>

      </div>


      <footer className="bg-dark text-white text-center py-4 mt-auto">
        <p className="mb-0 small text-muted">© 2026 CentralGuard - Sistema de Control y Seguridad Operativa. Todos los derechos reservados.</p>
      </footer>

      {mostrarModalLogin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 border-0 shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0">Iniciar Sesión</h4>
                <button onClick={() => setMostrarModalLogin(false)} className="btn-close"></button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Correo Electrónico:</label>
                  <input type="email" className="form-control" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="correo@centralguard.com" required />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Contraseña:</label>
                  <input type="password" className="form-control" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Ingrese su contraseña" required />
                </div>
                <button type="submit" className="btn btn-dark w-100 fw-bold py-2" disabled={cargando}>
                  {cargando ? 'Verificando...' : 'Entrar al Sistema'}
                </button>
              </form>
              <div className="mt-3 alert alert-secondary small mb-0">
                <strong>Correos de prueba:</strong><br />
                • admin@centralguard.com<br />
                • supervisor@centralguard.com<br />
                • vigilante@centralguard.com
              </div>
            </div>
          </div>
        </div>
      )}


      {mostrarModalRegistro && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 border-0 shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0">Registrarse en CentralGuard</h4>
                <button onClick={() => setMostrarModalRegistro(false)} className="btn-close"></button>
              </div>
              <form onSubmit={handleRegistro}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Nombre Completo:</label>
                  <input type="text" className="form-control" value={regNombre} onChange={e => setRegNombre(e.target.value)} placeholder="Ingrese su nombre completo" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Número de Documento:</label>
                  <input type="text" className="form-control" value={regDocumento} onChange={e => setRegDocumento(e.target.value)} placeholder="Ingrese su número de documento" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Correo Electrónico:</label>
                  <input type="email" className="form-control" value={regCorreo} onChange={e => setRegCorreo(e.target.value)} placeholder="correo@centralguard.com" required />
                  <div className="form-text text-muted" style={{ fontSize: '0.75rem' }}>
                    * El correo electrónico proporcionado previamente será utilizado para identificar y validar el cargo correspondiente.
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Contraseña:</label>
                  <input type="password" className="form-control" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Cree una contraseña segura" required />
                </div>
                <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={cargando}>
                  {cargando ? 'Registrando...' : 'Crear Cuenta'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
