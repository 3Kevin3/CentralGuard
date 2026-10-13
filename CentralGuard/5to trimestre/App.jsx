import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'
import Swal from 'sweetalert2'
import './App.css'
import Navbar from './components/Navbar'
import LibroRondas from './components/vigilante/LibroRondas'
import ControlAccesos from './components/vigilante/ControlAccesos'
import RegistroNovedades from './components/vigilante/RegistroNovedades'
import ObjetosPerdidos from './components/vigilante/ObjetosPerdidos'
import ControlPedidos from './components/vigilante/ControlPedidos'
import SupervisorPanel from './components/roles/SupervisorPanel'
import AdminPanel from './components/roles/AdminPanel'

const normalizeRole = (role) => {
  const r = String(role || '').trim().toLowerCase()
  if (r.includes('admin') || r === '1') return 'admin'
  if (r.includes('superv') || r === '2') return 'supervisor'
  return 'vigilante'
}

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null)
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false)
  const [mostrarModalRegistro, setMostrarModalRegistro] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [cargando, setCargando] = useState(false)

  const [regNombre, setRegNombre] = useState('')
  const [regApellido, setRegApellido] = useState('')
  const [regDocumento, setRegDocumento] = useState('')
  const [regCorreo, setRegCorreo] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [subSeccionVigilante, setSubSeccionVigilante] = useState('rondas')

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('centralguard_user')
      if (savedUser) setUsuarioLogueado(JSON.parse(savedUser))
    } catch {
      localStorage.removeItem('centralguard_user')
    }
  }, [])

  const scrollToSection = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const guardarSesion = (userData) => {
    setUsuarioLogueado(userData)
    localStorage.setItem('centralguard_user', JSON.stringify(userData))
    setMostrarModalLogin(false)
    Swal.fire({ 
      title: `¡Bienvenido, ${userData.nombre}!`, 
      text: `Sesión iniciada como ${userData.rol.toUpperCase()}`, 
      icon: 'success', 
      timer: 1500, 
      showConfirmButton: false 
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      // Búsqueda directa sin .single()
      const { data: usuariosData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('usuario', emailInput.trim().toLowerCase())

      if (usuarioError) throw usuarioError
      if (!usuariosData || usuariosData.length === 0) {
        throw new Error('El usuario o correo ingresado no existe.')
      }

      const data = usuariosData[0]

      if (data.contrasena !== passwordInput) {
        throw new Error('Contraseña incorrecta.')
      }

      let nombreRol = String(data.idroles)
      if (data.idroles != null) {
        const { data: rolesData } = await supabase
          .from('roles')
          .select('*')
          .eq('idroles', data.idroles)

        if (rolesData && rolesData.length > 0) {
          nombreRol = rolesData[0]?.nombre_rol || rolesData[0]?.nombre || String(data.idroles)
        }
      }

      guardarSesion({
        idusuario: data.idusuario,
        email: data.usuario,
        nombre: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Usuario',
        rol: normalizeRole(nombreRol)
      })
    } catch (error) {
      Swal.fire('Acceso denegado', error.message || 'Error al conectar con Supabase.', 'error')
    } finally { setCargando(false) }
  }

const handleRegistro = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      let idRolAsignado = 3
      const correoLwr = regCorreo.trim().toLowerCase()
      if (correoLwr.includes('admin')) idRolAsignado = 1
      else if (correoLwr.includes('supervisor')) idRolAsignado = 2

      // Insertar nuevo usuario
      const { data, error } = await supabase.from('usuarios').insert([{
        idroles: idRolAsignado,
        usuario: correoLwr,
        contrasena: regPassword,
        nombre: regNombre.trim(),
        apellido: regApellido.trim()
      }]).select()

      if (error) {
        // Capturar error de duplicidad
        if (error.code === '23505') {
          throw new Error('El correo o usuario ingresado ya se encuentra registrado. Intenta iniciar sesión o usa otro correo.')
        }
        throw error
      }

      Swal.fire({
        title: '¡Registro exitoso!',
        text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        icon: 'success',
        confirmButtonColor: '#0d6efd'
      })

      setMostrarModalRegistro(false)
      setEmailInput(correoLwr)
      setPasswordInput(regPassword)
      setRegNombre(''); setRegApellido(''); setRegDocumento(''); setRegCorreo(''); setRegPassword('')
      setMostrarModalLogin(true)
    } catch (error) {
      Swal.fire('Error en el registro', error.message || 'No se pudo guardar el usuario.', 'error')
    } finally { setCargando(false) }
  }

  const handleLogout = () => {
    setUsuarioLogueado(null)
    localStorage.removeItem('centralguard_user')
    setEmailInput('')
    setPasswordInput('')
  }

  if (usuarioLogueado) {
    const rol = normalizeRole(usuarioLogueado.rol)
    return (
      <div className="dashboard-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-shield"><i className="bi bi-shield-lock-fill text-primary"></i></div>
            <div><strong>CENTRALGUARD</strong><small>Seguridad inteligente</small></div>
          </div>

          <div className="sidebar-user">
            <div className="avatar">{(usuarioLogueado.nombre || 'U').charAt(0).toUpperCase()}</div>
            <div><strong>{usuarioLogueado.nombre}</strong><small>{rol === 'admin' ? 'Administrador' : rol === 'supervisor' ? 'Supervisor' : 'Vigilante'}</small></div>
          </div>

          <nav className="side-nav">
            {rol === 'vigilante' && <>
              <button className={subSeccionVigilante==='rondas'?'active':''} onClick={()=>setSubSeccionVigilante('rondas')}><i className="bi bi-journal-bookmark me-2"></i><span>Libro de Rondas</span></button>
              <button className={subSeccionVigilante==='accesos'?'active':''} onClick={()=>setSubSeccionVigilante('accesos')}><i className="bi bi-car-front me-2"></i><span>Control de Accesos</span></button>
              <button className={subSeccionVigilante==='novedades'?'active':''} onClick={()=>setSubSeccionVigilante('novedades')}><i className="bi bi-exclamation-triangle me-2"></i><span>Novedades</span></button>
              <button className={subSeccionVigilante==='objetos'?'active':''} onClick={()=>setSubSeccionVigilante('objetos')}><i className="bi bi-box-seam me-2"></i><span>Objetos Perdidos</span></button>
              <button className={subSeccionVigilante==='pedidos'?'active':''} onClick={()=>setSubSeccionVigilante('pedidos')}><i className="bi bi-bag-check me-2"></i><span>Pedidos</span></button>
            </>}
            {rol === 'supervisor' && <button className="active"><i className="bi bi-graph-up-arrow me-2"></i><span>Resumen operativo</span></button>}
            {rol === 'admin' && <button className="active"><i className="bi bi-gear-fill me-2"></i><span>Administración</span></button>}
          </nav>

          <button className="logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-left me-2"></i>Cerrar sesión</button>
        </aside>

        <section className="dashboard-main">
          <header className="topbar">
            <div><span className="topbar-label">CENTRALGUARD / {rol.toUpperCase()}</span><h2>{rol === 'admin' ? 'Administración' : rol === 'supervisor' ? 'Supervisión operativa' : 'Operación de vigilancia'}</h2></div>
            <div className="system-status"><span></span> Sistema operativo</div>
          </header>

          <main className="dashboard-content">
            {rol === 'admin' && <AdminPanel />}
            {rol === 'supervisor' && <SupervisorPanel />}
            {rol === 'vigilante' && (
              <div className="panel-card">
                {subSeccionVigilante === 'rondas' && <LibroRondas usuario={usuarioLogueado} />}
                {subSeccionVigilante === 'accesos' && <ControlAccesos />}
                {subSeccionVigilante === 'novedades' && <RegistroNovedades />}
                {subSeccionVigilante === 'objetos' && <ObjetosPerdidos />}
                {subSeccionVigilante === 'pedidos' && <ControlPedidos />}
              </div>
            )}
          </main>
        </section>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      <Navbar scrollToSection={scrollToSection} setMostrarModalRegistro={setMostrarModalRegistro} setMostrarModalLogin={setMostrarModalLogin} />

      <div className="flex-grow-1">
        <section id="inicio" className="position-relative text-white py-5 bg-dark overflow-hidden style-hero">
          <div className="container py-5 position-relative style-z2">
            <div className="row align-items-center g-5">
              <div className="col-lg-7 text-center text-lg-start">
                <span className="badge bg-primary bg-opacity-20 text-primary border border-primary rounded-pill px-3 py-2 mb-3">
                  <i className="bi bi-lightning-charge-fill me-1"></i> Plataforma 100% Digital e Integrada
                </span>
                <h1 className="display-3 fw-black text-white mb-3">
                  Gestión Inteligente de <span className="text-primary">Seguridad & Portería</span>
                </h1>
                <p className="lead text-light text-opacity-75 mb-4">
                  Especialmente diseñada para conjuntos residenciales y complejos empresariales. Optimiza registros de acceso, libro de rondas digital y trazabilidad de eventos en tiempo real.
                </p>

                <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start">
                  <button onClick={() => setMostrarModalLogin(true)} className="btn btn-primary btn-lg px-4 py-3 fw-bold rounded-pill shadow-lg">
                    <i className="bi bi-lock-fill me-2"></i> Iniciar Sesión
                  </button>
                  <button onClick={() => scrollToSection('funciones')} className="btn btn-outline-light btn-lg px-4 py-3 fw-bold rounded-pill">
                    <i className="bi bi-search me-2"></i> Explora las Funciones
                  </button>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card bg-dark bg-opacity-75 border-secondary text-white rounded-4 overflow-hidden shadow-lg backdrop-blur">
                  <img 
                    src="https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80" 
                    alt="Centro de Control de Seguridad" 
                    className="card-img-top object-fit-cover" 
                    style={{ height: '200px' }}
                  />
                  <div className="p-4">
                    <h4 className="fw-bold mb-3 border-bottom border-secondary pb-2"><i className="bi bi-globe me-2 text-primary"></i> Métricas Operativas</h4>
                    <div className="row g-3 text-center">
                      <div className="col-6">
                        <div className="p-3 bg-white bg-opacity-10 rounded-3">
                          <span className="display-6 fw-bold text-success d-block">99.9%</span>
                          <small className="text-light opacity-75">Disponibilidad</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white bg-opacity-10 rounded-3">
                          <span className="display-6 fw-bold text-info d-block">24/7</span>
                          <small className="text-light opacity-75">Monitoreo Activo</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white bg-opacity-10 rounded-3">
                          <span className="display-6 fw-bold text-warning d-block">&lt; 1s</span>
                          <small className="text-light opacity-75">Respuesta Supabase</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-3 bg-white bg-opacity-10 rounded-3">
                          <span className="display-6 fw-bold text-primary d-block">100%</span>
                          <small className="text-light opacity-75">Trazabilidad</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funciones" className="container py-5 my-4">
          <div className="text-center max-w-700 mx-auto mb-5">
            <span className="text-primary fw-bold text-uppercase">Módulos Especializados</span>
            <h2 className="fw-black text-dark display-5 mt-1">¿Qué resuelve CentralGuard?</h2>
            <p className="text-muted lead">Elimina las minutas de papel y moderniza la seguridad de tu copropiedad con módulos en la nube.</p>
          </div>

          <div className="row g-4">
            {[
              ['bi-journal-text', 'Libro de Rondas', 'Registra horarios, sectores recorridos y observaciones para auditorías y control continuo.', 'border-primary', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80'],
              ['bi-car-front-fill', 'Control de Accesos', 'Registra residentes, visitantes, domiciliarios, vehículos y destinos en tiempo real.', 'border-success', 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'],
              ['bi-exclamation-octagon-fill', 'Registro de Novedades', 'Reporta incidentes, emergencias, daños y requerimientos categorizados por prioridad.', 'border-warning', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80'],
              ['bi-box-seam-fill', 'Objetos Perdidos', 'Mantén el inventario de pertenencias halladas con seguimiento de entrega.', 'border-info', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
              ['bi-bag-check-fill', 'Control de Pedidos', 'Gestiona las encomiendas y entregas recibidas en portería para los residentes.', 'border-secondary', 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80']
            ].map((item, i) => (
              <div className={i < 3 ? 'col-lg-4 col-md-6' : 'col-lg-6 col-md-6'} key={item[1]}>
                <div className={`card h-100 border-0 border-top border-4 shadow-sm bg-white rounded-4 overflow-hidden hover-lift ${item[3]}`}>
                  <img src={item[4]} alt={item[1]} className="card-img-top object-fit-cover" style={{ height: '160px' }} />
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-light p-2 rounded-3 me-3 text-primary fs-3">
                        <i className={`bi ${item[0]}`}></i>
                      </div>
                      <h4 className="fw-bold text-dark mb-0">{item[1]}</h4>
                    </div>
                    <p className="text-muted mb-0">{item[2]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-5 border-top border-bottom">
          <div className="container py-4">
            <div className="row align-items-center g-4">
              <div className="col-md-6">
                <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-2 mb-2">ALERTAS E INFORMES</span>
                <h2 className="fw-black text-dark display-6">Supervisión en tiempo real para Administradores</h2>
                <p className="text-muted">CentralGuard conecta a vigilantes, supervisores y administradores en una única interfaz con roles bien definidos y respaldada por Supabase.</p>
                <ul className="list-unstyled">
                  <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> Control total de acceso según el rol.</li>
                  <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> Generación instantánea de historiales de rondas.</li>
                  <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> Sistema de mensajería interna y notificaciones.</li>
                </ul>
              </div>
              <div className="col-md-6 text-center">
                <div className="p-4 bg-light rounded-4 border shadow-sm">
                  <div className="fs-1 text-primary mb-2"><i className="bi bi-shield-lock-fill"></i></div>
                  <h4 className="fw-bold">CentralGuard Cloud</h4>
                  <p className="text-muted small">Seguridad en la nube pensada para conjuntos de cualquier tamaño.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contacto" className="py-5 bg-light">
          <div className="container my-4" style={{ maxWidth: '650px' }}>
            <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5 bg-white">
              <div className="text-center mb-4">
                <span className="fs-1 text-primary"><i className="bi bi-envelope-paper-fill"></i></span>
                <h2 className="fw-bold text-dark mt-2 mb-1">Contáctenos</h2>
                <p className="text-muted">¿Deseas implementar CentralGuard en tu copropiedad? Completa el formulario y te contactaremos.</p>
              </div>

              <form onSubmit={e => { e.preventDefault(); Swal.fire('¡Enviado!', 'Su mensaje ha sido enviado con éxito.', 'success') }}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Nombre Completo:</label>
                  <input className="form-control form-control-lg rounded-3" placeholder="Ej: Juan Pérez" required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Correo Electrónico:</label>
                  <input type="email" className="form-control form-control-lg rounded-3" placeholder="ejemplo@correo.com" required />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Mensaje o Solicitud:</label>
                  <textarea className="form-control form-control-lg rounded-3" rows="4" placeholder="Cuéntanos cuántas porterías o vigilantes tienes..." required />
                </div>
                <button className="btn btn-dark w-100 fw-bold py-3 rounded-pill shadow-sm fs-5">
                  Enviar Mensaje
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-dark text-white py-4 mt-auto border-top border-secondary">
        <div className="container text-center">
          <p className="mb-1 fw-semibold"><i className="bi bi-shield-fill-check me-2"></i>CENTRALGUARD - Sistema de Control y Seguridad Operativa</p>
          <small className="text-light opacity-50">© 2026 Todos los derechos reservados.</small>
        </div>
      </footer>

      {mostrarModalLogin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 border-0 shadow-lg rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0"><i className="bi bi-box-arrow-in-right me-2"></i>Acceso al Sistema</h4>
                <button onClick={() => setMostrarModalLogin(false)} className="btn-close" />
              </div>
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Usuario o correo:</label>
                  <input className="form-control form-control-lg rounded-3" value={emailInput} onChange={e => setEmailInput(e.target.value)} required />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Contraseña:</label>
                  <input type="password" className="form-control form-control-lg rounded-3" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required />
                </div>
                <button className="btn btn-primary w-100 fw-bold py-3 rounded-3 mb-3" disabled={cargando}>
                  {cargando ? 'Verificando...' : 'Entrar al Sistema'}
                </button>
              </form>

              <div className="alert alert-secondary small mb-0 rounded-3">
                <strong><i className="bi bi-info-circle-fill me-1"></i>Usuarios de prueba:</strong><br/>
                admin@centralguard.com<br/>
                supervisor@centralguard.com<br/>
                vigilante@centralguard.com
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalRegistro && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 border-0 shadow-lg rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0"><i className="bi bi-person-plus-fill me-2"></i>Registrarse en CentralGuard</h4>
                <button onClick={() => setMostrarModalRegistro(false)} className="btn-close" />
              </div>
              <form onSubmit={handleRegistro}>
                {[
                  ['Nombre', regNombre, setRegNombre],
                  ['Apellido', regApellido, setRegApellido],
                  ['Número de Documento', regDocumento, setRegDocumento],
                  ['Correo Electrónico', regCorreo, setRegCorreo]
                ].map(([label, value, setter], i) => (
                  <div className="mb-3" key={label}>
                    <label className="form-label fw-semibold small">{label}:</label>
                    <input type={i === 3 ? 'email' : 'text'} className="form-control rounded-3" value={value} onChange={e => setter(e.target.value)} required />
                  </div>
                ))}
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Contraseña:</label>
                  <input type="password" className="form-control rounded-3" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                </div>
                <button className="btn btn-primary w-100 fw-bold py-3 rounded-3" disabled={cargando}>
                  {cargando ? 'Registrfando...' : 'Crear Cuenta'}
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