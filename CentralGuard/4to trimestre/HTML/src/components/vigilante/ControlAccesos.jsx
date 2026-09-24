import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ControlAccesos({ usuario }) {
  const idUsuario = usuario?.idusuario
  const [accesos, setAccesos] = useState([])
  const [nombre, setNombre] = useState('')
  const [destino, setDestino] = useState('')
  const [placa, setPlaca] = useState('')
  const [editId, setEditId] = useState(null)

  const cargarAccesos = async () => {
    if (!idUsuario) return
    const { data } = await supabase.from('accesos').select('*')
      .eq('idusuario', idUsuario)
      .order('id', { ascending: false })
    setAccesos(data || [])
  }

  useEffect(() => { cargarAccesos() }, [idUsuario])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('accesos').update({ nombre_visitante: nombre, destino, placa })
        .eq('id', editId).eq('idusuario', idUsuario)
      Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'Acceso modificado', timer: 1500, showConfirmButton: false })
      setEditId(null)
    } else {
      await supabase.from('accesos').insert([{ nombre_visitante: nombre, destino, placa, idusuario: idUsuario }])
      Swal.fire({ icon: 'success', title: '¡Ingreso Autorizado!', text: 'Visitante registrado en portería', timer: 1500, showConfirmButton: false })
    }
    setNombre(''); setDestino(''); setPlaca(''); await cargarAccesos()
  }

  const prepararEdicion = (item) => {
    setEditId(item.id)
    setNombre(item.nombre_visitante)
    setDestino(item.destino)
    setPlaca(item.placa || '')
  }

  return (
    <div className="p-4">
      <div className="d-flex align-items-center justify-content-between p-4 mb-4 rounded-4 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #198754 0%, #146c43 100%)' }}>
        <div className="d-flex align-items-center">
          <div className="bg-white bg-opacity-20 p-3 rounded-3 me-3 fs-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
            <i className="bi bi-car-front-fill"></i>
          </div>
          <div>
            <h3 className="fw-bold mb-0">Control de Accesos</h3>
            <small className="text-white-50">Registro peatonal, visitantes y vehículos</small>
          </div>
        </div>
        <span className="badge bg-white text-success px-3 py-2 rounded-pill fw-bold shadow-sm">
          <i className="bi bi-shield-check me-1"></i> Monitoreo de Entrada
        </span>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-body p-4 bg-white">
          <h6 className="fw-bold text-muted text-uppercase mb-3 small tracking-wide">
            <i className="bi bi-person-plus-fill text-success me-2"></i>
            {editId ? 'Editar Registro de Visitante' : 'Registrar Ingreso de Visitante / Vehículo'}
          </h6>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold small text-secondary">Nombre del Visitante</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-person-badge-fill"></i></span>
                <input className="form-control bg-light border-start-0 ps-0" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-secondary">Destino / Apto</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-house-door-fill"></i></span>
                <input className="form-control bg-light border-start-0 ps-0" placeholder="Ej: Apto 501" value={destino} onChange={e => setDestino(e.target.value)} required />
              </div>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold small text-secondary">Placa (Opcional)</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-card-heading"></i></span>
                <input className="form-control bg-light border-start-0 ps-0" placeholder="Ej: ABC-123" value={placa} onChange={e => setPlaca(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className={`btn w-100 py-2 fw-bold rounded-3 shadow-sm ${editId ? 'btn-warning text-dark' : 'btn-success'}`}>
                <i className={`bi ${editId ? 'bi-save' : 'bi-arrow-right-circle-fill'} me-2`}></i>
                {editId ? 'Guardar' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-secondary border-bottom">
              <tr className="small text-uppercase tracking-wider">
                <th className="py-3 ps-4">Hora de Ingreso</th>
                <th className="py-3">Visitante</th>
                <th className="py-3">Destino</th>
                <th className="py-3">Placa Vehículo</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {accesos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <i className="bi bi-shield-slash fs-1 d-block mb-2 text-opacity-50"></i>
                    No hay ingresos activos registrados.
                  </td>
                </tr>
              ) : (
                accesos.map(a => (
                  <tr key={a.id}>
                    <td className="ps-4 fw-medium text-dark">
                      <i className="bi bi-clock-history me-2 text-success"></i>
                      {a.fecha_ingreso ? new Date(a.fecha_ingreso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                    </td>
                    <td className="fw-bold text-dark">{a.nombre_visitante}</td>
                    <td><span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20 px-3 py-2 rounded-3">{a.destino}</span></td>
                    <td>{a.placa ? <span className="badge bg-dark px-3 py-2">{a.placa}</span> : <span className="text-muted small">Peatonal</span>}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-warning rounded-3 px-3 shadow-sm" onClick={() => prepararEdicion(a)}>
                        <i className="bi bi-pencil-square me-1"></i> Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
