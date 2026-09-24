import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ControlPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [nombrePedido, setNombrePedido] = useState('')
  const [destinatario, setDestinatario] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [estado, setEstado] = useState('recibido')
  const [editId, setEditId] = useState(null)

  const cargarPedidos = async () => {
    const { data, error } = await supabase.from('pedidos').select('*').order('fecha_recepcion', { ascending: false })
    if (!error && data) setPedidos(data)
  }

  useEffect(() => { cargarPedidos() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        const { error } = await supabase.from('pedidos').update({
          nombre_pedido: nombrePedido,
          destinatario,
          descripcion,
          estado
        }).eq('id', editId)
        if (error) throw error
        Swal.fire('¡Actualizado!', 'El pedido fue modificado correctamente.', 'success')
        setEditId(null)
      } else {
        const { error } = await supabase.from('pedidos').insert([{
          nombre_pedido: nombrePedido,
          destinatario,
          descripcion,
          estado
        }])
        if (error) throw error
        Swal.fire('¡Registrado!', 'Pedido guardado en portería.', 'success')
      }
      setNombrePedido(''); setDestinatario(''); setDescripcion(''); setEstado('recibido')
      cargarPedidos()
    } catch (err) {
      Swal.fire('Error', err.message, 'error')
    }
  }

  const prepararEdicion = (item) => {
    setEditId(item.id)
    setNombrePedido(item.nombre_pedido || '')
    setDestinatario(item.destinatario || '')
    setDescripcion(item.descripcion || '')
    setEstado(item.estado || 'recibido')
  }

  return (
    <div className="p-3">
      <div className="d-flex align-items-center mb-3">
        <div className="bg-info bg-opacity-10 p-3 rounded-3 me-3 text-info fs-3">
          <i className="bi bi-bag-check-fill"></i>
        </div>
        <div>
          <h3 className="fw-bold mb-0">Control de Pedidos y Deliveries</h3>
          <small className="text-muted">Registro y custodia de entregas a domicilio en portería</small>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="row g-3 mb-4 p-3 bg-light rounded-3 border">
        <div className="col-md-4">
          <label className="form-label fw-semibold small">Nombre del Pedido (Empresa/Tipo):</label>
          <input className="form-control" value={nombrePedido} onChange={e => setNombrePedido(e.target.value)} placeholder="Ej: Rappi / Amazon" required />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold small">Nombre del Destinatario (Residente y Apto):</label>
          <input className="form-control" value={destinatario} onChange={e => setDestinatario(e.target.value)} placeholder="Ej: Juan Pérez - Apto 302" required />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold small">Estado del Pedido:</label>
          <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="recibido">Recibido en portería</option>
            <option value="entregado">Entregado a residente</option>
          </select>
        </div>
        <div className="col-md-10">
          <label className="form-label fw-semibold small">Descripción o Detalles:</label>
          <input className="form-control" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Caja mediana, comida rápida, etc." />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <button className={`btn w-100 fw-bold ${editId ? 'btn-warning' : 'btn-info text-white'}`}>
            {editId ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>

      <table className="table table-hover align-middle bg-white rounded-3 overflow-hidden shadow-sm">
        <thead className="table-light">
          <tr>
            <th>FECHA / HORA</th>
            <th>PEDIDO / EMPRESA</th>
            <th>DESTINATARIO</th>
            <th>DETALLES</th>
            <th>ESTADO</th>
            <th className="text-center">ACCIÓN</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-muted">No hay pedidos registrados en la base de datos.</td>
            </tr>
          ) : (
            pedidos.map(p => (
              <tr key={p.id}>
                <td>{new Date(p.fecha_recepcion).toLocaleString()}</td>
                <td><strong>{p.nombre_pedido}</strong></td>
                <td>{p.destinatario}</td>
                <td>{p.descripcion || '—'}</td>
                <td>
                  <span className={`badge ${p.estado === 'entregado' ? 'bg-success' : 'bg-primary'}`}>
                    {p.estado}
                  </span>
                </td>
                <td className="text-center">
                  <button className="btn btn-sm btn-outline-warning" onClick={() => prepararEdicion(p)}>
                    <i className="bi bi-pencil-square me-1"></i> Editar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}