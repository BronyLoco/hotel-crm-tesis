import { useState } from 'react';
import axios from 'axios';
import { getGuests } from '../services/guestService';

// Necesitamos llamar a APIs directamente para hacer la magia de "Reserva + Checkin" junto
const API_URL_RESERVATIONS = 'http://localhost:8080/api/reservations';

function GroupManager({ onUpdate }) {
  const [groupCode, setGroupCode] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Buscar al equipo
  const searchGroup = async (e) => {
    e.preventDefault();
    try {
      // Usamos la función que creamos antes que acepta query params? No, hay que modificar el service
      // Truco rápido: Llamamos directo a axios con el query param
      const response = await axios.get(`http://localhost:8080/api/guests?groupCode=${groupCode.toUpperCase()}`);
      setMembers(response.data);
    } catch (error) {
      alert("Error buscando el grupo");
    }
  };

  // 2. Asignación Rápida (Crea Reserva + Check-in en un paso)
  const handleFastAssign = async (guestId, guestName) => {
    const roomNumber = prompt(`Asignar habitación para ${guestName}:`);
    if (!roomNumber) return;

    try {
      setLoading(true);
      
      // A. Crear Reserva "Express" (De hoy a mañana por defecto)
      // Necesitamos saber un tipo de habitación. Para simplificar la tesis, usaremos ID 1 (Simple) o 2 (Doble) hardcodeado
      // O preguntamos:
      const roomTypeId = prompt("Tipo de habitación ID (1=Simple, 2=Doble...):", "1");

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const resReserva = await axios.post(API_URL_RESERVATIONS, {
        guestId,
        roomTypeId: parseInt(roomTypeId),
        checkIn: today,
        checkOut: tomorrow
      });

      const newReservationId = resReserva.data.reservation.id;

      // B. Hacer Check-in inmediato
      await axios.post(`${API_URL_RESERVATIONS}/${newReservationId}/checkin`, {
        roomNumber
      });

      alert(`✅ ${guestName} asignado a la habitación ${roomNumber}`);
      
      // Actualizar todo
      if (onUpdate) onUpdate();
      
      // Quitar de la lista visual temporalmente para que sepa que ya está listo
      setMembers(members.filter(m => m.id !== guestId));

    } catch (error) {
      console.error(error);
      alert("❌ Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px dashed #1565c0', borderRadius: '10px', backgroundColor: '#f0f9ff', marginTop: '20px' }}>
      <h3>⚽ Gestión de Delegaciones</h3>
      
      <form onSubmit={searchGroup} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input 
          placeholder="Código de Grupo (ej. SANMATEO)" 
          value={groupCode}
          onChange={e => setGroupCode(e.target.value)}
          style={{ padding: '8px' }}
        />
        <button type="submit" style={{ cursor: 'pointer', backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '4px' }}>
          Buscar
        </button>
      </form>

      {members.length > 0 && (
        <table style={{ width: '100%', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{m.firstName} {m.lastName}</td>
                <td>{m.documentId}</td>
                <td>
                  <button 
                    disabled={loading}
                    onClick={() => handleFastAssign(m.id, m.firstName)}
                    style={{ backgroundColor: '#2E7D32', color: 'white', border: 'none', padding: '5px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ➡️ Asignar Cama
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {members.length === 0 && groupCode && <p style={{fontStyle:'italic', color:'#666'}}>Sin miembros pendientes (o no encontrados).</p>}
    </div>
  );
}

export default GroupManager;