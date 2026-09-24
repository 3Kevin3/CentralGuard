import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const nombreDe = (v) => `${v.nombre || ''} ${v.apellido || ''}`.trim() || v.usuario
const diaLocal = (f) => { try { return f ? new Date(f).toLocaleDateString('en-CA') : '' } catch { return '' } }
const ETIQUETA = { recibido: 'Recibido en portería', entregado: 'Entregado' }

export default function SupervisorPedidos({ vigilantes }) {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtroVig, setFiltroVig] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('pedidos').select('*')
      .order('fecha_recepcion', { ascending: false })
    setError(error ? error.message : '')
    setPedidos(data || [])
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 15000) // respaldo por si el tiempo real no está activo
    const canal = supabase.channel('supervisor-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => cargar())
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(canal) }
  }, [cargar])

  const nombrePorId = useMemo(() => {
    const m = {}
    vigilantes.forEach(v => { m[String(v.idusuario)] = nombreDe(v) })
    return m
  }, [vigilantes])

  const quien = (p) => nombrePorId[String(p.idusuario)] || (p.idusuario ? `Vigilante #${p.idusuario}` : '—')

  const eliminar = async (x) => {
    const r = await Swal.fire({
      title: '¿Eliminar pedido?',
      text: `Se eliminará "${x.nombre_pedido}" registrado por ${quien(x)}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!r.isConfirmed) return

    const { data, error } = await supabase.from('pedidos').delete().eq('id', x.id).select()
    if (error) return Swal.fire('Error', error.message, 'error')
    if (!data || data.length === 0) return Swal.fire('No se pudo eliminar', 'La base de datos no permitió borrar el registro.', 'error')

    setPedidos(prev => prev.filter(item => item.id !== x.id))
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', timer: 2000, showConfirmButton: false, title: 'Pedido eliminado' })
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return pedidos.filter(p => {
      const vigOk = filtroVig === 'Todos' || String(p.idusuario) === filtroVig
      const estOk = filtroEstado === 'Todos' || p.estado === filtroEstado
      const fecOk = !filtroFecha || diaLocal(p.fecha_recepcion) === filtroFecha
      const txtOk = !q || `${p.nombre_pedido || ''} ${p.destinatario || ''} ${p.descripcion || ''}`.toLowerCase().includes(q)
      return vigOk && estOk && fecOk && txtOk
    })
  }, [pedidos, filtroVig, filtroEstado, filtroFecha, busqueda])

  const recibidos = pedidos.filter(p => p.estado === 'recibido').length
  const entregados = pedidos.filter(p => p.estado === 'entregado').length

  return (
    <section className="panel-section">
      <div className="panel-card">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <span className="eyebrow">PEDIDOS Y DELIVERIES</span>
            <h3 className="h5 mb-0">Pedidos registrados en portería</h3>
          </div>
          <div className="d-flex gap-2">
            <span className="badge bg-secondary">Total: {pedidos.length}</span>
            <span className="badge bg-primary">En portería: {recibidos}</span>
            <span className="badge bg-success">Entregados: {entregados}</span>
          </div>
        </div>

        {error && <div className="alert alert-warning border-0">{error}</div>}

        <div className="filters-bar mb-3">
          <div>
            <label>Vigilante</label>
            <select className="form-select form-select-sm" value={filtroVig} onChange={e => setFiltroVig(e.target.value)}>
              <option value="Todos">Todos</option>
              {vigilantes.map(v => <option key={v.idusuario} value={String(v.idusuario)}>{nombreDe(v)}</option>)}
            </select>
          </div>
          <div>
            <label>Estado</label>
            <select className="form-select form-select-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="recibido">Recibido en portería</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label>Fecha</label>
            <input type="date" className="form-control form-control-sm" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          </div>
          <div>
            <label>Buscar</label>
            <input className="form-control form-control-sm" placeholder="Empresa o destinatario..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <button className="btn btn-outline-secondary btn-sm align-self-end" onClick={() => { setFiltroVig('Todos'); setFiltroEstado('Todos'); setFiltroFecha(''); setBusqueda('') }}>
            Limpiar filtros
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Fecha / Hora</th><th>Registrado por</th><th>Pedido / Empresa</th><th>Destinatario</th><th>Detalles</th><th>Estado</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map(p => (
                <tr key={p.id}>
                  <td>{p.fecha_recepcion ? new Date(p.fecha_recepcion).toLocaleString() : '—'}</td>
                  <td className="fw-semibold">{quien(p)}</td>
                  <td>{p.nombre_pedido}</td>
                  <td>{p.destinatario}</td>
                  <td>{p.descripcion || '—'}</td>
                  <td><span className={`badge ${p.estado === 'entregado' ? 'bg-success' : 'bg-primary'}`}>{ETIQUETA[p.estado] || p.estado}</span></td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(p)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan="7" className="text-center py-4 text-muted">
                  {cargando ? 'Cargando...' : 'No hay pedidos para mostrar.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
