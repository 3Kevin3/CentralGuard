import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ControlAccesos() {
  const [nombre, setNombre] = useState('')
  const [documento, setDocumento] = useState('')
  const [placa, setPlaca] = useState('')
  const [destino, setDestino] = useState('')
  const [tipoIngreso, setTipoIngreso] = useState('Residente')
  const [accesos, setAccesos] = useState([])

  useEffect(() => { cargarAccesos() }, [])

  const cargarAccesos = async () => {
    const { data } = await supabase.from('persona_acceso').select('*')
    if (data) setAccesos(data)
  }

  const registrar = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('persona_acceso').insert([{
      primer_nombre: nombre,
      numero_documento: documento,
      placa_vehiculo: placa,
      apartamento_visitado: destino,
      tipo_pasena: tipoIngreso,
      hora_entrada: new Date().toLocaleTimeString()
    }])

    if (error) Swal.fire('Error', error.message, 'error')
    else {
      Swal.fire('¡Registrado!', 'Acceso guardado con éxito', 'success')
      setNombre(''); setDocumento(''); setPlaca(''); setDestino('')
      cargarAccesos()
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-success text-white p-3 rounded-3 me-3 fs-4 shadow-sm">🚗</div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Control de Ingreso y Salida</h4>
          <p className="text-muted small mb-0">Gestión de accesos para residentes, visitantes y domiciliarios</p>
        </div>
      </div>

      <form onSubmit={registrar} className="card shadow-sm p-4 mb-4 bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Nombre de la Persona:</label>
            <input type="text" className="form-control bg-light" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Carlos Ruiz" required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Número de Identificación:</label>
            <input type="text" className="form-control bg-light" value={documento} onChange={e => setDocumento(e.target.value)} placeholder="Ej. 10928374" required />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold text-secondary small">Placa del Vehículo (Opcional):</label>
            <input type="text" className="form-control bg-light" value={placa} onChange={e => setPlaca(e.target.value)} placeholder="ABC-123" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold text-secondary small">Apartamento / Casa Visita:</label>
            <input type="text" className="form-control bg-light" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ej. Torre A - 502" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label fw-semibold text-secondary small">Tipo de Ingreso:</label>
            <select className="form-select bg-light" value={tipoIngreso} onChange={e => setTipoIngreso(e.target.value)}>
              <option value="Residente">Residente</option>
              <option value="Visitante">Visitante</option>
              <option value="Domiciliario">Domiciliario</option>
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-success fw-bold px-4">Registrar Entrada</button>
      </form>

      <h5 className="text-secondary fw-bold mb-3 fs-6">Accesos Recientes</h5>
      <ul className="list-group shadow-sm border-0">
        {accesos.length === 0 ? <li className="list-group-item text-muted text-py-4">No hay registros de acceso.</li> :
          accesos.map((a, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between align-items-center py-3 px-4 border-0 mb-2 bg-white rounded-3 shadow-sm">
              <div>
                <span className="fw-bold text-dark">{a.primer_nombre}</span>
                <span className="text-muted small ms-2">(Doc: {a.numero_documento})</span>
                <div className="text-muted small mt-1">Destino: <span className="text-dark fw-semibold">{a.apartamento_visitado || 'N/A'}</span></div>
              </div>
              <span className={`badge px-3 py-2 ${a.tipo_pasena === 'Residente' ? 'bg-success' : a.tipo_pasena === 'Visitante' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                {a.tipo_pasena}
              </span>
            </li>
          ))
        }
      </ul>
    </div>
  )
}