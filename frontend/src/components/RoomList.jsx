import { useEffect, useState } from 'react';
import { getRooms } from '../services/roomService';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getRooms();
        setRooms(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  if (loading) return <p>Cargando inventario...</p>;

  // Función auxiliar para elegir color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#4CAF50'; // Verde
      case 'OCCUPIED': return '#F44336'; // Rojo
      case 'DIRTY': return '#FF9800';    // Naranja
      default: return '#9E9E9E';         // Gris
    }
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <h2>🏨 Estado del Hotel (Inventario)</h2>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {rooms.map((room) => (
          <div key={room.id} style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            width: '120px',
            textAlign: 'center',
            backgroundColor: '#fff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>{room.number}</h3>
            
            <div style={{ 
              backgroundColor: getStatusColor(room.status), 
              color: 'white', 
              padding: '5px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {room.status}
            </div>
            
            <p style={{ fontSize: '12px', color: '#666' }}>
              {room.RoomType ? room.RoomType.name : 'N/A'}
            </p>
            <p style={{ fontWeight: 'bold' }}>
              ${room.RoomType ? room.RoomType.basePrice : 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;