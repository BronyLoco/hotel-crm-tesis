import { useState } from 'react';
import { createGuest } from '../services/guestService';

function GuestForm({ onGuestAdded }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    documentId: '',
    phoneNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que se recargue la página
    try {
      await createGuest(formData);
      alert('¡Huésped registrado con éxito!');
      
      // Limpiar formulario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        documentId: '',
        phoneNumber: ''
      });

      // Avisar al componente padre que recargue la lista
      if (onGuestAdded) onGuestAdded();

    } catch (error) {
      alert('Error al registrar. Revisa si el email o documento ya existen.');
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
      <h3>Registrar Nuevo Huésped</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required />
        <input name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input name="documentId" placeholder="DNI / Pasaporte" value={formData.documentId} onChange={handleChange} required />
        <input name="phoneNumber" placeholder="Teléfono" value={formData.phoneNumber} onChange={handleChange} />
        <button type="submit" style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
          Guardar
        </button>
      </form>
    </div>
  );
}

export default GuestForm;