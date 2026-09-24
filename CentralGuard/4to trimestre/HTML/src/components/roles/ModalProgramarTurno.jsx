import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../supabase/client'
import Swal from 'sweetalert2'

const limpiar = (s) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

const nombreCompleto = (v) => `${v.nombre || ''} ${v.apellido || ''}`.trim() || v.usuario || 'Sin nombre'

export default function ModalProgramarTurno({ vigilantes, puestos, asignadoPor = 'Supervisor', onCerrar, onGuardado }) {
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [puesto, setPuesto] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Coincide si lo escrito es el inicio del nombre o de cualquier palabra (nombre o apellido)
  const resultados = useMemo(() => {
    const q = limpiar(busqueda)
    const ordenados = [...vigilantes].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b)))
    if (!q) return ordenados
    return ordenados.filter(v => (' ' + limpiar(nombreCompleto(v))).includes(' ' + q))
  }, [busqueda, vigilantes])

  const elegir = (v) => {
    setSeleccionado(v)
    setBusqueda('')
    setAbierto(false)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!seleccionado) return Swal.fire('Falta el vigilante', 'Busca y selecciona un vigilante.', 'warning')

    setGuardando(true)
    const { error } = await supabase.from('turnos').insert([{
      idusuario: seleccionado.idusuario,
      vigilante: nombreCompleto(seleccionado),
      supervisor: asignadoPor,
      fecha,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      puesto,
      observaciones: observaciones.trim() || null
    }])
    setGuardando(false)

    if (error) return Swal.fire('Error', error.message, 'error')

    await Swal.fire('Turno asignado', `El turno fue enviado a ${nombreCompleto(seleccionado)}.`, 'success')
    onGuardado?.()
    onCerrar()
  }

  return createPortal(
    <div className="turno-overlay" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <style>{`
        .turno-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 1050; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .turno-modal { width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; background: #0f172a; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 24px; color: #e2e8f0; box-shadow: 0 20px 50px rgba(0,0,0,.5); }
        .turno-modal h4 { color: #f1f5f9; font-weight: 800; margin-bottom: 18px; text-align: center; }
        .turno-modal label { font-size: .78rem; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
        .turno-modal .form-control, .turno-modal .form-select { background: #1e293b; border: 1px solid rgba(255,255,255,.12); color: #e2e8f0; color-scheme: dark; }
        .turno-modal .form-control::placeholder { color: #64748b; }
        .turno-modal .form-control:focus, .turno-modal .form-select:focus { background: #1e293b; color: #fff; border-color: #38bdf8; box-shadow: 0 0 0 .2rem rgba(56,189,248,.2); }
        .turno-modal select option { background: #1e293b; color: #e2e8f0; }
        .turno-search { position: relative; }
        .turno-search .bi-search { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }
        .turno-search input { padding-left: 36px; }
        .turno-lista { position: absolute; left: 0; right: 0; top: calc(100% + 4px); background: #1e293b; border: 1px solid rgba(255,255,255,.12); border-radius: 10px; max-height: 220px; overflow-y: auto; z-index: 5; box-shadow: 0 10px 25px rgba(0,0,0,.4); }
        .turno-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer; }
        .turno-item:hover { background: rgba(56,189,248,.14); }
        .turno-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#38bdf8,#6366f1); color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .turno-vacio { padding: 12px; color: #94a3b8; font-size: .85rem; text-align: center; }
        .turno-chip { display: flex; align-items: center; gap: 10px; background: rgba(56,189,248,.12); border: 1px solid rgba(56,189,248,.35); border-radius: 10px; padding: 8px 12px; }
      `}</style>

      <form className="turno-modal" onSubmit={guardar}>
        <h4>Programar Turno</h4>

        <div className="mb-3">
          <label className="d-block">Vigilante</label>

          {seleccionado ? (
            <div className="turno-chip">
              <div className="turno-avatar">{nombreCompleto(seleccionado).charAt(0).toUpperCase()}</div>
              <div className="flex-grow-1">
                <strong className="d-block">{nombreCompleto(seleccionado)}</strong>
                <small className="text-secondary">{seleccionado.usuario}</small>
              </div>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setSeleccionado(null)}>Cambiar</button>
            </div>
          ) : (
            <div className="turno-search">
              <i className="bi bi-search"></i>
              <input
                className="form-control"
                placeholder="Buscar vigilante por nombre o apellido..."
                value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setAbierto(true) }}
                onFocus={() => setAbierto(true)}
                onBlur={() => setAbierto(false)}
                autoComplete="off"
              />
              {abierto && (
                <div className="turno-lista">
                  {resultados.length === 0 ? (
                    <div className="turno-vacio">
                      {vigilantes.length === 0 ? 'No hay vigilantes registrados.' : `Sin resultados para "${busqueda}".`}
                    </div>
                  ) : resultados.map(v => (
                    <div key={v.idusuario} className="turno-item" onMouseDown={(e) => { e.preventDefault(); elegir(v) }}>
                      <div className="turno-avatar">{nombreCompleto(v).charAt(0).toUpperCase()}</div>
                      <div>
                        <strong className="d-block">{nombreCompleto(v)}</strong>
                        <small className="text-secondary">{v.usuario}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-3">
          <label>Fecha</label>
          <input type="date" className="form-control" value={fecha} onChange={e => setFecha(e.target.value)} required />
        </div>

        <div className="row g-2 mb-3">
          <div className="col-6">
            <label>Hora de inicio</label>
            <input type="time" className="form-control" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} required />
          </div>
          <div className="col-6">
            <label>Hora de fin</label>
            <input type="time" className="form-control" value={horaFin} onChange={e => setHoraFin(e.target.value)} required />
          </div>
        </div>

        <div className="mb-3">
          <label>Puesto de trabajo</label>
          <select className="form-select" value={puesto} onChange={e => setPuesto(e.target.value)} required>
            <option value="">Selecciona un puesto</option>
            {puestos.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="mb-4">
          <label>Instrucciones (opcional)</label>
          <textarea className="form-control" rows="2" placeholder="Ej: Revisar cámaras del sótano cada hora" value={observaciones} onChange={e => setObservaciones(e.target.value)} />
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-secondary px-4" onClick={onCerrar}>Cancelar</button>
          <button className="btn btn-primary px-4" disabled={guardando}>{guardando ? 'Guardando...' : 'Asignar turno'}</button>
        </div>
      </form>
    </div>,
    document.body
  )
}
