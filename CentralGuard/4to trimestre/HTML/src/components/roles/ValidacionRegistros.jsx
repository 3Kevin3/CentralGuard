import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const EVENTO = 'registros-actualizados'

// Globito rojo con la cantidad de registros pendientes (se pone en el menú lateral)
export function ContadorPendientes() {
  const [n, setN] = useState(0)

  useEffect(() => {
    let vivo = true
    const contar = async () => {
      const { count } = await supabase.from('usuarios')
        .select('idusuario', { count: 'exact', head: true })
        .eq('estado_registro', 'pendiente')
      if (vivo) setN(count || 0)
    }
    contar()
    const t = setInterval(contar, 15000)
    window.addEventListener(EVENTO, contar)
    return () => { vivo = false; clearInterval(t); window.removeEventListener(EVENTO, contar) }
  }, [])

  if (!n) return null
  return <span className="badge rounded-pill bg-danger ms-2">{n}</span>
}

export default function ValidacionRegistros() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [filtro, setFiltro] = useState('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    const [u, r] = await Promise.all([
      // Sin pedir la contraseña
      supabase.from('usuarios')
        .select('idusuario, idroles, usuario, nombre, apellido, estado_registro')
        .order('idusuario', { ascending: false }),
      supabase.from('roles').select('*')
    ])
    setUsuarios(u.data || [])
    setRoles(r.data || [])
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(() => cargar(true), 15000)
    return () => clearInterval(t)
  }, [cargar])

  const rolNombre = (idroles) => {
    const rol = roles.find(r => String(r.idroles) === String(idroles))
    return rol?.nombre_rol || rol?.nombre || 'Vigilante'
  }

  const estadoDe = (u) => u.estado_registro || 'aprobado'

  const conteo = useMemo(() => ({
    pendiente: usuarios.filter(u => estadoDe(u) === 'pendiente').length,
    aprobado: usuarios.filter(u => estadoDe(u) === 'aprobado').length,
    rechazado: usuarios.filter(u => estadoDe(u) === 'rechazado').length
  }), [usuarios])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter(u => {
      const estadoOk = filtro === 'todos' || estadoDe(u) === filtro
      const textoOk = !q || `${u.nombre || ''} ${u.apellido || ''} ${u.usuario || ''}`.toLowerCase().includes(q)
      return estadoOk && textoOk
    })
  }, [usuarios, filtro, busqueda])

  const cambiarEstado = async (u, nuevo) => {
  const nombre = `${u.nombre || ''} ${u.apellido || ''}`.trim() || u.usuario
  const aceptar = nuevo === 'aprobado'

  const r = await Swal.fire({
    title: aceptar ? '¿Aceptar registro?' : '¿Rechazar registro?',
    text: aceptar
      ? `${nombre} podrá iniciar sesión en el sistema.`
      : `${nombre} no podrá iniciar sesión.`,
    icon: aceptar ? 'question' : 'warning',
    showCancelButton: true,
    confirmButtonColor: aceptar ? '#198754' : '#d33',
    confirmButtonText: aceptar ? 'Sí, aceptar' : 'Sí, rechazar',
    cancelButtonText: 'Cancelar'
  })
  if (!r.isConfirmed) return

  const { error } = await supabase.from('usuarios')
    .update({ estado_registro: nuevo })
    .eq('idusuario', u.idusuario)

    if (error) return Swal.fire('Error', error.message, 'error')

    Swal.fire({
      toast: true, position: 'top-end', icon: 'success', timer: 2500, showConfirmButton: false,
      title: nuevo === 'aprobado' ? `${nombre} fue aceptado` : `${nombre} fue rechazado`
    })
    window.dispatchEvent(new Event(EVENTO))
    cargar(true)
  }

  const badge = (estado) => {
    if (estado === 'pendiente') return <span className="badge bg-warning text-dark">Pendiente</span>
    if (estado === 'rechazado') return <span className="badge bg-danger">Rechazado</span>
    return <span className="badge bg-success">Aprobado</span>
  }

  return (
    <div className="role-panel">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">ADMINISTRACIÓN</span>
          <h1>Validación de registro de vigilantes</h1>
          <p className="text-muted mb-0">Acepta o rechaza a quienes crearon una cuenta. Solo los aceptados pueden iniciar sesión.</p>
        </div>
        <button className="btn btn-dark rounded-pill px-4" onClick={() => cargar()} disabled={cargando}>
          {cargando ? 'Cargando...' : '↻ Actualizar'}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon stat-warning">◷</span><div><small className="text-muted d-block">Pendientes</small><strong>{conteo.pendiente}</strong></div></div>
        <div className="stat-card"><span className="stat-icon stat-success">✓</span><div><small className="text-muted d-block">Aprobados</small><strong>{conteo.aprobado}</strong></div></div>
        <div className="stat-card"><span className="stat-icon stat-danger">✖</span><div><small className="text-muted d-block">Rechazados</small><strong>{conteo.rechazado}</strong></div></div>
      </div>

      <div className="panel-card">
        <div className="filters-bar mb-3">
          <div>
            <label>Mostrar</label>
            <select className="form-select form-select-sm" value={filtro} onChange={e => setFiltro(e.target.value)}>
              <option value="pendiente">Pendientes</option>
              <option value="rechazado">Rechazados</option>
              <option value="aprobado">Aprobados</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <div>
            <label>Buscar</label>
            <input className="form-control form-control-sm" placeholder="Nombre o correo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Nombre</th><th>Usuario / correo</th><th>Rol</th><th>Estado</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map(u => {
                const estado = estadoDe(u)
                return (
                  <tr key={u.idusuario}>
                    <td className="fw-semibold">{`${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Sin nombre'}</td>
                    <td>{u.usuario}</td>
                    <td><span className="badge rounded-pill text-bg-light border">{rolNombre(u.idroles)}</span></td>
                    <td>{badge(estado)}</td>
                    <td className="text-end">
                      {estado !== 'aprobado' && (
                        <button className="btn btn-sm btn-success me-2" onClick={() => cambiarEstado(u, 'aprobado')}>✓ Aceptar</button>
                      )}
                      {estado === 'pendiente' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => cambiarEstado(u, 'rechazado')}>✖ Rechazar</button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {!visibles.length && (
                <tr><td colSpan="5" className="text-center py-4 text-muted">
                  {filtro === 'pendiente' ? 'No hay registros pendientes por validar.' : 'No hay registros para mostrar.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
