import { useState } from 'react';
import { createGuest } from '../services/guestService';

function PublicGroupRegister() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', documentId: '', phoneNumber: '',
    groupCode: '' // Campo clave
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData, groupCode: formData.groupCode.toUpperCase() };
      await createGuest(dataToSend);
      setSuccess(true);
    } catch (error) {
      // MEJORA: Leer el mensaje real del backend
      console.error(error);
      
      // Intentamos sacar el mensaje específico (ej. "Validation error: email failed")
      // O el mensaje genérico del backend
      const serverMessage = error.response?.data?.error || error.response?.data?.message;
      
      // Si es un error de validación de Sequelize, suele venir en un array o string largo
      if (serverMessage && serverMessage.includes('isEmail')) {
         alert("❌ Error: El formato del correo electrónico no es válido.");
      } else if (serverMessage && serverMessage.includes('unique')) {
         alert("❌ Error: El DNI o Email ya están registrados.");
      } else {
         alert("❌ Error al registrarse: " + (serverMessage || "Error desconocido"));
      }
    }
  };

  if (success) return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ ¡Registro Exitoso!</h1>
      <p>Ya formas parte del grupo <strong>{formData.groupCode}</strong>.</p>
      <p>Acércate a recepción para recibir tu llave.</p>
      <button onClick={() => { setSuccess(false); setFormData({...formData, documentId:'', email:''}) }}>
        Registrar otro compañero
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', color: '#1565c0' }}>🏆 Registro de Delegación</h2>
      <p style={{ textAlign: 'center', fontSize: '0.9em', color: '#666' }}>Ingresa el código que te dio tu coordinador.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
          <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>CÓDIGO DE GRUPO:</label>
          <input 
            name="groupCode" value={formData.groupCode} 
            onChange={e => setFormData({...formData, groupCode: e.target.value})}
            placeholder="Ej. SANMATEO" required 
            style={{ width: '100%', padding: '8px', border: '2px solid #1565c0', borderRadius: '4px' }}
          />
        </div>

        <input name="firstName" placeholder="Nombre" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required style={{padding:'8px'}}/>
        <input name="lastName" placeholder="Apellido" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required style={{padding:'8px'}}/>
        <input name="documentId" placeholder="DNI / Pasaporte" value={formData.documentId} onChange={e => setFormData({...formData, documentId: e.target.value})} required style={{padding:'8px'}}/>
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required style={{padding:'8px'}}/>
        
        <button type="submit" style={{ padding: '12px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: 'pointer' }}>
          ¡Registrarme! ⚽
        </button>
      </form>
    </div>
  );
}

export default PublicGroupRegister;