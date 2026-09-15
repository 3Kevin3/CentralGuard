import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ObjetosPerdidos() {
  const [objeto, setObjeto] = useState('')
  const [lugar, setLugar] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('En custodia')
  const [objetos, setObjetos] = useState([])

  useEffect(() => { cargarObjetos() }, [])

  const cargarObjetos = async () => {
    const { data } = await supabase.from('objetos_perdidos').select('*')
    if (data) setObjetos(data)
  }

  const guardarObjeto = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('objetos_perdidos').insert([{
      objeto_encontrado: objeto,
      lugar_encontrado: lugar,
      descripcion,
      estado,
      fecha: new Date().toISOString().split('T')[0]
    }])

    if (error) Swal.fire('Error', error.message, 'error')
    else {
      Swal.fire('Registrado', 'Objeto guardado en el inventario', 'success')
      setObjeto(''); setLugar(''); setDescripcion('')
      cargarObjetos()
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-secondary text-white p-3 rounded-3 me-3 fs-4 shadow-sm">📦</div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Objetos Perdidos / Encontrados</h4>
          <p className="text-muted small mb-0">Inventario de pertenencias encontradas en zonas comunes</p>
        </div>
      </div>

      <form onSubmit={guardarObjeto} className="card shadow-sm p-4 mb-4 bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Objeto Encontrado:</label>
            <input type="text" className="form-control bg-light" value={objeto} onChange={e => setObjeto(e.target.value)} placeholder="Ej. Llaves, Billetera, Celular" required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Lugar donde fue encontrado:</label>
            <input type="text" className="form-control bg-light" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej. Gimnasio Torre B" required />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Descripción:</label>
          <textarea className="form-control bg-light" rows="2" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Color, marca, características particulares..."></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Estado:</label>
          <select className="form-select bg-light" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="En custodia">En custodia</option>
            <option value="Entregado a propietario">Entregado a propietario</option>
            <option value="Desechado/Donado">Desechado/Donado</option>
          </select>
        </div>
        <button type="submit" className="btn btn-secondary fw-bold px-4">Registrar Objeto</button>
      </form>
    </div>
  )
}