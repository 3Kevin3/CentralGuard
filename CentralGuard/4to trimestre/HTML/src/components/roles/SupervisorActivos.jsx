import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const TIPOS = ['Radio de comunicación', 'Linterna', 'Uniforme', 'Bastón de seguridad', 'Chaleco reflectivo', 'Llaves', 'Dispositivo móvil']
const ESTADOS = ['Nuevo', 'Bueno', 'Regular', 'Dañado']

const nombreDe = (v) => `${v.nombre || ''} ${v.apellido || ''}`.trim() || v.usuario
const hoy = () => new Date().toLocaleDateString('en-CA')

export default function SupervisorActivos({ vigilantes, usuario }) {
  const [equipos, setEquipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [tipo, setTipo] = useState(TIPOS[0])
  const [codigo, setCodigo] = useState('')
  const [estado, setEstado] = useState('Nuevo')
  const [asignarA, setAsignarA] = useState('')

  const [filtroVig, setFiltroVig] = useState('Todos') // 'Todos' | 'sin' | idusuario
  const [busqueda, setBusqueda] = useState('')

  const supervisor = usuario?.nombre || 'Supervisor'

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('equipos').select('*').order('equipo', { ascending: true })
    setErrorCarga(error ? error.message : '')
    setEquipos(data || [])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const agregar = async (e) => {
    e.preventDefault()
    const vig = vigilantes.find(v => String(v.idusuario) === String(asignarA))

    setGuardando(true)
    const { error } = await supabase.from('equipos').insert([{
      equipo: tipo,
      codigo: codigo.trim() || null,
      estado,
      idusuario: vig ? vig.idusuario : null,
      responsable: vig ? nombreDe(vig) : null,
      fecha_entrega: vig ? hoy() : null,
      asignado_por: vig ? supervisor : null
    }])
    setGuardando(false)

    if (error) return Swal.fire('Error', error.message, 'error')

    setCodigo(''); setEstado('Nuevo'); setAsignarA('')
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', timer: 2000, showConfirmButton: false, title: 'Equipo agregado al inventario' })
    cargar()
  }

  const cambiarEstado = async (eq, nuevo) => {
    const { error } = await supabase.from('equipos').update({ estado: nuevo }).eq('id', eq.id)
    if (error) return Swal.fire('Error', error.message, 'error')
    setEquipos(prev => prev.map(x => x.id === eq.id ? { ...x, estado: nuevo } : x))
  }

  const reasignar = async (eq, idStr) => {
    const vig = vigilantes.find(v => String(v.idusuario) === idStr)
    const cambios = vig
      ? { idusuario: vig.idusuario, responsable: nombreDe(vig), fecha_entrega: hoy(), asignado_por: supervisor }
      : { idusuario: null, responsable: null, fecha_entrega: null, asignado_por: null }

    const { error } = await supabase.from('equipos').update(cambios).eq('id', eq.id)
    if (error) return Swal.fire('Error', error.message, 'error')
    setEquipos(prev => prev.map(x => x.id === eq.id ? { ...x, ...cambios } : x))
  }

  const eliminar = async (eq) => {
    const r = await Swal.fire({
      title: '¿Eliminar del inventario?',
      text: `Se eliminará "${eq.equipo}${eq.codigo ? ' ' + eq.codigo : ''}" permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!r.isConfirmed) return
    const { error } = await supabase.from('equipos').delete().eq('id', eq.id)
    if (error) return Swal.fire('Error', error.message, 'error')
    setEquipos(prev => prev.filter(x => x.id !== eq.id))
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return equipos.filter(eq => {
      const vigOk = filtroVig === 'Todos'
        || (filtroVig === 'sin' ? !eq.idusuario : String(eq.idusuario) === filtroVig)
      const textoOk = !q || `${eq.equipo || ''} ${eq.codigo || ''}`.toLowerCase().includes(q)
      return vigOk && textoOk
    })
  }, [equipos, filtroVig, busqueda])

  const asignados = equipos.filter(e => e.idusuario).length
  const danados = equipos.filter(e => e.estado === 'Dañado').length

  return (
    <section className="panel-section">
      <div className="panel-card mb-4">
        <span className="eyebrow">INVENTARIO</span>
        <h3 className="h5 mb-3">Agregar equipo</h3>

        <form onSubmit={agregar}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Tipo de equipo</label>
              <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Código (opcional)</label>
              <input className="form-control" placeholder="Ej: Radio #3" value={codigo} onChange={e => setCodigo(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold">Estado</label>
              <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Asignar a</label>
              <select className="form-select" value={asignarA} onChange={e => setAsignarA(e.target.value)}>
                <option value="">Sin asignar (bodega)</option>
                {vigilantes.map(v => <option key={v.idusuario} value={v.idusuario}>{nombreDe(v)}</option>)}
              </select>
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-primary px-4" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Agregar equipo'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel-card">
        <span className="eyebrow">GESTIÓN DE ACTIVOS</span>
        <h3 className="h5 mb-3">Inventario y asignaciones</h3>

        {errorCarga && <div className="alert alert-warning border-0">{errorCarga}</div>}

        <div className="filters-bar mb-3">
          <div>
            <label>Asignado a</label>
            <select className="form-select form-select-sm" value={filtroVig} onChange={e => setFiltroVig(e.target.value)}>
              <option value="Todos">Todos</option>
              <option value="sin">Sin asignar (bodega)</option>
              {vigilantes.map(v => <option key={v.idusuario} value={String(v.idusuario)}>{nombreDe(v)}</option>)}
            </select>
          </div>
          <div>
            <label>Buscar</label>
            <input className="form-control form-control-sm" placeholder="Equipo o código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <div className="d-flex gap-2 align-items-end">
            <span className="badge bg-secondary">Total: {equipos.length}</span>
            <span className="badge bg-success">Asignados: {asignados}</span>
            <span className="badge bg-danger">Dañados: {danados}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Equipo</th><th>Código</th><th>Estado</th><th>Asignado a</th><th>Entrega</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map(eq => {
                const valorAsignado = eq.idusuario ? String(eq.idusuario) : ''
                const enLista = vigilantes.some(v => String(v.idusuario) === valorAsignado)
                return (
                  <tr key={eq.id}>
                    <td className="fw-semibold">{eq.equipo}</td>
                    <td>{eq.codigo || '—'}</td>
                    <td style={{ minWidth: 120 }}>
                      <select className="form-select form-select-sm" value={eq.estado || 'Bueno'} onChange={e => cambiarEstado(eq, e.target.value)}>
                        {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ minWidth: 200 }}>
                      <select className="form-select form-select-sm" value={valorAsignado} onChange={e => reasignar(eq, e.target.value)}>
                        <option value="">Sin asignar (bodega)</option>
                        {!enLista && valorAsignado && <option value={valorAsignado}>{eq.responsable || 'Usuario ' + valorAsignado}</option>}
                        {vigilantes.map(v => <option key={v.idusuario} value={v.idusuario}>{nombreDe(v)}</option>)}
                      </select>
                    </td>
                    <td>{String(eq.fecha_entrega || '—').slice(0, 10)}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(eq)} title="Eliminar equipo">🗑️</button>
                    </td>
                  </tr>
                )
              })}
              {!visibles.length && (
                <tr><td colSpan="6" className="text-center py-4 text-muted">
                  {cargando ? 'Cargando...' : 'No hay equipos para mostrar.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
