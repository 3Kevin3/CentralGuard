// =====================================================================
// LÓGICA DE CONTROL DINÁMICO DE LA INTERFAZ (SPA)
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Simular el Rol Actual obtenido en el Login (Cambia a 'Supervisor' o 'Vigilante' para probar)
    const sesionUsuario = {
        nombre: "Superv. Alejandro Gómez",
        rol: "Supervisor" 
    };

    // Inicializar Datos del Perfil en la Barra Lateral
    document.getElementById('user-display-name').textContent = sesionUsuario.nombre;
    const badgeRol = document.getElementById('role-badge');
    badgeRol.textContent = sesionUsuario.rol;

    // Cambiar colores estéticos del badge según el rol asignado
    if (sesionUsuario.rol === 'Supervisor') {
        badgeRol.style.backgroundColor = '#d97706'; // Color Ámbar
    } else if (sesionUsuario.rol === 'Vigilante') {
        badgeRol.style.backgroundColor = '#16a34a'; // Color Verde
    }

    // INTERCAMBIO DE VISTAS (PANELES)
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    const secciones = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Quitar clase activa a todos los elementos del menú
            menuItems.forEach(i => i.classList.remove('active'));
            // Ocultar todas las secciones operativas
            secciones.forEach(s => s.classList.remove('active-section'));

            // Activar la opción clickeada
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active-section');
        });
    });

    // RELOJ EN VIVO EN BOGOTÁ
    const actualizarReloj = () => {
        const ahora = new Date();
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaTexto = ahora.toLocaleDateString('es-ES', opcionesFecha);
        const horaTexto = ahora.toLocaleTimeString('es-ES');
        
        document.getElementById('live-clock').innerHTML = `<i class="fa-regular fa-clock"></i> ${fechaTexto} | ${horaTexto}`;
    };
    setInterval(actualizarReloj, 1000);
    actualizarReloj();

    // INTERCEPCIÓN SIMULADA DE FORMULARIOS (Para unir con tu Backend posteriormente)
    const formAcceso = document.getElementById('form-acceso');
    if (formAcceso) {
        formAcceso.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Capturar variables del formulario tal cual tus campos
            const datos = {
                documento: document.getElementById('doc-visitante').value,
                nombre: document.getElementById('nom-visitante').value,
                tipo: document.getElementById('tipo-ingreso').value,
                destino: document.getElementById('apto-destino').value,
                placa: document.getElementById('placa-vehiculo').value || 'A pie',
                observaciones: document.getElementById('obs-acceso').value
            };

            console.log("Enviando datos de registro al backend local...", datos);
            alert(`¡Ingreso de ${datos.nombre} registrado de forma exitosa localmente!`);
            formAcceso.reset();
        });
    }

    // CONTROL DE LOGOUT
    document.getElementById('btn-logout').addEventListener('click', () => {
        if(confirm('¿Desea cerrar sesión en el sistema perimetral?')) {
            alert('Sesión destruida de forma segura.');
            // Aquí puedes redirigir a tu vista login.html real
        }
    });
});