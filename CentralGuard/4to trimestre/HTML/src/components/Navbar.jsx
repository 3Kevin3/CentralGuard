import React from 'react'
import logoCentral from '../assets/CentralGuard.png'

export default function Navbar({ scrollToSection, setMostrarModalRegistro, setMostrarModalLogin }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-4 py-3 sticky-top navbar-glass">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold text-white fs-4 d-flex align-items-center gap-2" href="#inicio" onClick={(e) => { e.preventDefault(); scrollToSection('inicio'); }}>
          <img src={logoCentral} alt="CentralGuard" style={{ height: '34px' }} />
          CentralGuard
        </a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-between" id="navbarNav">
          <ul className="navbar-nav mx-auto gap-3">
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-white-50 navbar-link-glow" onClick={() => scrollToSection('inicio')}>
                INICIO
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-white-50 navbar-link-glow" onClick={() => scrollToSection('funciones')}>
                ¿PARA QUÉ FUNCIONA?
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link bg-transparent border-0 fw-semibold text-white-50 navbar-link-glow" onClick={() => scrollToSection('contacto')}>
                CONTÁCTENOS
              </button>
            </li>
          </ul>

          <div className="d-flex gap-2">
            <button onClick={() => setMostrarModalRegistro(true)} className="btn btn-outline-light px-3 fw-semibold rounded-pill">
              Registrarse
            </button>
            <button onClick={() => setMostrarModalLogin(true)} className="btn btn-hero-primary px-3 fw-semibold rounded-pill">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
