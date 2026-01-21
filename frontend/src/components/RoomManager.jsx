import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms } from '../services/roomService';

function RoomManager({ onUpdate }) {
  // Hardcodeamos los tipos por ahora o los traemos de una API si existiera
  const roomTypes = [
    { id: 1, name: 'Económica', price: 10, cap: 1 },
    { id: 2, name: 'Estándar', price: 20, cap: 2 },
    { id: 3, name: 'Matrimonial', price: 35, cap: 2 },
    { id: 4, name: 'Familiar', price: 15, cap: 4 },
  ];

  const [formData, setFormData] = useState({ number: '', typeId: '1' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedType = roomTypes.find(t => t.id === parseInt(formData.typeId));
      
      await axios.post('http://localhost:8080/api/rooms', {
        number: formData.number,
        roomTypeId: selectedType.id,
        maxOccupancy: selectedType.cap
      });
      
      alert("✅ Habitación creada");
      setFormData({ ...formData, number: '' });
      if(onUpdate) onUpdate();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3>🛠️ Configuración de Habitaciones</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <div>
          <label>Número:</label><br/>
          <input placeholder="Ej. 505" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required style={{padding:'5px', width:'80px'}} />
        </div>
        <div>
          <label>Tipo:</label><br/>
          <select value={formData.typeId} onChange={e => setFormData({...formData, typeId: e.target.value})} style={{padding:'6px'}}>
            {roomTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name} (${t.price}/p - Max {t.cap})</option>
            ))}
          </select>
        </div>
        <button type="submit" style={{padding:'6px 15px', backgroundColor:'#1565c0', color:'white', border:'none', cursor:'pointer', borderRadius:'4px'}}>
          + Crear
        </button>
      </form>
    </div>
  );
}

export default RoomManager;