import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ObjetosPerdidos() {
  const [objetos, setObjetos] = useState([])
  const [articulo, setArticulo] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [entregadoA, setEntregadoA] = useState('')
  const [estado, setEstado] = useState('en_custodia')
  const [editId, setEditId] = useState(null)

  const cargarObjetos = async () => {
    const { data } = await supabase.from('objetos_perdidos').select('*').order('fecha_registro', { ascending: false })
    if (data) setObjetos(data)
  }

  useEffect(() => { cargarObjetos() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('objetos_perdidos').update({ articulo, ubicacion_hallazgo: ubicacion, estado, entregado_a: entregadoA }).eq('id', editId)
      Swal.fire('Actualizado', 'Registro de objeto modificado', 'success')
      setEditId(null)
    } else {
      await supabase.from('objetos_perdidos').insert([{ articulo, ubicacion_hallazgo: ubicacion, estado, entregado_a: entregadoA }])
      Swal.fire('Registrado', 'Objeto en custodia reportado', 'success')
    }
    setArticulo(''); setUbicacion(''); setEntregadoA(''); setEstado('en_custodia'); cargarObjetos()
  }

  const prepararEdicion = (item) => {
    setEditId(item.id)
    setArticulo(item.articulo)
    setUbicacion(item.ubicacion_hallazgo || '')
    setEntregadoA(item.entregado_a || '')
    setEstado(item.estado)
  }

  return (
    <div className="p-3">
      <h3><i className="bi bi-box-seam me-2"></i>Objetos Perdidos</h3>
      <form onSubmit={handleSubmit} className="row g-2 mb-4">
        <div className="col-md-3">
          <input className="form-control" placeholder="Artículo / Objeto" value={articulo} onChange={e => setArticulo(e.target.value)} required />
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Lugar donde se halló" value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
        </div>
        <div className="col-md-2">
          <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="en_custodia">En custodia</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>
        <div className="col-md-2">
          <input className="form-control" placeholder="Entregado a (opcional)" value={entregadoA} onChange={e => setEntregadoA(e.target.value)} />
        </div>
        <div className="col-md-2">
          <button className={`btn w-100 ${editId ? 'btn-warning' : 'btn-info text-white'}`}>
            {editId ? 'Guardar' : 'Registrar'}
          </button>
        </div>
      </form>

      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Artículo</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Entregado a</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {objetos.map(o => (
            <tr key={o.id}>
              <td>{new Date(o.fecha_registro).toLocaleDateString()}</td>
              <td>{o.articulo}</td>
              <td>{o.ubicacion_hallazgo || 'N/A'}</td>
              <td><span className={`badge ${o.estado === 'entregado' ? 'bg-success' : 'bg-warning text-dark'}`}>{o.estado}</span></td>
              <td>{o.entregado_a || '—'}</td>
              <td>
                <button className="btn btn-sm btn-outline-warning" onClick={() => prepararEdicion(o)}>
                  <i className="bi bi-pencil-square"></i> Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}