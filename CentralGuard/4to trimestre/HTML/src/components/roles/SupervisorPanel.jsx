import React, { useEffect, useMemo, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'
import './SupervisorPanel.css'

const normalizar = (valor) => String(valor || '').trim().toLowerCase()

const obtenerHoraFormateada = (fechaStr) => {
  if (!fechaStr) return ''
  try {
    return new Date(fechaStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return ''
  }
}

// Solo mensajes entre Supervisor y Administrador
const esChatSupAdmin = (m) => {
  const r = normalizar(m.remitente)
  const d = normalizar(m.destinatario)
  return (r === 'supervisor' && d === 'administrador') || (r === 'administrador' && d === 'supervisor')
}

// Columna clave de la novedad (por si en tu tabla se llama id, idnovedades o idnovedad)
const pkDe = (n) => {
  if (n.id !== undefined) return ['id', n.id]
  if (n.idnovedades !== undefined) return ['idnovedades', n.idnovedades]
  return ['idnovedad', n.idnovedad]
}

const customTableStyles = {
  headRow: { style: { backgroundColor: 'rgba(255,255,255,0.03)', borderTopStyle: 'solid', borderTopWidth: '1px', borderTopColor: 'rgba(255,255,255,0.08)' } },
  headCells: { style: { color: '#94a3b8', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' } },
  cells: { style: { fontSize: '0.875rem', color: '#e2e8f0' } },
  rows: {
    style: {
      minHeight: '60px', backgroundColor: 'transparent', color: '#e2e8f0',
      '&:not(:last-child)': { borderBottomStyle: 'solid', borderBottomWidth: '1px', borderBottomColor: 'rgba(255,255,255,0.06)' },
    },
    highlightOnHoverStyle: { backgroundColor: 'rgba(56, 189, 248, 0.10)', color: '#ffffff', transitionDuration: '0.15s', transitionProperty: 'background-color, color', outlineStyle: 'none' },
  },
  table: { style: { backgroundColor: 'transparent' } },
   noData: {
    style: {
      backgroundColor: 'transparent',
      color: '#94a3b8',
      padding: '24px',
    },
  },
  progress: {
    style: {
      backgroundColor: 'transparent',
      color: '#94a3b8',
    },
  },
  pagination: { style: { color: '#94a3b8', backgroundColor: 'transparent' } },
}

const paginationOptions = {
  rowsPerPageText: 'Filas por página:',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos'
}

export default function SupervisorPanel({ seccionActiva }) {
  const [novedades, setNovedades] = useState([])
  const [rondas, setRondas] = useState([])
  const [asistencias, setAsistencias] = useState([])
  const [mensajes, setMensajes] = useState([])

  const [filtroVigilante, setFiltroVigilante] = useState('Todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const [tipoNovedad, setTipoNovedad] = useState('')
  const [prioridad, setPrioridad] = useState('Baja')
  const [descripcionNovedad, setDescripcionNovedad] = useState('')
  const [vigilanteAsignado, setVigilanteAsignado] = useState('Supervisor Directo')
  const [registrandoNovedad, setRegistrandoNovedad] = useState(false)

  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)

  const cargarNovedades = useCallback(async () => {
    const { data } = await supabase.from('novedades').select('*')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
    setNovedades(data || [])
  }, [])

  const cargarMensajes = useCallback(async () => {
    const { data } = await supabase.from('mensajes_internos').select('*').order('fecha', { ascending: true })
    setMensajes((data || []).filter(esChatSupAdmin))
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [r, a] = await Promise.all([
        supabase.from('ronda').select('*'),
        supabase.from('asistencias').select('*'),
        cargarNovedades(),
        cargarMensajes()
      ])
      setRondas(r.data || [])
      setAsistencias(a.data || [])
    } catch {
      Swal.fire('Error de conexión', 'No se pudieron obtener los datos.', 'error')
    } finally {
      setCargando(false)
    }
  }, [cargarNovedades, cargarMensajes])

  useEffect(() => { cargar() }, [cargar])

  // Tiempo real: novedades de vigilantes y mensajes del admin aparecen solos
  useEffect(() => {
    const canal = supabase.channel('supervisor-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'novedades' }, () => cargarNovedades())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes_internos' }, () => cargarMensajes())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [cargarNovedades, cargarMensajes])

  const rondasRealizadas = useMemo(() => rondas.filter(r => ['completada', 'realizada'].includes(normalizar(r.estado))).length, [rondas])
  const rondasPendientes = useMemo(() => rondas.filter(r => ['pendiente', 'asignada'].includes(normalizar(r.estado))).length, [rondas])
  const llegadasTarde = useMemo(() => asistencias.filter(a => normalizar(a.estado) === 'tarde').length, [asistencias])
  const ausencias = useMemo(() => asistencias.filter(a => normalizar(a.estado) === 'ausente').length, [asistencias])
  const totalNovedades = novedades.length

  const listaVigilantesNovedades = useMemo(() => {
    const nombres = novedades.map(n => n.vigilante || n.nombre_vigilante).filter(Boolean)
    return Array.from(new Set(nombres))
  }, [novedades])

  const novedadesFiltradas = useMemo(() => {
    return novedades.filter(n => {
      const vNombre = n.vigilante || n.nombre_vigilante || ''
      const vigilanteOk = filtroVigilante === 'Todos' || normalizar(vNombre) === normalizar(filtroVigilante)
      const fechaOk = !filtroFecha || String(n.fecha || '').slice(0, 10) === filtroFecha
      const estadoOk = filtroEstado === 'Todos' || normalizar(n.estado || 'Pendiente') === normalizar(filtroEstado)
      return vigilanteOk && fechaOk && estadoOk
    })
  }, [novedades, filtroVigilante, filtroFecha, filtroEstado])

  const agregarNovedadSupervisor = async (e) => {
    e.preventDefault()
    if (!tipoNovedad.trim() || !descripcionNovedad.trim()) {
      return Swal.fire('Campos incompletos', 'Por favor llena el tipo y la descripción.', 'warning')
    }

    setRegistrandoNovedad(true)
    const ahora = new Date()
    const { data, error } = await supabase.from('novedades').insert([{
      titulo: tipoNovedad,
      tipo_novedad: tipoNovedad,
      prioridad,
      descripcion: descripcionNovedad,
      vigilante: vigilanteAsignado,
      estado: 'Pendiente',
      fecha: ahora.toLocaleDateString('en-CA'),
      hora: ahora.toTimeString().slice(0, 8)
    }]).select().single()
    setRegistrandoNovedad(false)

    if (error) return Swal.fire('Error', 'No se pudo registrar la novedad: ' + error.message, 'error')

    setNovedades(prev => [data, ...prev.filter(n => pkDe(n)[1] !== pkDe(data)[1])])
    setTipoNovedad(''); setPrioridad('Baja'); setDescripcionNovedad('')
    Swal.fire('Registrada', 'Novedad agregada exitosamente.', 'success')
  }

  const cambiarEstadoNovedad = async (novedad, nuevoEstado) => {
    const [col, val] = pkDe(novedad)
    const { error } = await supabase.from('novedades').update({ estado: nuevoEstado }).eq(col, val)
    if (error) return Swal.fire('Error', 'No se pudo actualizar el estado: ' + error.message, 'error')
    setNovedades(prev => prev.map(n => pkDe(n)[1] === val ? { ...n, estado: nuevoEstado } : n))
  }

  const eliminarNovedad = async (novedad) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar novedad?', text: 'Esta acción borrará la novedad permanentemente.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    })
    if (!confirm.isConfirmed) return

    const [col, val] = pkDe(novedad)
    const { error } = await supabase.from('novedades').delete().eq(col, val)
    if (error) return Swal.fire('Error', 'No se pudo eliminar la novedad: ' + error.message, 'error')
    setNovedades(prev => prev.filter(n => pkDe(n)[1] !== val))
  }

  const columnasNovedades = useMemo(() => [
    {
      name: 'Fecha / Hora',
      selector: row => `${row.fecha || ''} ${row.hora || ''}`,
      sortable: true,
      grow: 1,
      cell: row => (
        <div>
          <div className="fw-semibold">{String(row.fecha || '—').slice(0, 10)}</div>
          <small className="text-muted">{row.hora || ''}</small>
        </div>
      )
    },
    { name: 'Vigilante / Emisor', selector: row => row.vigilante || row.nombre_vigilante || 'Supervisor', sortable: true, grow: 1.2 },
    { name: 'Tipo Novedad', selector: row => row.tipo_novedad || row.titulo || '—', sortable: true, grow: 1 },
    { name: 'Prioridad', selector: row => row.prioridad || '—', sortable: true, grow: 0.7 },
    { name: 'Descripción', selector: row => row.descripcion || '—', grow: 2, wrap: true },
    {
      name: 'Estado',
      selector: row => row.estado || 'Pendiente',
      sortable: true,
      grow: 1.2,
      cell: row => (
        <select
          className="form-select form-select-sm"
          value={row.estado || 'Pendiente'}
          onChange={(e) => cambiarEstadoNovedad(row, e.target.value)}
        >
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Resuelta">Resuelta</option>
        </select>
      )
    },
    {
      name: 'Acciones',
      grow: 0.8,
      cell: row => (
        <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarNovedad(row)} title="Eliminar novedad">🗑️</button>
      )
    }
  ], [])

  const enviarMensaje = async () => {
    const contenido = nuevoMensaje.trim()
    if (!contenido) return

    setEnviandoMensaje(true)
    const { data, error } = await supabase.from('mensajes_internos')
      .insert([{ remitente: 'Supervisor', destinatario: 'Administrador', mensaje: contenido }])
      .select().single()
    setEnviandoMensaje(false)

    if (error || !data) return Swal.fire('No se pudo enviar', error?.message || 'Error', 'error')
    setMensajes(prev => [...prev, data])
    setNuevoMensaje('')
  }

  const editarMensaje = async (id, textoActual) => {
    const { value: nuevoTexto } = await Swal.fire({
      title: 'Editar mensaje', input: 'textarea', inputValue: textoActual,
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar'
    })
    if (nuevoTexto && nuevoTexto.trim() !== textoActual) {
      const { error } = await supabase.from('mensajes_internos').update({ mensaje: nuevoTexto.trim() }).eq('id', id)
      if (error) return Swal.fire('Error', 'No se pudo editar el mensaje.', 'error')
      setMensajes(prev => prev.map(m => m.id === id ? { ...m, mensaje: nuevoTexto.trim() } : m))
    }
  }

  const eliminarMensaje = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar mensaje?', text: 'Esta acción no se puede deshacer.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    const { error } = await supabase.from('mensajes_internos').delete().eq('id', id)
    if (error) return Swal.fire('Error', 'No se pudo eliminar el mensaje.', 'error')
    setMensajes(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="supervisor-content">
      <style>{`
        .supervisor-content { flex: 1; min-width: 0; padding: 0 32px 40px; }
        .supervisor-page-title { padding: 26px 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .supervisor-page-title h1 { margin: 4px 0 5px; }
        @media (max-width: 900px) { .supervisor-content { padding: 0 16px 30px; } }
        @media (max-width: 520px) { .supervisor-page-title { align-items: flex-start; flex-direction: column; } }
      `}</style>

      <div className="supervisor-page-title">
        <div>
          <span className="eyebrow"> </span>
          <h1>
            {seccionActiva === 'resumen' && 'Resumen operativo'}
            {seccionActiva === 'novedades' && 'Gestión de novedades'}
            {seccionActiva === 'registro' && 'Registrar nueva novedad'}
            {seccionActiva === 'chat' && 'Chat interno'}
          </h1>
          <p className="text-muted mb-0">
            {seccionActiva === 'resumen' && 'Vista general del estado operativo.'}
            {seccionActiva === 'novedades' && 'Novedades reportadas por los vigilantes, en tiempo real.'}
            {seccionActiva === 'registro' && 'Registra directamente un nuevo evento operativo.'}
            {seccionActiva === 'chat' && 'Comunicación directa entre Supervisor y Administrador.'}
          </p>
        </div>

        <button className="btn btn-dark rounded-pill px-4" onClick={cargar} disabled={cargando}>
          {cargando ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      {seccionActiva === 'resumen' && (
        <section className="panel-section">
          <div className="panel-card">
            <span className="eyebrow">RESUMEN</span>
            <h3 className="h5 mb-3">Estado operativo actual</h3>
            <div className="stats-grid">
              <StatCard color="success" icon="✓" title="Rondas Realizadas" value={rondasRealizadas} />
              <StatCard color="warning" icon="◷" title="Rondas Pendientes" value={rondasPendientes} />
              <StatCard color="danger" icon="⏱" title="Llegadas Tarde" value={llegadasTarde} />
              <StatCard color="danger" icon="✖" title="Ausencias" value={ausencias} />
              <StatCard color="primary" icon="🗒" title="Novedades Registradas" value={totalNovedades} />
            </div>
          </div>
        </section>
      )}

      {seccionActiva === 'registro' && (
        <section className="panel-section">
          <div className="panel-card">
            <span className="eyebrow">REGISTRO DIRECTO</span>
            <h3 className="h5 mb-3">Añadir Nueva Novedad</h3>

            <form onSubmit={agregarNovedadSupervisor}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Tipo de Novedad</label>
                  <input type="text" className="form-control" placeholder="Ej: Falla de cámara, Portón averiado..." value={tipoNovedad} onChange={e => setTipoNovedad(e.target.value)} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Prioridad</label>
                  <select className="form-select" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Vigilante / Asignado</label>
                  <input type="text" className="form-control" placeholder="Nombre del vigilante o 'Supervisor'" value={vigilanteAsignado} onChange={e => setVigilanteAsignado(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Descripción del Evento</label>
                  <textarea className="form-control" rows="4" placeholder="Detalles sobre lo ocurrido..." value={descripcionNovedad} onChange={e => setDescripcionNovedad(e.target.value)} required></textarea>
                </div>
                <div className="col-12 text-end">
                  <button type="submit" className="btn btn-primary px-4" disabled={registrandoNovedad}>
                    {registrandoNovedad ? 'Guardando...' : 'Añadir Novedad'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      )}

      {seccionActiva === 'novedades' && (
        <section className="panel-section">
          <div className="panel-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <span className="eyebrow"> GESTIÓN DE NOVEDADES</span>
                <h3 className="h5 mb-0">Consultar y Gestionar Novedades</h3>
              </div>
            </div>

            <div className="filters-bar mb-3">
              <div>
                <label>Filtrar por Vigilante</label>
                <select className="form-select form-select-sm" value={filtroVigilante} onChange={e => setFiltroVigilante(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {listaVigilantesNovedades.map((v, idx) => <option key={idx} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Filtrar por Fecha</label>
                <input type="date" className="form-control form-control-sm" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
              </div>
              <div>
                <label>Filtrar por Estado</label>
                <select className="form-select form-select-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                  <option value="Todos">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En proceso">En proceso</option>
                  <option value="Resuelta">Resuelta</option>
                </select>
              </div>
              <button className="btn btn-outline-secondary btn-sm align-self-end" onClick={() => { setFiltroVigilante('Todos'); setFiltroFecha(''); setFiltroEstado('Todos') }}>
                Limpiar filtros
              </button>
            </div>

            <DataTable
              columns={columnasNovedades}
              data={novedadesFiltradas}
              customStyles={customTableStyles}
              progressPending={cargando}
              pagination
              paginationComponentOptions={paginationOptions}
              highlightOnHover
              responsive
              noDataComponent={<div className="p-4 text-center text-muted">No se encontraron novedades.</div>}
            />
          </div>
        </section>
      )}

      {seccionActiva === 'chat' && (
        <section className="panel-section">
          <div className="chat-card">
            <div className="chat-header">
              <div className="d-flex align-items-center gap-2">
                <div className="chat-avatar">A</div>
                <div>
                  <strong className="d-block"> Chat Interno</strong>
                  <small className="text-light opacity-75">Supervisor ↔ Administrador</small>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {mensajes.length === 0 && <p className="text-muted text-center mb-0">Aún no hay mensajes.</p>}
              {mensajes.map((m) => {
                const esPropio = normalizar(m.remitente) === 'supervisor'
                const texto = m.mensaje || m.contenido
                return (
                  <div key={m.id} className={`message-row ${esPropio ? 'message-own' : 'message-other'}`}>
                    <div className="message-bubble">
                      <p className="mb-1">{texto}</p>
                      <div className="message-footer">
                        <span className="message-time">{obtenerHoraFormateada(m.fecha) || 'Reciente'}</span>
                        {esPropio && (
                          <div className="chat-actions">
                            <button className="chat-btn-action" onClick={() => editarMensaje(m.id, texto)}>Editar</button>
                            <button className="chat-btn-action" onClick={() => eliminarMensaje(m.id)}>Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 chat-input-bar d-flex gap-2">
              <input
                type="text" className="form-control" placeholder="Escribe un mensaje al Administrador..."
                value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
              />
              <button className="btn btn-primary px-4" onClick={enviarMensaje} disabled={enviandoMensaje}>Enviar</button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-${color}`}>{icon}</div>
      <div>
        <small className="text-muted d-block">{title}</small>
        <span className="h4 fw-bold mb-0">{value}</span>
      </div>
    </div>
  )
}
