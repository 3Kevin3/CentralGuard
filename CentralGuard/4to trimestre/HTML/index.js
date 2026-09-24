document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');
  const formOlvido = document.getElementById('formOlvido');
  const modalOlvidoElement = document.getElementById('modalOlvido');
  const modalOlvido = new bootstrap.Modal(modalOlvidoElement);


  if (!localStorage.getItem('usuarios_sistema')) {
    const usuariosIniciales = [
      { usuario: 'admin', correo: 'admin@empresa.com', pass: '123456', rol: 'administrador.html' },
      { usuario: 'supervisor', correo: 'supervisor@empresa.com', pass: '123456', rol: 'supervisor.html' },
      { usuario: 'vigilante', correo: 'vigilante@empresa.com', pass: '123456', rol: 'vigilante.html' }
    ];
    localStorage.setItem('usuarios_sistema', JSON.stringify(usuariosIniciales));
  }

  function obtenerUsuarios() {
    return JSON.parse(localStorage.getItem('usuarios_sistema')) || [];
  }

  // registro de usuario
  formRegister.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const rol = document.getElementById('regRol').value;

    const listaUsuarios = obtenerUsuarios();
    const existe = listaUsuarios.some(u => u.usuario.toLowerCase() === username.toLowerCase() || u.correo === email);

    if (existe) {
      alert('El nombre de usuario o correo ya se encuentra registrado.');
      return;
    }

    const nuevoUsuario = { usuario: username, correo: email, pass: password, rol: rol };
    listaUsuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios_sistema', JSON.stringify(listaUsuarios));

    alert('Registro completado con éxito. Ya puedes iniciar sesión.');
    
    formRegister.reset();
    const tabLogin = new bootstrap.Tab(document.getElementById('tab-login'));
    tabLogin.show();
  });

  // inicio de sesion
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();

    const userInput = document.getElementById('loginUser').value.trim().toLowerCase();
    const passInput = document.getElementById('loginPassword').value;

    const listaUsuarios = obtenerUsuarios();

    const usuarioEncontrado = listaUsuarios.find(u => 
      (u.usuario.toLowerCase() === userInput || u.correo === userInput) && u.pass === passInput
    );

    if (usuarioEncontrado) {
      sessionStorage.setItem('usuario_activo', JSON.stringify(usuarioEncontrado));
      window.location.href = usuarioEncontrado.rol;
    } else {
      alert('Credenciales inválidas. Por favor verifique e intente de nuevo.');
    }
  });

  // recuperacion de contraseña
  formOlvido.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailRecovery = document.getElementById('recoveryEmail').value.trim().toLowerCase();
    const listaUsuarios = obtenerUsuarios();

    const usuarioExistente = listaUsuarios.find(u => u.correo === emailRecovery);

    if (usuarioExistente) {
      alert(`Se han enviado las instrucciones al correo indicado. (Contraseña: "${usuarioExistente.pass}")`);
    } else {
      alert('El correo ingresado no se encuentra en el sistema.');
    }

    modalOlvido.hide();
    formOlvido.reset();
  });
});