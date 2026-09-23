import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function RegistroNovedades() {
  const [novedades, setNovedades] = useState([])
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [editId, setEditId] = useState(null)

  const cargarNovedades = async () => {
    const { data } = await supabase.from('novedades').select('*').order('fecha', { ascending: false })
    if (data) setNovedades(data)
  }

  useEffect(() => { cargarNovedades() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('novedades').update({ titulo, descripcion, prioridad }).eq('id', editId)
      Swal.fire('Editado', 'Novedad modificada', 'success')
      setEditId(null)
    } else {
      await supabase.from('novedades').insert([{ titulo, descripcion, prioridad }])
      Swal.fire('Reportado', 'Novedad guardada', 'success')
    }
    setTitulo(''); setDescripcion(''); cargarNovedades()
  }

  const prepararEdicion = (item) => {
    setEditId(item.id)
    setTitulo(item.titulo)
    setDescripcion(item.descripcion)
    setPrioridad(item.prioridad)
  }

  return (
    <div className="p-3">
      <h3><i className="bi bi-exclamation-triangle me-2"></i>Novedades</h3>
      <form onSubmit={handleSubmit} className="row g-2 mb-4">
        <div className="col-md-4">
          <input className="form-control" placeholder="Título novedad" value={titulo} onChange={e => setTitulo(e.target.value)} required />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
            <option value="baja">Prioridad Baja</option>
            <option value="media">Prioridad Media</option>
            <option value="alta">Prioridad Alta</option>
          </select>
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)} required />
        </div>
        <div className="col-md-2">
          <button className={`btn w-100 ${editId ? 'btn-warning' : 'btn-danger'}`}>
            {editId ? 'Guardar' : 'Reportar'}
          </button>
        </div>
      </form>

      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Título</th>
            <th>Prioridad</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {novedades.map(n => (
            <tr key={n.id}>
              <td>{n.titulo}</td>
              <td><span className={`badge ${n.prioridad === 'alta' ? 'bg-danger' : 'bg-warning'}`}>{n.prioridad}</span></td>
              <td>{n.descripcion}</td>
              <td>
                <button className="btn btn-sm btn-outline-warning" onClick={() => prepararEdicion(n)}>
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