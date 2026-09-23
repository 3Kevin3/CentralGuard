import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function AdminPanel() {
  const [tab, setTab] = useState('usuarios') // 'usuarios' | 'personal' | 'advertencias' | 'turnos' | 'equipos'
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  
  // Estados para la gestión operativa
  const [personal, setPersonal] = useState([])
  const [advertencias, setAdvertencias] = useState([])
  const [turnos, setTurnos] = useState([])
  const [equipos, setEquipos] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Opciones predefinidas según requerimientos
  const PUESTOS = ['Portería principal', 'Portería secundaria', 'Recepción', 'Parqueadero', 'Torre residencial', 'Zona social', 'Piscina', 'Ronda perimetral']
  const TIPOS_EQUIPO = ['Radio de comunicación', 'Linterna', 'Uniforme', 'Bastón de seguridad', 'Chaleco reflectivo', 'Llaves', 'Dispositivo móvil']

  const cargar = async () => {
    setCargando(true)
    setError('')

    const [u, r, p, a, t, e] = await Promise.all([
      supabase.from('usuarios').select('*'),
      supabase.from('roles').select('*'),
      supabase.from('personal').select('*'),
      supabase.from('advertencias').select('*'),
      supabase.from('turnos').select('*'),
      supabase.from('equipos').select('*')
    ])

    if (u.error) setError(`Error al cargar datos principales: ${u.error.message}`)

    setUsuarios(u.data || [])
    setRoles(r.data || [])
    setPersonal(p.data || [])
    setAdvertencias(a.data || [])
    setTurnos(t.data || [])
    setEquipos(e.data || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const rolNombre = (idroles) => {
    const rol = roles.find(r => String(r.idroles) === String(idroles))
    return rol?.nombre_rol || rol?.nombre || 'Sin rol'
  }

  // eliminar registros
  const eliminarRegistro = async (tabla, id, nombreItem) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará permanentemente "${nombreItem}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (confirmacion.isConfirmed) {
      const { error } = await supabase.from(tabla).delete().eq('id', id)
      if (error) {
        Swal.fire('Error', error.message, 'error')
      } else {
        Swal.fire('Eliminado', 'El registro fue eliminado correctamente.', 'success')
        cargar()
      }
    }
  }

  // creacion
  const crearEmpleado = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Empleado',
      html:
        '<input id="swal-nombre" class="swal2-input" placeholder="Nombre completo">' +
        '<input id="swal-doc" class="swal2-input" placeholder="Documento de identidad">' +
        '<input id="swal-cargo" class="swal2-input" placeholder="Cargo">' +
        '<input id="swal-tel" class="swal2-input" placeholder="Teléfono">' +
        '<input id="swal-dir" class="swal2-input" placeholder="Dirección">',
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        nombre_completo: document.getElementById('swal-nombre').value,
        documento: document.getElementById('swal-doc').value,
        cargo: document.getElementById('swal-cargo').value,
        telefono: document.getElementById('swal-tel').value,
        direccion: document.getElementById('swal-dir').value,
        fecha_ingreso: new Date().toISOString().split('T')[0]
      })
    })

    if (formValues) {
      const { error } = await supabase.from('personal').insert([formValues])
      if (error) Swal.fire('Error', error.message, 'error')
      else { Swal.fire('Éxito', 'Empleado registrado', 'success'); cargar() }
    }
  }

  const crearAdvertencia = async () => {
    const options = personal.map(p => `<option value="${p.id}">${p.nombre_completo}</option>`).join('')
    const { value: formValues } = await Swal.fire({
      title: 'Registrar Advertencia',
      html:
        `<select id="swal-emp" class="swal2-select"><option value="">Seleccione Empleado</option>${options}</select>` +
        '<input id="swal-motivo" class="swal2-input" placeholder="Motivo">' +
        '<textarea id="swal-desc" class="swal2-textarea" placeholder="Descripción"></textarea>' +
        '<select id="swal-nivel" class="swal2-select">' +
          '<option value="Leve">Leve</option>' +
          '<option value="Moderado">Moderado</option>' +
          '<option value="Grave">Grave</option>' +
        '</select>',
      showCancelButton: true,
      preConfirm: () => ({
        empleado_id: document.getElementById('swal-emp').value,
        motivo: document.getElementById('swal-motivo').value,
        descripcion: document.getElementById('swal-desc').value,
        nivel: document.getElementById('swal-nivel').value,
        fecha: new Date().toISOString().split('T')[0]
      })
    })

    if (formValues) {
      const { error } = await supabase.from('advertencias').insert([formValues])
      if (error) Swal.fire('Error', error.message, 'error')
      else { Swal.fire('Éxito', 'Advertencia registrada', 'success'); cargar() }
    }
  }

  const crearTurno = async () => {
    const vigilantes = personal.map(p => `<option value="${p.nombre_completo}">${p.nombre_completo}</option>`).join('')
    const puestos = PUESTOS.map(p => `<option value="${p}">${p}</option>`).join('')

    const { value: formValues } = await Swal.fire({
      title: 'Programar Turno',
      html:
        `<select id="swal-vig" class="swal2-select"><option value="">Vigilante</option>${vigilantes}</select>` +
        '<input id="swal-sup" class="swal2-input" placeholder="Supervisor responsable">' +
        '<input id="swal-fecha" type="date" class="swal2-input">' +
        '<div class="d-flex gap-2"><input id="swal-inicio" type="time" class="swal2-input" placeholder="Inicio">' +
        '<input id="swal-fin" type="time" class="swal2-input" placeholder="Fin"></div>' +
        `<select id="swal-puesto" class="swal2-select"><option value="">Puesto de trabajo</option>${puestos}</select>`,
      showCancelButton: true,
      preConfirm: () => ({
        vigilante: document.getElementById('swal-vig').value,
        supervisor: document.getElementById('swal-sup').value,
        fecha: document.getElementById('swal-fecha').value,
        hora_inicio: document.getElementById('swal-inicio').value,
        hora_fin: document.getElementById('swal-fin').value,
        puesto: document.getElementById('swal-puesto').value
      })
    })

    if (formValues) {
      const { error } = await supabase.from('turnos').insert([formValues])
      if (error) Swal.fire('Error', error.message, 'error')
      else { Swal.fire('Éxito', 'Turno asignado', 'success'); cargar() }
    }
  }

  const crearEquipo = async () => {
    const equiposOpts = TIPOS_EQUIPO.map(e => `<option value="${e}">${e}</option>`).join('')
    const { value: formValues } = await Swal.fire({
      title: 'Asignar Equipo / Uniforme',
      html:
        `<select id="swal-eq" class="swal2-select"><option value="">Equipo</option>${equiposOpts}</select>` +
        '<input id="swal-resp" class="swal2-input" placeholder="Responsable (Empleado)">' +
        '<input id="swal-estado" class="swal2-input" placeholder="Estado (ej. Bueno, Nuevo)">',
      showCancelButton: true,
      preConfirm: () => ({
        equipo: document.getElementById('swal-eq').value,
        responsable: document.getElementById('swal-resp').value,
        estado: document.getElementById('swal-estado').value,
        fecha_entrega: new Date().toISOString().split('T')[0]
      })
    })

    if (formValues) {
      const { error } = await supabase.from('equipos').insert([formValues])
      if (error) Swal.fire('Error', error.message, 'error')
      else { Swal.fire('Éxito', 'Recurso asignado', 'success'); cargar() }
    }
  }

  return (
    <div className="role-panel">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Panel de Administrador</h1>
          <p className="text-muted mb-0">Control total de operación, personal, turnos e inventario de CentralGuard.</p>
        </div>
        <button className="btn btn-dark rounded-pill px-4" onClick={cargar} disabled={cargando}>
          {cargando ? 'Cargando...' : '↻ Actualizar datos'}
        </button>
      </div>

      {error && <div className="alert alert-warning border-0 shadow-sm">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"></span><div><small>Usuarios</small><strong>{usuarios.length}</strong></div></div>
        <div className="stat-card"><span className="stat-icon"></span><div><small>Personal</small><strong>{personal.length}</strong></div></div>
        <div className="stat-card"><span className="stat-icon"></span><div><small>Turnos</small><strong>{turnos.length}</strong></div></div>
        <div className="stat-card"><span className="stat-icon"></span><div><small>Equipos</small><strong>{equipos.length}</strong></div></div>
      </div>

      {/* navegacop por modulos */}
      <div className="d-flex gap-2 my-3 flex-wrap">
        <button className={`btn ${tab === 'usuarios' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('usuarios')}>Cuentas</button>
        <button className={`btn ${tab === 'personal' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('personal')}>Personal (Hoja de Vida)</button>
        <button className={`btn ${tab === 'advertencias' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('advertencias')}>Advertencias</button>
        <button className={`btn ${tab === 'turnos' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('turnos')}>Programación de Turnos</button>
        <button className={`btn ${tab === 'equipos' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('equipos')}>Uniformes y Equipos</button>
      </div>

      {/* usuario y roles */}
      {tab === 'usuarios' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Usuarios del sistema</h3>
              <p>Consulta de cuentas registradas.</p>
            </div>
            <input className="form-control search-input" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar usuario..." />
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Nombre</th><th>Usuario / correo</th><th>Rol</th><th>ID</th></tr></thead>
              <tbody>
                {usuarios.filter(u => `${u.nombre || ''} ${u.apellido || ''} ${u.usuario || ''}`.toLowerCase().includes(busqueda.toLowerCase())).map((u, i) => (
                  <tr key={u.idusuario || i}>
                    <td className="fw-semibold">{`${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin nombre'}</td>
                    <td>{u.usuario || '—'}</td>
                    <td><span className="badge rounded-pill text-bg-light border">{rolNombre(u.idroles)}</span></td>
                    <td className="text-muted">{u.idusuario ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* gestion de personal */}
      {tab === 'personal' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Información Laboral de Trabajadores</h3>
              <p>Hojas de vida e historial de empleados.</p>
            </div>
            <button className="btn btn-success" onClick={crearEmpleado}>+ Agregar Empleado</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Documento</th><th>Nombre</th><th>Cargo</th><th>Teléfono</th><th>Ingreso</th><th className="text-end">Acciones</th></tr></thead>
              <tbody>
                {personal.map((p, i) => (
                  <tr key={p.id || i}>
                    <td>{p.documento}</td>
                    <td className="fw-semibold">{p.nombre_completo}</td>
                    <td><span className="badge bg-secondary">{p.cargo}</span></td>
                    <td>{p.telefono}</td>
                    <td>{p.fecha_ingreso}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRegistro('personal', p.id, p.nombre_completo)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!personal.length && <tr><td colSpan="6" className="text-center py-4">No hay personal registrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* advertencias */}
      {tab === 'advertencias' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Registro Disciplinario</h3>
              <p>Historial de faltas y sanciones del personal.</p>
            </div>
            <button className="btn btn-danger" onClick={crearAdvertencia}>+ Registrar Advertencia</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Fecha</th><th>Empleado ID</th><th>Motivo</th><th>Descripción</th><th>Nivel</th><th className="text-end">Acciones</th></tr></thead>
              <tbody>
                {advertencias.map((a, i) => (
                  <tr key={a.id || i}>
                    <td>{a.fecha}</td>
                    <td>{a.empleado_id}</td>
                    <td className="fw-semibold">{a.motivo}</td>
                    <td>{a.descripcion}</td>
                    <td>
                      <span className={`badge ${a.nivel === 'Grave' ? 'bg-danger' : a.nivel === 'Moderado' ? 'bg-warning text-dark' : 'bg-info'}`}>
                        {a.nivel}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRegistro('advertencias', a.id, `Advertencia: ${a.motivo}`)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!advertencias.length && <tr><td colSpan="6" className="text-center py-4">Sin advertencias registradas.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* turnos */}
      {tab === 'turnos' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Calendario y Asignación de Turnos</h3>
              <p>Programación de vigilancia por puestos.</p>
            </div>
            <button className="btn btn-primary" onClick={crearTurno}>+ Programar Turno</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Fecha</th><th>Horario</th><th>Vigilante</th><th>Supervisor</th><th>Puesto</th><th className="text-end">Acciones</th></tr></thead>
              <tbody>
                {turnos.map((t, i) => (
                  <tr key={t.id || i}>
                    <td>{t.fecha}</td>
                    <td>{t.hora_inicio} - {t.hora_fin}</td>
                    <td className="fw-semibold">{t.vigilante}</td>
                    <td>{t.supervisor}</td>
                    <td><span className="badge bg-outline-dark border text-dark">{t.puesto}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRegistro('turnos', t.id, `Turno de ${t.vigilante}`)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!turnos.length && <tr><td colSpan="6" className="text-center py-4">No hay turnos programados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/*control de equipos */}
      {tab === 'equipos' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Asignación de Uniformes y Equipos</h3>
              <p>Control de dotación y recursos de seguridad.</p>
            </div>
            <button className="btn btn-dark" onClick={crearEquipo}>+ Asignar Recurso</button>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th>Equipo</th><th>Responsable</th><th>Fecha Entrega</th><th>Estado</th><th className="text-end">Acciones</th></tr></thead>
              <tbody>
                {equipos.map((eq, i) => (
                  <tr key={eq.id || i}>
                    <td className="fw-semibold">{eq.equipo}</td>
                    <td>{eq.responsable}</td>
                    <td>{eq.fecha_entrega}</td>
                    <td><span className="badge bg-success">{eq.estado}</span></td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRegistro('equipos', eq.id, eq.equipo)}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {!equipos.length && <tr><td colSpan="5" className="text-center py-4">No hay equipos o uniformes asignados.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}