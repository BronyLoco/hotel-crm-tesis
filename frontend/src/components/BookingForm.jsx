import { useState, useEffect } from 'react';
import { getGuests } from '../services/guestService';
import { getRooms } from '../services/roomService';
import { createReservation } from '../services/reservationService';

function BookingForm({ onReservationCreated }) {
  const [guests, setGuests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  
  const [formData, setFormData] = useState({
    guestId: '',
    roomTypeId: '',
    checkIn: '',
    checkOut: ''
  });

  // Cargar datos maestros al iniciar
  useEffect(() => {
    const loadData = async () => {
      try {
        const guestsData = await getGuests();
        setGuests(guestsData);

        // Truco: Obtenemos todas las habitaciones y extraemos los TIPOS únicos
        const roomsData = await getRooms();
        const typesMap = new Map();
        
        roomsData.forEach(room => {
          if (room.RoomType) {
            // Usamos el ID del tipo como clave para no repetir
            typesMap.set(room.RoomType.id, room.RoomType);
          }
        });
        
        setRoomTypes(Array.from(typesMap.values()));
        
      } catch (error) {
        console.error("Error cargando datos para el formulario");
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReservation(formData);
      alert('✅ ¡Reserva confirmada exitosamente!');
      if (onReservationCreated) onReservationCreated();
      
      // Limpiar fechas (dejamos guest/room seleccionados por comodidad)
      setFormData({ ...formData, checkIn: '', checkOut: '' });
      
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '20px' }}>
      <h3 style={{ marginTop: 0, color: '#1565c0' }}>📅 Nueva Reserva</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
        
        {/* Selección de Huésped */}
        <div>
          <label>Huésped:</label>
          <select 
            name="guestId" 
            value={formData.guestId} 
            onChange={handleChange} 
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Seleccione Huésped --</option>
            {guests.map(g => (
              <option key={g.id} value={g.id}>
                {g.firstName} {g.lastName} ({g.documentId})
              </option>
            ))}
          </select>
        </div>

        {/* Selección de Tipo de Habitación */}
        <div>
          <label>Tipo de Habitación:</label>
          <select 
            name="roomTypeId" 
            value={formData.roomTypeId} 
            onChange={handleChange} 
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="">-- Seleccione Tipo --</option>
            {roomTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name} (Cap: {type.capacity} - ${type.basePrice})
              </option>
            ))}
          </select>
        </div>

        {/* Fechas */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label>Check-In:</label>
            <input 
              type="date" 
              name="checkIn" 
              value={formData.checkIn} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Check-Out:</label>
            <input 
              type="date" 
              name="checkOut" 
              value={formData.checkOut} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>

        <button type="submit" style={{ 
          backgroundColor: '#1565c0', color: 'white', padding: '10px', 
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
        }}>
          CONFIRMAR RESERVA
        </button>
      </form>
    </div>
  );
}

export default BookingForm;