import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login({ onLoginSuccess }) {
  const [usuarioInput, setUsuarioInput] = useState('');
  const [contrasenaInput, setContrasenaInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Consultamos a Supabase SIN usar .single()
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuarioInput)
      .eq('contrasena', contrasenaInput);

    if (error) {
      setErrorMsg('Error de conexión con el servidor.');
      return;
    }

    // 2. Si no encuentra ninguna coincidencia en la base de datos
    if (!data || data.length === 0) {
      setErrorMsg('Usuario o contraseña incorrectos.');
      return;
    }

    // 3. Tomamos el primer registro encontrado
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