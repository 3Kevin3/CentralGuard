import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [usuarioInput, setUsuarioInput] = useState('');
  const [contrasenaInput, setContrasenaInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const usuario = usuarioInput.trim();
    const contrasena = contrasenaInput.trim();

    // 1. La base de datos valida la contraseña (hash + salt) con la función
    const { data: ok, error: errorLogin } = await supabase.rpc('fn_validar_login', {
      p_usuario: usuario,
      p_contrasena: contrasena,
    });

    if (errorLogin) {
      setErrorMsg('Error de conexión con el servidor.');
      return;
    }

    // 2. Si la función devuelve false, usuario o contraseña no coinciden
    if (!ok) {
      setErrorMsg('Usuario o contraseña incorrectos.');
      return;
    }

    // 3. Login válido: traemos los datos del usuario SIN la contraseña
    const { data, error } = await supabase
      .from('usuarios')
      .select('idusuario, idroles, usuario, nombre, apellido')
      .eq('usuario', usuario);

    if (error || !data || data.length === 0) {
      setErrorMsg('Error de conexión con el servidor.');
      return;
    }

    const usuarioEncontrado = data[0];

    // 4. Redireccionamos según el tipo de rol
    if (usuarioEncontrado.idroles === 1) {
      onLoginSuccess(usuarioEncontrado, '/admin');
    } else if (usuarioEncontrado.idroles === 2) {
      onLoginSuccess(usuarioEncontrado, '/supervisor');
    } else if (usuarioEncontrado.idroles === 3) {
      onLoginSuccess(usuarioEncontrado, '/vigilante');
    } else {
      // Por si tiene algún otro rol configurado
      onLoginSuccess(usuarioEncontrado, '/');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Iniciar Sesión</h2>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <input 
        type="text" 
        placeholder="Usuario" 
        value={usuarioInput} 
        onChange={(e) => setUsuarioInput(e.target.value)} 
      />
      <input 
        type="password" 
        placeholder="Contraseña" 
        value={contrasenaInput} 
        onChange={(e) => setContrasenaInput(e.target.value)} 
      />
      <button type="submit">Ingresar</button>
    </form>
  );
}