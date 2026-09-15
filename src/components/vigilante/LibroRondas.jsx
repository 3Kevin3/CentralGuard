import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function LibroRondas({ usuario }) {
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [sector, setSector] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [rondas, setRondas] = useState([])

  useEffect(() => { cargarRondas() }, [])

  const cargarRondas = async () => {
    const { data } = await supabase.from('libro_rondas').select('*').order('fecha', { ascending: false })
    if (data) setRondas(data)
  }

  const registrarRonda = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('libro_rondas').insert([{
      fecha: new Date().toISOString().split('T')[0],
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      nombre_vigilante: usuario.nombre,
      sector_recorrido: sector,
      observaciones
    }])

    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      Swal.fire('¡Éxito!', 'Ronda registrada correctamente', 'success')
      setHoraInicio(''); setHoraFin(''); setSector(''); setObservaciones('')
      cargarRondas()
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary text-white p-3 rounded-3 me-3 fs-4 shadow-sm">📖</div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Libro de Rondas</h4>
          <p className="text-muted small mb-0">Control y registro de recorridos operativos en el conjunto</p>
        </div>
      </div>

      <form onSubmit={registrarRonda} className="card shadow-sm p-4 mb-4 bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Hora de Inicio:</label>
            <input type="time" className="form-control bg-light" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Hora de Finalización:</label>
            <input type="time" className="form-control bg-light" value={horaFin} onChange={e => setHoraFin(e.target.value)} required />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Sector Recorrido:</label>
          <input type="text" className="form-control bg-light" value={sector} onChange={e => setSector(e.target.value)} placeholder="Ej. Torre A y Parqueaderos" required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Observaciones:</label>
          <textarea className="form-control bg-light" value={observaciones} onChange={e => setObservaciones(e.target.value)} rows="2" placeholder="Novedades menores durante el recorrido..."></textarea>
        </div>
        <button type="submit" className="btn btn-primary fw-bold px-4">Guardar Ronda</button>
      </form>

      <h5 className="text-secondary fw-bold mb-3 fs-6">Rondas Registradas en el Turno</h5>
      <div className="table-responsive bg-white rounded-3 shadow-sm p-3">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Sector</th><th>Vigilante</th><th>Observaciones</th></tr>
          </thead>
          <tbody>
            {rondas.length === 0 ? <tr><td colSpan="6" className="text-center text-muted py-4">No hay rondas registradas.</td></tr> :
              rondas.map((r, i) => (
                <tr key={i}>
                  <td className="small text-muted">{r.fecha}</td>
                  <td><span className="badge bg-light text-dark border">{r.hora_inicio}</span></td>
                  <td><span className="badge bg-light text-dark border">{r.hora_fin}</span></td>
                  <td className="fw-semibold">{r.sector_recorrido}</td>
                  <td className="small">{r.nombre_vigilante}</td>
                  <td className="small text-muted">{r.observaciones || 'Sin observaciones'}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}