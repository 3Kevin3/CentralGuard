import { useEffect, useMemo, useState, useCallback } from 'react'
import DataTable from 'react-data-table-component'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'
import './VigilantePanel.css'

const normalizar = (valor) => String(valor || '').trim().toLowerCase()

const formatFechaMensaje = (fecha) => {
  if (!fecha) return ''
  try {
    return new Date(fecha).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  } catch {
    return fecha
  }
}

const customTableStyles = {
  headRow: {
    style: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
  },
  headCells: {
    style: {
      color: '#94a3b8',
      fontSize: '0.8rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
  },
  cells: {
    style: {
      fontSize: '0.875rem',
      color: '#e2e8f0',
    },
  },
  rows: {
    style: {
      minHeight: '60px',
      backgroundColor: 'transparent',
      color: '#e2e8f0',
      '&:not(:last-child)': {
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderBottomColor: 'rgba(255,255,255,0.06)',
      },
    },
    highlightOnHoverStyle: {
      backgroundColor: 'rgba(56, 189, 248, 0.10)',
      color: '#ffffff',
      transitionDuration: '0.15s',
      transitionProperty: 'background-color, color',
      outlineStyle: 'none',
    },
  },
  table: {
    style: { backgroundColor: 'transparent' },
  },
  pagination: {
    style: {
      color: '#94a3b8',
      backgroundColor: 'transparent',
    },
  },
}

const paginationOptions = {
  rowsPerPageText: 'Filas por página:',
  rangeSeparatorText: 'de',
  selectAllRowsItem: true,
  selectAllRowsItemText: 'Todos'
}

export default function VigilantePanel() {
  const [novedades, setNovedades] = useState([])
  const [rondas, setRondas] = useState([])
  const [mensajes, setMensajes] = useState([])

  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('Todas')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroFecha, setFiltroFecha] = useState('')

  const [tipoNovedad, setTipoNovedad] = useState('')
  const [prioridad, setPrioridad] = useState('Baja')
  const [descripcion, setDescripcion] = useState('')
  const [registrandoNovedad, setRegistrandoNovedad] = useState(false)

  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [n, r, m] = await Promise.all([
        supabase
          .from('novedades')
          .select('*')
          .order('fecha', { ascending: false })
          .order('hora', { ascending: false }),

        supabase
          .from('ronda')
          .select('*')
          .order('idronda', { ascending: false }),

        supabase
          .from('mensajes_internos')
          .select('*')
          .order('created_at', { ascending: true })
      ])

      setNovedades(n.data || [])
      setRondas(r.data || [])
      setMensajes(m.data || [])
    } catch (err) {
      Swal.fire('Error de conexión', 'No se pudieron obtener los datos.', 'error')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const misNovedadesContador = novedades.length
  const rondasCompletadas = rondas.length
  const pendientes = useMemo(() => novedades.filter(n => normalizar(n.estado) === 'pendiente').length, [novedades])
  const resueltas = useMemo(() => novedades.filter(n => normalizar(n.estado) === 'resuelta').length, [novedades])

  const visibles = useMemo(() => {
    return novedades.filter(n => {
      const prioridadOk = filtroPrioridad === 'Todas' || normalizar(n.prioridad) === normalizar(filtroPrioridad)
      const estadoOk = filtroEstado === 'Todos' || normalizar(n.estado) === normalizar(filtroEstado)
      const fechaOk = !filtroFecha || String(n.fecha || '').slice(0, 10) === filtroFecha

      const textoOk = !filtroTexto ||
        normalizar(n.descripcion).includes(normalizar(filtroTexto)) ||
        normalizar(n.tipo_novedad).includes(normalizar(filtroTexto))

      return prioridadOk && estadoOk && fechaOk && textoOk
    })
  }, [novedades, filtroPrioridad, filtroEstado, filtroFecha, filtroTexto])

  const registrarNovedad = async (e) => {
    e.preventDefault()
    if (!tipoNovedad.trim() || !descripcion.trim()) {
      return Swal.fire('Campos incompletos', 'Por favor llena el tipo y la descripción.', 'warning')
    }

    setRegistrandoNovedad(true)
    const hoy = new Date()
    const fecha = hoy.toISOString().split('T')[0]
    const hora = hoy.toTimeString().split(' ')[0]

    const nuevaNovedad = {
      tipo_novedad: tipoNovedad,
      prioridad,
      descripcion,
      estado: 'Pendiente',
      fecha,
      hora
    }

    const { data, error } = await supabase
      .from('novedades')
      .insert([nuevaNovedad])
      .select()
      .single()

    setRegistrandoNovedad(false)

    if (error) {
      return Swal.fire('Error', 'No se pudo guardar la novedad: ' + error.message, 'error')
    }

    setNovedades(prev => [data, ...prev])
    setTipoNovedad('')
    setPrioridad('Baja')
    setDescripcion('')
    Swal.fire('Registrada', 'La novedad fue enviada al supervisor.', 'success')
  }

  const columnasNovedades = useMemo(() => [
    {
      name: 'Fecha / Hora',
      selector: row => `${row.fecha || ''} ${row.hora || ''}`,
      sortable: true,
      grow: 1,
      cell: row => (
        <div>
          <div className="fw-semibold">{row.fecha || '—'}</div>
          <small className="text-muted">{row.hora || ''}</small>
        </div>
      )
    },
    {
      name: 'Tipo Novedad',
      selector: row => row.tipo_novedad || '—',
      sortable: true,
      grow: 1
    },
    {
      name: 'Prioridad',
      selector: row => row.prioridad || '',
      sortable: true,
      grow: 0.8,
      cell: row => (
        <span className={`badge rounded-pill priority-${normalizar(row.prioridad)}`}>
          {row.prioridad || 'Sin prioridad'}
        </span>
      )
    },
    {
      name: 'Descripción',
      selector: row => row.descripcion || '—',
      grow: 2,
      wrap: true
    },
    {
      name: 'Estado',
      selector: row => row.estado || 'Pendiente',
      sortable: true,
      grow: 1,
      cell: row => <EstadoNovedad estado={row.estado} />
    }
  ], [])

  const enviarMensaje = async () => {
    const contenido = nuevoMensaje.trim()
    if (!contenido) return

    setEnviandoMensaje(true)
    const { data, error } = await supabase
      .from('mensajes_internos')
      .insert([{ remitente: 'Vigilante', destinatario: 'Supervisor', mensaje: contenido }])
      .select().single()

    setEnviandoMensaje(false)

    if (error || !data) return Swal.fire('No se pudo enviar', error?.message || 'Error', 'error')

    setMensajes(prev => [...prev, data])
    setNuevoMensaje('')
  }

  return (
    <div className="role-panel">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">CONTROL DE TURNO</span>
          <h1>Panel de Vigilante</h1>
          <p className="text-muted mb-0">Reporte de novedades, registro de eventos y comunicación.</p>
        </div>

        <button className="btn btn-dark rounded-pill px-4" onClick={cargar} disabled={cargando}>
          {cargando ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      <section className="panel-section">
        <div className="stats-grid">
          <StatCard color="primary" icon="📝" title="Novedades Registradas" value={misNovedadesContador} />
          <StatCard color="success" icon="🛡️" title="Rondas Efectuadas" value={rondasCompletadas} />
          <StatCard color="warning" icon="◷" title="Pendientes" value={pendientes} />
          <StatCard color="success" icon="✓" title="Resueltas" value={resueltas} />
        </div>
      </section>

      <section className="panel-section mt-4">
        <div className="panel-card">
          <span className="eyebrow">NUEVO REPORTE</span>
          <h3 className="h5 mb-3">Registrar Novedad</h3>

          <form onSubmit={registrarNovedad}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Tipo de Novedad</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Luces encendidas, Puerta abierta..."
                  value={tipoNovedad}
                  onChange={e => setTipoNovedad(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Prioridad</label>
                <select
                  className="form-select"
                  value={prioridad}
                  onChange={e => setPrioridad(e.target.value)}
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Descripción del Suceso</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Detalla los hechos sucedidos..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="col-12 text-end">
                <button type="submit" className="btn btn-primary px-4" disabled={registrandoNovedad}>
                  {registrandoNovedad ? 'Guardando...' : 'Guardar Novedad'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="panel-section mt-4">
        <div className="panel-card">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="eyebrow">HISTORIAL</span>
              <h3 className="h5 mb-0">Mis Novedades Reportadas</h3>
            </div>
          </div>

          <div className="filters-bar mb-3">
            <div>
              <label>Buscar</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Texto..."
                value={filtroTexto}
                onChange={e => setFiltroTexto(e.target.value)}
              />
            </div>

            <div>
              <label>Fecha</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={filtroFecha}
                onChange={e => setFiltroFecha(e.target.value)}
              />
            </div>

            <div>
              <label>Prioridad</label>
              <select className="form-select form-select-sm" value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
                <option>Todas</option>
                <option>Baja</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>

            <div>
              <label>Estado</label>
              <select className="form-select form-select-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option>Todos</option>
                <option>Pendiente</option>
                <option>En proceso</option>
                <option>Resuelta</option>
              </select>
            </div>

            <button className="btn btn-outline-secondary btn-sm align-self-end" onClick={() => {
              setFiltroTexto('')
              setFiltroFecha('')
              setFiltroPrioridad('Todas')
              setFiltroEstado('Todos')
            }}>Limpiar</button>
          </div>

          <DataTable
            columns={columnasNovedades}
            data={visibles}
            customStyles={customTableStyles}
            progressPending={cargando}
            pagination
            paginationComponentOptions={paginationOptions}
            highlightOnHover
            responsive
            noDataComponent={<div className="p-4 text-center text-muted">No has registrado novedades.</div>}
          />
        </div>
      </section>

      <section className="panel-section mt-4">
        <div className="chat-card">
          <div className="chat-header">
            <div className="d-flex align-items-center gap-2">
              <div className="chat-avatar">S</div>
              <div>
                <strong className="d-block">Supervisor</strong>
                <small className="text-light opacity-75">Chat Operativo</small>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {mensajes.map((m, i) => (
              <div key={i} className={`message-row ${normalizar(m.remitente) === 'vigilante' ? 'message-own' : 'message-other'}`}>
                <div className="message-bubble">
                  <p className="mb-1">{m.mensaje || m.contenido}</p>
                  <small className="opacity-75">{formatFechaMensaje(m.created_at)}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 chat-input-bar d-flex gap-2">
            <input
              type="text"
              className="form-control"
              placeholder="Escribe un mensaje al Supervisor..."
              value={nuevoMensaje}
              onChange={e => setNuevoMensaje(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
            />
            <button className="btn btn-primary px-4" onClick={enviarMensaje} disabled={enviandoMensaje}>
              Enviar
            </button>
          </div>
        </div>
      </section>
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

function EstadoNovedad({ estado }) {
  const valor = estado || 'Pendiente'
  let clase = 'status-pending'
  if (normalizar(valor) === 'en proceso') clase = 'status-process'
  if (normalizar(valor) === 'resuelta') clase = 'status-resolved'
  return <span className={`badge rounded-pill ${clase}`}>{valor}</span>
}