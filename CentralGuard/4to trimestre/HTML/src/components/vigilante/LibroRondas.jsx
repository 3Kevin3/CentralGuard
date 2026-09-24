import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function LibroRondas({ usuario }) {
  const idUsuario = usuario?.idusuario

  // Turnos que el supervisor le asignó a ESTE vigilante
  const [turnos, setTurnos] = useState([])
  const hoyStr = new Date().toLocaleDateString('en-CA')

  const cargarTurnos = async () => {
    if (!idUsuario) return
    const { data } = await supabase.from('turnos').select('*')
      .eq('idusuario', idUsuario)
      .gte('fecha', hoyStr)
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
    setTurnos(data || [])
  }

  useEffect(() => {
    if (!idUsuario) return
    cargarTurnos()
    const canal = supabase.channel(`turnos-${idUsuario}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'turnos', filter: `idusuario=eq.${idUsuario}` },
        (payload) => {
          cargarTurnos()
          if (payload.eventType === 'INSERT') {
            Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Tu supervisor te asignó un nuevo turno', timer: 4000, showConfirmButton: false })
          }
        })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [idUsuario])

  const formatoFecha = (f) => {
    try {
      return new Date(String(f).slice(0, 10) + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
    } catch { return String(f).slice(0, 10) }
  }

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between p-4 mb-4 rounded-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)' }}>
        <div className="d-flex align-items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-3 me-3 fs-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
            <i className="bi bi-journal-check"></i>
          </div>
          <div>
            <h3 className="fw-bold mb-0">Libro de Rondas Digital</h3>
            <small className="text-white-50">Control de recorrido y supervisiones en tiempo real</small>
          </div>
        </div>
        <span className="badge bg-white text-primary px-3 py-2 rounded-pill fw-bold shadow-sm">
          <i className="bi bi-patch-check-fill me-1"></i> Módulo Activo
        </span>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-body p-4 bg-white">
          <h6 className="fw-bold text-muted text-uppercase mb-3 small tracking-wide">
            <i className="bi bi-calendar-check-fill text-primary me-2"></i>
            Mis turnos asignados
          </h6>
          {turnos.length === 0 ? (
            <p className="text-muted small mb-0">No tienes turnos programados por tu supervisor.</p>
          ) : (
            <div className="row g-3">
              {turnos.map(t => {
                const esHoy = String(t.fecha).slice(0, 10) === hoyStr
                return (
                  <div className="col-md-6 col-lg-4" key={t.id}>
                    <div className={`border rounded-4 p-3 h-100 text-dark ${esHoy ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong className="text-capitalize">{formatoFecha(t.fecha)}</strong>
                        {esHoy && <span className="badge bg-primary">HOY</span>}
                      </div>
                      <div className="small mb-1"><i className="bi bi-clock me-2 text-primary"></i>{String(t.hora_inicio || '').slice(0, 5)} - {String(t.hora_fin || '').slice(0, 5)}</div>
                      <div className="small mb-1"><i className="bi bi-geo-alt-fill me-2 text-primary"></i>{t.puesto}</div>
                      {t.observaciones && <div className="small text-secondary mt-2"><i className="bi bi-chat-left-text me-2"></i>{t.observaciones}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
