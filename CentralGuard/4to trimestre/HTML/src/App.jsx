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
import logoCentral from './assets/CentralGuard.png'
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

  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false)
  const [recUsuario, setRecUsuario] = useState('')
  const [recNombre, setRecNombre] = useState('')
  const [recApellido, setRecApellido] = useState('')
  const [recNueva, setRecNueva] = useState('')
  const [recConfirmar, setRecConfirmar] = useState('')

  const [regNombre, setRegNombre] = useState('')
  const [regApellido, setRegApellido] = useState('')
  const [regDocumento, setRegDocumento] = useState('')
  const [regCorreo, setRegCorreo] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [subSeccionVigilante, setSubSeccionVigilante] = useState('rondas')
  const [subSeccionSupervisor, setSubSeccionSupervisor] = useState('resumen')

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
    const usuario = emailInput.trim().toLowerCase()

    // 1. La base de datos valida la contraseña (hash) con la función
    const { data: loginOk, error: loginError } = await supabase.rpc('fn_validar_login', {
      p_usuario: usuario,
      p_contrasena: passwordInput
    })

    if (loginError) throw loginError
    if (!loginOk) throw new Error('Usuario o contraseña incorrectos.')

    // 2. Login válido: traemos los datos SIN la contraseña
    const { data: usuariosData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('idusuario, idroles, usuario, nombre, apellido')
      .eq('usuario', usuario)

    if (usuarioError) throw usuarioError
    if (!usuariosData || usuariosData.length === 0) {
      throw new Error('El usuario o correo ingresado no existe.')
    }

    const data = usuariosData[0]

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

      const { data, error } = await supabase.from('usuarios').insert([{
        idroles: idRolAsignado,
        usuario: correoLwr,
        contrasena: regPassword,
        nombre: regNombre.trim(),
        apellido: regApellido.trim()
      }]).select()

      if (error) {
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

  const handleRecuperar = async (e) => {
  e.preventDefault()
  if (recNueva !== recConfirmar) {
    Swal.fire('Error', 'Las contraseñas no coinciden.', 'error')
    return
  }
  setCargando(true)
  try {
    const usuario = recUsuario.trim().toLowerCase()
    const { data: ok, error } = await supabase.rpc('fn_restablecer_contrasena', {
      p_usuario: usuario,
      p_nombre: recNombre.trim(),
      p_apellido: recApellido.trim(),
      p_nueva: recNueva
    })

    if (error) throw error
    if (!ok) throw new Error('Los datos no coinciden con ninguna cuenta registrada.')

    Swal.fire({
      title: '¡Contraseña actualizada!',
      text: 'Ya puedes iniciar sesión con tu nueva contraseña.',
      icon: 'success',
      confirmButtonColor: '#0d6efd'
    })

    setMostrarModalRecuperar(false)
    setRecUsuario(''); setRecNombre(''); setRecApellido(''); setRecNueva(''); setRecConfirmar('')
    setEmailInput(usuario)
    setPasswordInput('')
    setMostrarModalLogin(true)
  } catch (error) {
    Swal.fire('No se pudo restablecer', error.message || 'Error al conectar con Supabase.', 'error')
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
            <img src={logoCentral} alt="CentralGuard" style={{ height: '36px' }} />
            <div><strong>CentralGuard</strong><small>Seguridad inteligente</small></div>
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
            {rol === 'supervisor' && <>
              <button className={subSeccionSupervisor==='resumen'?'active':''} onClick={()=>setSubSeccionSupervisor('resumen')}><i className="bi bi-graph-up-arrow me-2"></i><span>Resumen operativo</span></button>
              <button className={subSeccionSupervisor==='novedades'?'active':''} onClick={()=>setSubSeccionSupervisor('novedades')}><i className="bi bi-clipboard-check me-2"></i><span>Gestión de novedades</span></button>
              <button className={subSeccionSupervisor==='registro'?'active':''} onClick={()=>setSubSeccionSupervisor('registro')}><i className="bi bi-plus-circle me-2"></i><span>Registrar novedad</span></button>
              <button className={subSeccionSupervisor==='chat'?'active':''} onClick={()=>setSubSeccionSupervisor('chat')}><i className="bi bi-chat-dots me-2"></i><span>Chat interno</span></button>
            </>}
            {rol === 'admin' && <button className="active"><i className="bi bi-gear-fill me-2"></i><span>Administración</span></button>}
          </nav>

          <button className="logout-btn" onClick={handleLogout}><i className="bi bi-box-arrow-left me-2"></i>Cerrar sesión</button>
        </aside>

        <section className="dashboard-main">
          <header className="topbar">
            <div><span className="topbar-label">CentralGuard / {rol.toUpperCase()}</span><h2>{rol === 'admin' ? 'Administración' : rol === 'supervisor' ? 'Supervisión operativa' : 'Operación de vigilancia'}</h2></div>
            <div className="system-status"><span></span> Sistema operativo</div>
          </header>

          <main className="dashboard-content">
            {rol === 'admin' && <AdminPanel />}
            {rol === 'supervisor' && <SupervisorPanel seccionActiva={subSeccionSupervisor} onCambiarSeccion={setSubSeccionSupervisor} />}
            {rol === 'vigilante' && (
              <div className="panel-card">
                {subSeccionVigilante === 'rondas'    && <LibroRondas usuario={usuarioLogueado} />}
                {subSeccionVigilante === 'accesos'   && <ControlAccesos usuario={usuarioLogueado} />}
                {subSeccionVigilante === 'novedades' && <RegistroNovedades usuario={usuarioLogueado} />}
                {subSeccionVigilante === 'objetos'   && <ObjetosPerdidos usuario={usuarioLogueado} />}
                {subSeccionVigilante === 'pedidos'   && <ControlPedidos usuario={usuarioLogueado} />}
              </div>
            )}
          </main>
        </section>
      </div>
    )
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar scrollToSection={scrollToSection} setMostrarModalRegistro={setMostrarModalRegistro} setMostrarModalLogin={setMostrarModalLogin} />

      <div className="flex-grow-1">
        <section id="inicio" className="position-relative text-white py-5 overflow-hidden hero-vibrant">
          <div className="hero-network"></div>
          <div className="hero-blob hero-blob-1"></div>
          <div className="hero-blob hero-blob-2"></div>
          <div className="hero-blob hero-blob-3"></div>

          <div className="container py-5 position-relative" style={{ zIndex: 2 }}>
            <div className="row align-items-center g-5">
              <div className="col-lg-7 text-center text-lg-start">
                <span className="hero-badge fade-in-up" style={{ animationDelay: '0.05s' }}>
                  <i className="bi bi-lightning-charge-fill me-1"></i> Plataforma 100% Digital e Integrada
                </span>

                <h1 className="display-3 fw-black mb-3 fade-in-up" style={{ animationDelay: '0.15s' }}>
                  Gestión Inteligente de <span className="hero-gradient-text">Seguridad & Portería</span>
                </h1>

                <p className="lead text-white text-opacity-85 mb-4 fade-in-up" style={{ animationDelay: '0.25s' }}>
                  Especialmente diseñada para conjuntos residenciales y complejos empresariales. Optimiza registros de acceso, libro de rondas digital y trazabilidad de eventos en tiempo real.
                </p>

                <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start fade-in-up" style={{ animationDelay: '0.35s' }}>
                  <button onClick={() => setMostrarModalLogin(true)} className="btn btn-hero-primary btn-lg px-4 py-3 fw-bold rounded-pill">
                    <i className="bi bi-lock-fill me-2"></i> Iniciar Sesión
                  </button>
                  <button onClick={() => scrollToSection('funciones')} className="btn btn-hero-outline btn-lg px-4 py-3 fw-bold rounded-pill">
                    <i className="bi bi-search me-2"></i> Explora las Funciones
                  </button>
                </div>
              </div>

              <div className="col-lg-5 fade-in-up" style={{ animationDelay: '0.45s' }}>
                <div className="live-preview-card rounded-4 overflow-hidden">
                  <div className="live-preview-header">
                    <div className="d-flex align-items-center gap-2">
                      <span className="live-dot"></span>
                      <strong className="text-white">Actividad en vivo</strong>
                    </div>
                    <span className="text-white text-opacity-50 small">CentralGuard</span>
                  </div>

                  <div className="live-preview-body">
                    {[
                      ['bi-check-circle-fill', 'live-icon-green', 'Ronda completada', 'Torre 3 · Sector Norte', 'hace 2 min'],
                      ['bi-car-front-fill', 'live-icon-blue', 'Acceso registrado', 'Visitante · Apto 502', 'hace 5 min'],
                      ['bi-exclamation-triangle-fill', 'live-icon-amber', 'Novedad reportada', 'Falla de cámara · Portón sur', 'hace 11 min'],
                      ['bi-box-seam-fill', 'live-icon-violet', 'Paquete recibido', 'Encomienda · Apto 108', 'hace 18 min'],
                    ].map(([icon, cls, title, sub, time], i) => (
                      <div className="live-event-row" style={{ animationDelay: `${0.5 + i * 0.12}s` }} key={title}>
                        <div className={`live-event-icon ${cls}`}>
                          <i className={`bi ${icon}`}></i>
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-white fw-semibold small">{title}</div>
                          <div className="text-white text-opacity-50" style={{ fontSize: '0.78rem' }}>{sub}</div>
                        </div>
                        <span className="text-white text-opacity-40" style={{ fontSize: '0.72rem' }}>{time}</span>
                      </div>
                    ))}
                  </div>

                  <div className="live-preview-footer">
                    <span className="text-white text-opacity-60 small">Así se ve tu operación en tiempo real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="dark-zone">
          <div className="dark-zone-grid"></div>

          <section id="funciones" className="container py-5 my-4 position-relative" style={{ zIndex: 2 }}>
            <div className="text-center max-w-700 mx-auto mb-5">
              <span className="section-eyebrow-dark">Módulos Especializados</span>
              <h2 className="fw-black text-white display-5 mt-1">¿Qué resuelve CentralGuard?</h2>
              <p className="text-white text-opacity-65 lead">Elimina las minutas de papel y moderniza la seguridad de tu copropiedad con módulos en la nube.</p>
            </div>

            <div className="module-featured mb-4">
              <div className="row g-0 align-items-center">
                <div className="col-lg-6">
                  <img
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80"
                    alt="Libro de Rondas"
                    className="module-featured-img"
                  />
                </div>
                <div className="col-lg-6">
                  <div className="p-4 p-lg-5">
                    <div className="module-icon-glow module-icon-blue mb-3">
                      <i className="bi bi-journal-text"></i>
                    </div>
                    <h4 className="fw-bold text-white mb-2">Libro de Rondas</h4>
                    <p className="text-white text-opacity-65 mb-0">Registra horarios, sectores recorridos y observaciones para auditorías y control continuo. El módulo insignia de CentralGuard.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {[
                ['bi-car-front-fill', 'Control de Accesos', 'Registra residentes, visitantes, domiciliarios, vehículos y destinos en tiempo real.', 'module-icon-green', 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'],
                ['bi-exclamation-octagon-fill', 'Registro de Novedades', 'Reporta incidentes, emergencias, daños y requerimientos categorizados por prioridad.', 'module-icon-amber', 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80'],
                ['bi-box-seam-fill', 'Objetos Perdidos', 'Mantén el inventario de pertenencias halladas con seguimiento de entrega.', 'module-icon-cyan', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80'],
                ['bi-bag-check-fill', 'Control de Pedidos', 'Gestiona las encomiendas y entregas recibidas en portería para los residentes.', 'module-icon-violet', 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80']
              ].map((item, i) => (
                <div className="col-lg-3 col-md-6" key={item[1]}>
                  <div className={`module-card-dark h-100 ${i % 2 !== 0 ? 'module-card-offset' : ''}`}>
                    <div className="module-img-wrap">
                      <img src={item[4]} alt={item[1]} className="module-card-img" />
                    </div>
                    <div className="p-4">
                      <div className={`module-icon-glow ${item[3]} mb-3`}>
                        <i className={`bi ${item[0]}`}></i>
                      </div>
                      <h5 className="fw-bold text-white mb-2">{item[1]}</h5>
                      <p className="text-white text-opacity-65 mb-0 small">{item[2]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dark-panel py-5 border-top border-bottom position-relative" style={{ zIndex: 2, borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="container py-4">
              <div className="row align-items-center g-4">
                <div className="col-md-6">
                  <span className="badge bg-danger text-white fw-bold px-3 py-2 mb-2">ALERTAS E INFORMES</span>
                  <h2 className="fw-black text-white display-6">Supervisión en tiempo real para Administradores</h2>
                  <p className="text-white text-opacity-65">CentralGuard conecta a vigilantes, supervisores y administradores en una única interfaz con roles bien definidos y respaldada por Supabase.</p>
                  <ul className="list-unstyled">
                    <li className="mb-2 text-white text-opacity-85"><i className="bi bi-check-circle-fill text-success me-2"></i> Control total de acceso según el rol.</li>
                    <li className="mb-2 text-white text-opacity-85"><i className="bi bi-check-circle-fill text-success me-2"></i> Generación instantánea de historiales de rondas.</li>
                    <li className="mb-2 text-white text-opacity-85"><i className="bi bi-check-circle-fill text-success me-2"></i> Sistema de mensajería interna y notificaciones.</li>
                  </ul>
                </div>
                <div className="col-md-6 text-center">
                  <div className="p-4 dark-glass-panel rounded-4">
                    <div className="fs-1 hero-icon-accent mb-2"><i className="bi bi-shield-lock-fill"></i></div>
                    <h4 className="fw-bold text-white">CentralGuard Cloud</h4>
                    <p className="text-white text-opacity-65 small mb-0">Seguridad en la nube pensada para conjuntos de cualquier tamaño.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="contacto" className="py-5 position-relative" style={{ zIndex: 2 }}>
            <div className="container my-4" style={{ maxWidth: '650px' }}>
              <div className="dark-glass-panel rounded-4 p-4 p-md-5">
                <div className="text-center mb-4">
                  <span className="fs-1 hero-icon-accent"><i className="bi bi-envelope-paper-fill"></i></span>
                  <h2 className="fw-bold text-white mt-2 mb-1">Contáctenos</h2>
                  <p className="text-white text-opacity-65">¿Deseas implementar CentralGuard en tu copropiedad? Completa el formulario y te contactaremos.</p>
                </div>

                <form onSubmit={e => { e.preventDefault(); Swal.fire('¡Enviado!', 'Su mensaje ha sido enviado con éxito.', 'success') }}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-white-50">Nombre Completo:</label>
                    <input className="form-control form-control-lg rounded-3 input-dark" placeholder="Ej: Juan Pérez" required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-white-50">Correo Electrónico:</label>
                    <input type="email" className="form-control form-control-lg rounded-3 input-dark" placeholder="ejemplo@correo.com" required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-white-50">Mensaje o Solicitud:</label>
                    <textarea className="form-control form-control-lg rounded-3 input-dark" rows="4" placeholder="Cuéntanos cuántas porterías o vigilantes tienes..." required />
                  </div>
                  <button className="btn btn-hero-primary w-100 fw-bold py-3 rounded-pill fs-5">
                    Enviar Mensaje
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="bg-dark text-white py-4 mt-auto border-top border-secondary">
        <div className="container text-center">
          <p className="mb-1 fw-semibold"><i className="bi bi-shield-fill-check me-2"></i>CentralGuard - Sistema de Control y Seguridad Operativa</p>
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
            <div className="mb-2">
              <label className="form-label fw-semibold small">Contraseña:</label>
              <input type="password" className="form-control form-control-lg rounded-3" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} required />
            </div>

            <div className="text-end mb-4">
              <button
                type="button"
                className="btn btn-link p-0 small text-decoration-none"
                style={{ color: '#6ea8fe' }}
                onClick={() => { setMostrarModalLogin(false); setMostrarModalRecuperar(true) }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button className="btn btn-primary w-100 fw-bold py-3 rounded-3 mb-3" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>

              <div className="alert alert-secondary small mb-0 rounded-3">
                <strong><i className="bi bi-info-circle-fill me-1"></i>Usuarios de prueba:</strong><br/>
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

      {mostrarModalRecuperar && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4 border-0 shadow-lg rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold m-0"><i className="bi bi-key-fill me-2"></i>Recuperar contraseña</h4>
                <button onClick={() => setMostrarModalRecuperar(false)} className="btn-close" />
              </div>
              <p className="text-muted small">Confirma tus datos y escribe tu nueva contraseña.</p>
              <form onSubmit={handleRecuperar}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Usuario o correo:</label>
                  <input className="form-control rounded-3" value={recUsuario} onChange={e => setRecUsuario(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Nombre:</label>
                  <input className="form-control rounded-3" value={recNombre} onChange={e => setRecNombre(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Apellido:</label>
                  <input className="form-control rounded-3" value={recApellido} onChange={e => setRecApellido(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Nueva contraseña:</label>
                  <input type="password" className="form-control rounded-3" value={recNueva} onChange={e => setRecNueva(e.target.value)} required minLength={6} />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Confirmar contraseña:</label>
                  <input type="password" className="form-control rounded-3" value={recConfirmar} onChange={e => setRecConfirmar(e.target.value)} required minLength={6} />
                </div>
                <button className="btn btn-primary w-100 fw-bold py-3 rounded-3" disabled={cargando}>
                  {cargando ? 'Actualizando...' : 'Cambiar contraseña'}
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
