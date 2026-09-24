import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const nombreDe = (v) => `${v.nombre || ''} ${v.apellido || ''}`.trim() || v.usuario
const diaLocal = (f) => { try { return f ? new Date(f).toLocaleDateString('en-CA') : '' } catch { return '' } }
const ETIQUETA = { en_custodia: 'En custodia', entregado: 'Entregado' }

export default function SupervisorObjetosPerdidos({ vigilantes }) {
  const [objetos, setObjetos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [filtroVig, setFiltroVig] = useState('Todos')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('objetos_perdidos').select('*')
      .order('fecha_registro', { ascending: false })
    setError(error ? error.message : '')
    setObjetos(data || [])
    setCargando(false)
  }, [])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 15000) // respaldo por si el tiempo real no está activo
    const canal = supabase.channel('supervisor-objetos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objetos_perdidos' }, () => cargar())
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(canal) }
  }, [cargar])

  const nombrePorId = useMemo(() => {
    const m = {}
    vigilantes.forEach(v => { m[String(v.idusuario)] = nombreDe(v) })
    return m
  }, [vigilantes])

  const quien = (o) => nombrePorId[String(o.idusuario)] || (o.idusuario ? `Vigilante #${o.idusuario}` : '—')

  const eliminar = async (x) => {
    const r = await Swal.fire({
      title: '¿Eliminar objeto perdido?',
      text: `Se eliminará "${x.articulo}" registrado por ${quien(x)}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!r.isConfirmed) return

    const { data, error } = await supabase.from('objetos_perdidos').delete().eq('id', x.id).select()
    if (error) return Swal.fire('Error', error.message, 'error')
    if (!data || data.length === 0) return Swal.fire('No se pudo eliminar', 'La base de datos no permitió borrar el registro.', 'error')

    setObjetos(prev => prev.filter(item => item.id !== x.id))
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', timer: 2000, showConfirmButton: false, title: 'Objeto eliminado' })
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return objetos.filter(o => {
      const vigOk = filtroVig === 'Todos' || String(o.idusuario) === filtroVig
      const estOk = filtroEstado === 'Todos' || o.estado === filtroEstado
      const fecOk = !filtroFecha || diaLocal(o.fecha_registro) === filtroFecha
      const txtOk = !q || `${o.articulo || ''} ${o.ubicacion_hallazgo || ''} ${o.entregado_a || ''}`.toLowerCase().includes(q)
      return vigOk && estOk && fecOk && txtOk
    })
  }, [objetos, filtroVig, filtroEstado, filtroFecha, busqueda])

  const enCustodia = objetos.filter(o => o.estado === 'en_custodia').length
  const entregados = objetos.filter(o => o.estado === 'entregado').length

  return (
    <section className="panel-section">
      <div className="panel-card">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <span className="eyebrow">OBJETOS PERDIDOS</span>
            <h3 className="h5 mb-0">Objetos registrados por los vigilantes</h3>
          </div>
          <div className="d-flex gap-2">
            <span className="badge bg-secondary">Total: {objetos.length}</span>
            <span className="badge bg-warning text-dark">En custodia: {enCustodia}</span>
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
              <option value="en_custodia">En custodia</option>
              <option value="entregado">Entregado</option>
            </select>
          </div>
          <div>
            <label>Fecha</label>
            <input type="date" className="form-control form-control-sm" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          </div>
          <div>
            <label>Buscar</label>
            <input className="form-control form-control-sm" placeholder="Artículo o lugar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <button className="btn btn-outline-secondary btn-sm align-self-end" onClick={() => { setFiltroVig('Todos'); setFiltroEstado('Todos'); setFiltroFecha(''); setBusqueda('') }}>
            Limpiar filtros
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Fecha</th><th>Registrado por</th><th>Artículo</th><th>Lugar del hallazgo</th><th>Estado</th><th>Entregado a</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map(o => (
                <tr key={o.id}>
                  <td>{o.fecha_registro ? new Date(o.fecha_registro).toLocaleString() : '—'}</td>
                  <td className="fw-semibold">{quien(o)}</td>
                  <td>{o.articulo}</td>
                  <td>{o.ubicacion_hallazgo || 'N/A'}</td>
                  <td><span className={`badge ${o.estado === 'entregado' ? 'bg-success' : 'bg-warning text-dark'}`}>{ETIQUETA[o.estado] || o.estado}</span></td>
                  <td>{o.entregado_a || '—'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(o)} title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan="7" className="text-center py-4 text-muted">
                  {cargando ? 'Cargando...' : 'No hay objetos perdidos para mostrar.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
