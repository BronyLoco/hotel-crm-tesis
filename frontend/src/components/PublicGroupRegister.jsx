import { useState } from 'react';
import { createGuest } from '../services/guestService';
import GuestDataForm from './GuestDataForm';

function PublicGroupRegister() {
  const searchParams = new URLSearchParams(window.location.search);
  const codeFromUrl = searchParams.get('code') || '';
  const tenantIdFromUrl = searchParams.get('tid');
  const hotelIdFromUrl = searchParams.get('hid');

  const [formData, setFormData] = useState({
    firstName: '', 
    lastName: '', 
    email: '', 
    documentId: '',
    phoneNumber: '',
    country: '',
    city: '',
    nationality: '',
    birthDate: '',
    civilStatus: 'SOLTERO',
    groupCode: codeFromUrl
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tenantIdFromUrl || !hotelIdFromUrl) {
      return alert("Error: El enlace de registro es inválido o incompleto. Pida uno nuevo al hotel.");
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return alert("❌ Email inválido. Corríjalo o déjelo en blanco (si el campo no es obligatorio).");
    }
    try {
      const dataToSend = { 
        ...formData, 
        groupCode: formData.groupCode.toUpperCase()
      };
      await createGuest(dataToSend,{
        'x-tenant-id': tenantIdFromUrl,
        'x-hotel-id': hotelIdFromUrl
      });
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
        
        {/* Campo de Código (Solo lectura si viene por URL) */}
        <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
          <label style={{ fontSize: '0.8em', fontWeight: 'bold' }}>CÓDIGO DE GRUPO:</label>
          <input 
            name="groupCode" value={formData.groupCode} 
            onChange={e => setFormData({...formData, groupCode: e.target.value})}
            placeholder="Ej. SANMATEO" required 
            style={{ width: '100%', padding: '8px', border: '2px solid #1565c0', borderRadius: '4px' }}
          />
        </div>

        {/* FORMULARIO */}
        <GuestDataForm 
            guest={formData}
            onChange={setFormData}
            disabled={false}
        />
        <button type="submit" style={{ padding: '12px', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: 'pointer' }}>
          ¡Registrarme!
        </button>
      </form>
    </div>
  );
}

export default PublicGroupRegister;