import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'

const claseEstado = (e) =>
  e === 'Dañado' ? 'bg-danger' : e === 'Regular' ? 'bg-warning text-dark' : 'bg-success'

export default function MisEquipos({ usuario }) {
  const [equipos, setEquipos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('equipos')
      .select('*')
      .eq('idusuario', usuario.idusuario)
      .order('equipo', { ascending: true })
    setError(error ? error.message : '')
    setEquipos(data || [])
    setCargando(false)
  }, [usuario.idusuario])

  useEffect(() => {
    cargar()
    const t = setInterval(cargar, 15000) // se actualiza solo cuando el supervisor asigna algo
    return () => clearInterval(t)
  }, [cargar])

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <div>
          <span className="eyebrow">DOTACIÓN</span>
          <h3 className="h5 mb-1">Mis equipos asignados</h3>
          <p className="text-muted mb-0">Estos son los equipos que el supervisor te asignó y que debes tener a tu cargo durante el servicio.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargar}>↻ Actualizar</button>
      </div>

      {error && <div className="alert alert-warning border-0">{error}</div>}

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr><th>Equipo</th><th>Código</th><th>Estado</th><th>Entregado el</th><th>Asignado por</th></tr>
          </thead>
          <tbody>
            {equipos.map(eq => (
              <tr key={eq.id}>
                <td className="fw-semibold">{eq.equipo}</td>
                <td>{eq.codigo || '—'}</td>
                <td><span className={`badge ${claseEstado(eq.estado)}`}>{eq.estado || '—'}</span></td>
                <td>{String(eq.fecha_entrega || '—').slice(0, 10)}</td>
                <td>{eq.asignado_por || '—'}</td>
              </tr>
            ))}
            {!equipos.length && (
              <tr><td colSpan="5" className="text-center py-4 text-muted">
                {cargando ? 'Cargando...' : 'Por ahora no tienes equipos asignados.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
