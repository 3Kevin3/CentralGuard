import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function RegistroRecorrido({ usuario }) {
  const idUsuario = usuario?.idusuario
  const [rondas, setRondas] = useState([])
  const [sector, setSector] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [editId, setEditId] = useState(null)

  const cargarRondas = async () => {
    if (!idUsuario) return
    const { data } = await supabase.from('rondas').select('*')
      .eq('idusuario', idUsuario)
      .order('id', { ascending: false })
    setRondas(data || [])
  }

  useEffect(() => { cargarRondas() }, [idUsuario])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('rondas').update({ sector, observaciones })
        .eq('id', editId).eq('idusuario', idUsuario)
      Swal.fire({ icon: 'success', title: '¡Actualizado!', text: 'Ronda modificada con éxito', timer: 1500, showConfirmButton: false })
      setEditId(null)
    } else {
      await supabase.from('rondas').insert([{
        sector,
        observaciones,
        vigilante: usuario?.nombre || 'Vigilante',
        idusuario: idUsuario
      }])
      Swal.fire({ icon: 'success', title: '¡Registrado!', text: 'Nueva ronda añadida al sistema', timer: 1500, showConfirmButton: false })
    }
    setSector(''); setObservaciones(''); await cargarRondas()
  }

  const prepararEdicion = (item) => {
    setEditId(item.id)
    setSector(item.sector)
    setObservaciones(item.observaciones || '')
  }

  return (
    <div className="p-3 pt-4">
      <h3 className="mb-3"><i className="bi bi-journal-check me-2"></i>Registro de Recorrido</h3>

      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-body p-4 bg-white">
          <h6 className="fw-bold text-muted text-uppercase mb-3 small tracking-wide">
            <i className="bi bi-plus-circle-fill text-primary me-2"></i>
            {editId ? 'Modificar Registro de Ronda' : 'Nuevo Registro de Recorrido'}
          </h6>
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-5">
              <label className="form-label fw-semibold small text-secondary">Sector o Área Recorrida</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-geo-alt-fill"></i></span>
                <input className="form-control bg-light border-start-0 ps-0" placeholder="Ej: Torre 2 - Parqueaderos" value={sector} onChange={e => setSector(e.target.value)} required />
              </div>
            </div>
            <div className="col-md-5">
              <label className="form-label fw-semibold small text-secondary">Observaciones / Novedades</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-chat-left-text-fill"></i></span>
                <input className="form-control bg-light border-start-0 ps-0" placeholder="Ej: Sin novedades, iluminación en orden" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className={`btn w-100 py-2 fw-bold rounded-3 shadow-sm transition-all ${editId ? 'btn-warning text-dark' : 'btn-primary'}`}>
                <i className={`bi ${editId ? 'bi-save' : 'bi-send'} me-2`}></i>
                {editId ? 'Guardar' : 'Registrar'}
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
                <th className="py-3 ps-4">Fecha y Hora</th>
                <th className="py-3">Vigilante</th>
                <th className="py-3">Sector</th>
                <th className="py-3">Observaciones</th>
                <th className="py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="border-0">
              {rondas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-1 d-block mb-2 text-opacity-50"></i>
                    No hay registros de rondas almacenados.
                  </td>
                </tr>
              ) : (
                rondas.map(r => (
                  <tr key={r.id}>
                    <td className="ps-4 fw-medium text-dark">
                      <i className="bi bi-clock me-2 text-primary"></i>
                      {r.fecha_hora ? new Date(r.fecha_hora).toLocaleString() : 'Reciente'}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                          {(r.vigilante || 'V').charAt(0).toUpperCase()}
                        </div>
                        <span>{r.vigilante || 'Vigilante'}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border px-3 py-2 rounded-3 fw-semibold">{r.sector}</span></td>
                    <td className="text-secondary">{r.observaciones || '—'}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-outline-warning rounded-3 px-3 shadow-sm" onClick={() => prepararEdicion(r)}>
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
