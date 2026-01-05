import { useEffect, useState } from 'react';
import { getRooms, updateRoomStatus } from '../services/roomService'; // <--- Importar updateRoomStatus

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar inventario
  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      // Ordenar por número de habitación
      const sorted = data.sort((a, b) => a.number.localeCompare(b.number));
      setRooms(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []); // Nota: Si quitamos la prop 'key' del padre, necesitaríamos un intervalo o polling, pero por ahora está bien.

  // Lógica de Limpieza
  const handleClean = async (roomNumber) => {
    try {
      setLoading(true); // Feedback visual rápido
      await updateRoomStatus(roomNumber, 'AVAILABLE'); // La pasamos a VERDE
      await fetchRooms(); // Recargamos para ver el cambio
    } catch (error) {
      alert("Error al actualizar estado");
      setLoading(false);
    }
  };

  if (loading) return <p style={{textAlign:'center'}}>Actualizando inventario...</p>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#4CAF50';
      case 'OCCUPIED': return '#F44336';
      case 'DIRTY': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {rooms.map((room) => (
          <div key={room.id} style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            width: '130px',
            textAlign: 'center',
            backgroundColor: '#fff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            position: 'relative' // Para posicionar elementos si hace falta
          }}>
            <h3 style={{ margin: '0 0 5px 0' }}>{room.number}</h3>
            
            <div style={{ 
              backgroundColor: getStatusColor(room.status), 
              color: 'white', 
              padding: '4px', 
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              marginBottom: '5px'
            }}>
              {room.status}
            </div>
            
            <p style={{ fontSize: '11px', color: '#666', margin: '2px 0' }}>
              {room.RoomType ? room.RoomType.name : 'N/A'}
            </p>

            {/* BOTÓN DE LIMPIEZA (Solo si está sucia) */}
            {room.status === 'DIRTY' && (
              <button 
                onClick={() => handleClean(room.number)}
                style={{
                  marginTop: '5px',
                  width: '100%',
                  cursor: 'pointer',
                  backgroundColor: '#FF9800', // Mismo naranja
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '5px',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                🧹 Limpiar
              </button>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;