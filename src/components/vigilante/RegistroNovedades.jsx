import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function RegistroNovedades() {
  const [tipo, setTipo] = useState('Seguridad')
  const [prioridad, setPrioridad] = useState('Media')
  const [descripcion, setDescripcion] = useState('')
  const [novedades, setNovedades] = useState([])

  useEffect(() => { cargarNovedades() }, [])

  const cargarNovedades = async () => {
    const { data } = await supabase.from('novedades').select('*')
    if (data) setNovedades(data)
  }

  const guardarNovedad = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('novedades').insert([{
      tipo_novedad: tipo,
      prioridad,
      descripcion,
      estado: 'Pendiente',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString()
    }])

    if (error) Swal.fire('Error', error.message, 'error')
    else {
      Swal.fire('¡Reportado!', 'Novedad registrada con éxito', 'success')
      setDescripcion('')
      cargarNovedades()
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-warning text-dark p-3 rounded-3 me-3 fs-4 shadow-sm">⚠️</div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Registro de Novedades</h4>
          <p className="text-muted small mb-0">Reporte de incidentes, emergencias o situaciones anómalas en el turno</p>
        </div>
      </div>

      <form onSubmit={guardarNovedad} className="card shadow-sm p-4 mb-4 bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Tipo de Novedad:</label>
            <select className="form-select bg-light" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="Seguridad">Seguridad</option>
              <option value="Accidente">Accidente</option>
              <option value="Daño en infraestructura">Daño en infraestructura</option>
              <option value="Queja de residente">Queja de residente</option>
              <option value="Emergencia médica">Emergencia médica</option>
              <option value="Vehículo sospechoso">Vehículo sospechoso</option>
              <option value="Ruido excesivo">Ruido excesivo</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Prioridad:</label>
            <select className="form-select bg-light" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Descripción detallada de los hechos:</label>
          <textarea className="form-control bg-light" rows="3" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Describe detalladamente qué ocurrió..." required></textarea>
        </div>
        <button type="submit" className="btn btn-warning fw-bold text-dark px-4">Reportar Novedad</button>
      </form>
    </div>
  )
}