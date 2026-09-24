import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const NIVELES = ['Leve', 'Moderado', 'Grave']

const nombreDe = (v) => `${v.nombre || ''} ${v.apellido || ''}`.trim() || v.usuario
const claseNivel = (n) => n === 'Grave' ? 'bg-danger' : n === 'Moderado' ? 'bg-warning text-dark' : 'bg-info text-dark'

export default function SupervisorAdvertencias({ vigilantes, usuario }) {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [idVigilante, setIdVigilante] = useState('')
  const [motivo, setMotivo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [nivel, setNivel] = useState('Leve')

  const [filtroVig, setFiltroVig] = useState('Todos')
  const [filtroNivel, setFiltroNivel] = useState('Todos')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('advertencias').select('*').order('fecha', { ascending: false })
    setErrorCarga(error ? error.message : '')
    setLista(data || [])
    setCargando(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const registrar = async (e) => {
    e.preventDefault()
    const vig = vigilantes.find(v => String(v.idusuario) === String(idVigilante))
    if (!vig) return Swal.fire('Falta el vigilante', 'Selecciona a quién va dirigida la advertencia.', 'warning')

    const confirmacion = await Swal.fire({
      title: '¿Registrar advertencia?',
      text: `Se registrará una advertencia de gravedad "${nivel}" a ${nombreDe(vig)}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    })
    if (!confirmacion.isConfirmed) return

    setGuardando(true)
    const { error } = await supabase.from('advertencias').insert([{
      idusuario: vig.idusuario,
      vigilante: nombreDe(vig),
      supervisor: usuario?.nombre || 'Supervisor',
      motivo: motivo.trim(),
      descripcion: descripcion.trim(),
      nivel,
      fecha: new Date().toLocaleDateString('en-CA')
    }])
    setGuardando(false)

    if (error) return Swal.fire('Error', error.message, 'error')

    setMotivo(''); setDescripcion(''); setNivel('Leve'); setIdVigilante('')
    Swal.fire('Registrada', 'La advertencia quedó en el historial del vigilante.', 'success')
    cargar()
  }

  const eliminar = async (a) => {
    const r = await Swal.fire({
      title: '¿Eliminar advertencia?',
      text: `Se quitará "${a.motivo}" del historial de ${a.vigilante || 'este vigilante'}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!r.isConfirmed) return
    const { error } = await supabase.from('advertencias').delete().eq('id', a.id)
    if (error) return Swal.fire('Error', error.message, 'error')
    setLista(prev => prev.filter(x => x.id !== a.id))
  }

  // Historial del vigilante elegido (o de todos)
  const delVigilante = useMemo(
    () => lista.filter(a => filtroVig === 'Todos' || String(a.idusuario) === filtroVig),
    [lista, filtroVig]
  )
  const visibles = useMemo(
    () => delVigilante.filter(a => filtroNivel === 'Todos' || a.nivel === filtroNivel),
    [delVigilante, filtroNivel]
  )
  const conteo = (n) => delVigilante.filter(a => a.nivel === n).length

  return (
    <section className="panel-section">
      <div className="panel-card mb-4">
        <span className="eyebrow">REGISTRO DISCIPLINARIO</span>
        <h3 className="h5 mb-3">Registrar advertencia</h3>

        <form onSubmit={registrar}>
          <div className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-semibold">Vigilante</label>
              <select className="form-select" value={idVigilante} onChange={e => setIdVigilante(e.target.value)} required>
                <option value="">Selecciona un vigilante</option>
                {vigilantes.map(v => <option key={v.idusuario} value={v.idusuario}>{nombreDe(v)}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Motivo</label>
              <input className="form-control" placeholder="Ej: Llegada tarde, abandono de puesto..." value={motivo} onChange={e => setMotivo(e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">Gravedad</label>
              <select className="form-select" value={nivel} onChange={e => setNivel(e.target.value)}>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Descripción</label>
              <textarea className="form-control" rows="3" placeholder="Detalla lo ocurrido..." value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
            </div>
            <div className="col-12 text-end">
              <button type="submit" className="btn btn-danger px-4" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar advertencia'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="panel-card">
        <span className="eyebrow">HISTORIAL</span>
        <h3 className="h5 mb-3">Advertencias registradas</h3>

        {errorCarga && <div className="alert alert-warning border-0">{errorCarga}</div>}

        <div className="filters-bar mb-3">
          <div>
            <label>Vigilante</label>
            <select className="form-select form-select-sm" value={filtroVig} onChange={e => setFiltroVig(e.target.value)}>
              <option value="Todos">Todos</option>
              {vigilantes.map(v => <option key={v.idusuario} value={String(v.idusuario)}>{nombreDe(v)}</option>)}
            </select>
          </div>
          <div>
            <label>Gravedad</label>
            <select className="form-select form-select-sm" value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}>
              <option value="Todos">Todas</option>
              {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="d-flex gap-2 align-items-end">
            <span className="badge bg-info text-dark">Leves: {conteo('Leve')}</span>
            <span className="badge bg-warning text-dark">Moderadas: {conteo('Moderado')}</span>
            <span className="badge bg-danger">Graves: {conteo('Grave')}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Fecha</th><th>Vigilante</th><th>Motivo</th><th>Descripción</th><th>Gravedad</th><th>Registrada por</th><th className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {visibles.map(a => (
                <tr key={a.id}>
                  <td>{String(a.fecha || '').slice(0, 10)}</td>
                  <td className="fw-semibold">{a.vigilante || '—'}</td>
                  <td>{a.motivo}</td>
                  <td>{a.descripcion}</td>
                  <td><span className={`badge ${claseNivel(a.nivel)}`}>{a.nivel}</span></td>
                  <td>{a.supervisor || '—'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(a)} title="Eliminar advertencia">🗑️</button>
                  </td>
                </tr>
              ))}
              {!visibles.length && (
                <tr><td colSpan="7" className="text-center py-4 text-muted">
                  {cargando ? 'Cargando...' : 'No hay advertencias para mostrar.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
