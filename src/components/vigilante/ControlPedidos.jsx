import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

export default function ControlPedidos() {
  const [nombrePedido, setNombrePedido] = useState('')
  const [idPedido, setIdPedido] = useState('')
  const [destinatario, setDestinatario] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [pedidos, setPedidos] = useState([])

  useEffect(() => { cargarPedidos() }, [])

  const cargarPedidos = async () => {
    const { data } = await supabase.from('pedidos').select('*')
    if (data) setPedidos(data)
  }

  const registrarPedido = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('pedidos').insert([{
      nombre_pedido: nombrePedido,
      id_pedido: idPedido,
      destinatario,
      descripcion,
      hora_llegada: new Date().toLocaleTimeString(),
      estado: 'En custodia'
    }])

    if (error) Swal.fire('Error', error.message, 'error')
    else {
      Swal.fire('Registrado', 'Pedido ingresado correctamente', 'success')
      setNombrePedido(''); setIdPedido(''); setDestinatario(''); setDescripcion('')
      cargarPedidos()
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <div className="bg-info text-white p-3 rounded-3 me-3 fs-4 shadow-sm">🍔</div>
        <div>
          <h4 className="mb-0 fw-bold text-dark">Control de Pedidos y Deliveries</h4>
          <p className="text-muted small mb-0">Registro y custodia de entregas a domicilio en portería</p>
        </div>
      </div>

      <form onSubmit={registrarPedido} className="card shadow-sm p-4 mb-4 bg-white">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">Nombre del Pedido (Empresa/Tipo):</label>
            <input type="text" className="form-control bg-light" value={nombrePedido} onChange={e => setNombrePedido(e.target.value)} placeholder="Ej. Rappi / Amazon / Comida" required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label fw-semibold text-secondary small">ID / Número de Pedido:</label>
            <input type="text" className="form-control bg-light" value={idPedido} onChange={e => setIdPedido(e.target.value)} placeholder="Ej. #4829" required />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Nombre del Destinatario (Residente y Apto):</label>
          <input type="text" className="form-control bg-light" value={destinatario} onChange={e => setDestinatario(e.target.value)} placeholder="Ej. Juan Pérez - Apto 301" required />
        </div>
        <div className="mb-3">
          <label className="form-label fw-semibold text-secondary small">Descripción o Detalles:</label>
          <input type="text" className="form-control bg-light" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej. Caja mediana sellada / Bolsa térmica" />
        </div>
        <button type="submit" className="btn btn-info fw-bold text-white px-4">Registrar Llegada de Pedido</button>
      </form>
    </div>
  )
}