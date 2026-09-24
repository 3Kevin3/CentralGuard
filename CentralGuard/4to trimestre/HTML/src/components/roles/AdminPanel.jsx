import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'
import AdminChat from './AdminChat'

export default function AdminPanel() {
  const [tab, setTab] = useState('usuarios') // 'usuarios' | 'personal' | 'chat'
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [personal, setPersonal] = useState([])

  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = async () => {
    setCargando(true)
    setError('')

    const [u, r, p] = await Promise.all([
      supabase.from('usuarios').select('*'),
      supabase.from('roles').select('*'),
      supabase.from('personal').select('*')
    ])

    if (u.error) setError(`Error al cargar datos principales: ${u.error.message}`)

    setUsuarios(u.data || [])
    setRoles(r.data || [])
    setPersonal(p.data || [])
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  const rolNombre = (idroles) => {
    const rol = roles.find(r => String(r.idroles) === String(idroles))
    return rol?.nombre_rol || rol?.nombre || 'Sin rol'
  }

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

  return (
    <div className="role-panel">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Panel de Administrador</h1>
          <p className="text-muted mb-0">Control de cuentas, información laboral y comunicación con el supervisor en CentralGuard.</p>
        </div>
        <button className="btn btn-dark rounded-pill px-4" onClick={cargar} disabled={cargando}>
          {cargando ? 'Cargando...' : '↻ Actualizar datos'}
        </button>
      </div>

      {error && <div className="alert alert-warning border-0 shadow-sm">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"></span><div><small>Usuarios</small><strong>{usuarios.length}</strong></div></div>
        <div className="stat-card"><span className="stat-icon"></span><div><small>Personal</small><strong>{personal.length}</strong></div></div>
      </div>

      <div className="d-flex gap-2 my-3 flex-wrap">
        <button className={`btn ${tab === 'usuarios' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('usuarios')}>Cuentas</button>
        <button className={`btn ${tab === 'personal' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('personal')}>Información laboral</button>
        <button className={`btn ${tab === 'chat' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTab('chat')}>Chat con Supervisor</button>
      </div>

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

      {tab === 'personal' && (
        <div className="panel-card">
          <div className="panel-toolbar">
            <div>
              <h3>Información Laboral de Trabajadores</h3>
              <p>Datos laborales e historial de empleados.</p>
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
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarRegistro('personal', p.id, p.nombre_completo)}>🗑️ Eliminar</button>
                    </td>
                  </tr>
                ))}
                {!personal.length && <tr><td colSpan="6" className="text-center py-4">No hay personal registrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'chat' && <AdminChat />}
    </div>
  )
}
