import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const normalizar = (v) => String(v || '').trim().toLowerCase()

const esChatSupAdmin = (m) => {
  const r = normalizar(m.remitente)
  const d = normalizar(m.destinatario)
  return (r === 'supervisor' && d === 'administrador') || (r === 'administrador' && d === 'supervisor')
}

const hora = (f) => {
  if (!f) return 'Reciente'
  try {
    return new Date(f).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch { return 'Reciente' }
}

export default function AdminChat() {
  const [mensajes, setMensajes] = useState([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase.from('mensajes_internos').select('*').order('fecha', { ascending: true })
    setMensajes((data || []).filter(esChatSupAdmin))
  }, [])

  useEffect(() => {
    cargar()
    const canal = supabase.channel('admin-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_internos' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [cargar])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])

  const enviar = async () => {
    const contenido = nuevoMensaje.trim()
    if (!contenido) return
    setEnviando(true)
    const { data, error } = await supabase.from('mensajes_internos')
      .insert([{ remitente: 'Administrador', destinatario: 'Supervisor', mensaje: contenido }])
      .select().single()
    setEnviando(false)
    if (error || !data) return Swal.fire('No se pudo enviar', error?.message || 'Error', 'error')
    setMensajes(prev => [...prev, data])
    setNuevoMensaje('')
  }

  const editar = async (id, textoActual) => {
    const { value } = await Swal.fire({
      title: 'Editar mensaje', input: 'textarea', inputValue: textoActual,
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar'
    })
    if (value && value.trim() !== textoActual) {
      const { error } = await supabase.from('mensajes_internos').update({ mensaje: value.trim() }).eq('id', id)
      if (error) return Swal.fire('Error', 'No se pudo editar el mensaje.', 'error')
      setMensajes(prev => prev.map(m => m.id === id ? { ...m, mensaje: value.trim() } : m))
    }
  }

  const eliminar = async (id) => {
    const r = await Swal.fire({
      title: '¿Eliminar mensaje?', text: 'Esta acción no se puede deshacer.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    })
    if (!r.isConfirmed) return
    const { error } = await supabase.from('mensajes_internos').delete().eq('id', id)
    if (error) return Swal.fire('Error', 'No se pudo eliminar el mensaje.', 'error')
    setMensajes(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          <div className="chat-avatar">S</div>
          <div>
            <strong className="d-block">Chat Interno</strong>
            <small className="text-light opacity-75">Administrador ↔ Supervisor</small>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {mensajes.length === 0 && <p className="text-muted text-center mb-0">Aún no hay mensajes.</p>}
        {mensajes.map(m => {
          const propio = normalizar(m.remitente) === 'administrador'
          const texto = m.mensaje || m.contenido
          return (
            <div key={m.id} className={`message-row ${propio ? 'message-own' : 'message-other'}`}>
              <div className="message-bubble">
                <p className="mb-1">{texto}</p>
                <div className="message-footer">
                  <span className="message-time">{hora(m.fecha)}</span>
                  {propio && (
                    <div className="chat-actions">
                      <button className="chat-btn-action" onClick={() => editar(m.id, texto)}>Editar</button>
                      <button className="chat-btn-action" onClick={() => eliminar(m.id)}>Eliminar</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={finRef} />
      </div>

      <div className="p-3 chat-input-bar d-flex gap-2">
        <input
          type="text" className="form-control" placeholder="Escribe un mensaje al Supervisor..."
          value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
        />
        <button className="btn btn-primary px-4" onClick={enviar} disabled={enviando}>Enviar</button>
      </div>
    </div>
  )
}
