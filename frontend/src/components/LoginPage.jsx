import { useState } from 'react';
import { login } from '../services/authService';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      // Avisar a App.jsx que ya entramos
      onLoginSuccess();
    } catch (err) {
      setError('Credenciales inválidas. Intente de nuevo.');
    }
  };

  return (
    <div style={{ 
      height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', 
      backgroundColor: '#f0f2f5', fontFamily: 'Segoe UI, sans-serif' 
    }}>
      <div style={{ 
        backgroundColor: 'white', padding: '40px', borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '350px', textAlign: 'center' 
      }}>
        <h1 style={{ color: '#1565c0', marginBottom: '10px' }}>🏨 Hotel CRM</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Acceso Administrativo</p>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9em' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Usuario" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
          />
          <button 
            type="submit" 
            style={{ 
              padding: '12px', backgroundColor: '#1565c0', color: 'white', 
              border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1em' 
            }}
          >
            INGRESAR
          </button>
        </form>
        
        <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#888' }}>
          Sistema de Gestión v2.0
        </p>
      </div>
    </div>
  );
}

export default LoginPage;