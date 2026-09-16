import React from 'react'

export default function Navbar({ scrollToSection, setMostrarModalRegistro, setMostrarModalLogin }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom px-4 py-3 sticky-top shadow-sm">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold text-dark fs-4" href="#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }}>
          🛡️ CENTRALGUARD
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-3">
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('inicio')}>
                INICIO
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('funciones')}>
                ¿PARA QUÉ FUNCIONA?
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-secondary" onClick={() => scrollToSection('contacto')}>
                CONTÁCTENOS
              </button>
            </li>
          </ul>

          <div className="d-flex gap-2">
            <button onClick={() => setMostrarModalRegistro(true)} className="btn btn-outline-dark px-3 fw-semibold rounded-pill">
              Registrarse
            </button>
            <button onClick={() => setMostrarModalLogin(true)} className="btn btn-dark px-3 fw-semibold rounded-pill">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}