import { useEffect, useState } from 'react';
import { getRooms, updateRoomStatus, initializeRooms } from '../services/roomService';

function RoomList({refreshTrigger, onUpdate}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getRooms();
      const sorted = data.sort((a, b) => a.number.localeCompare(b.number));
      setRooms(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [refreshTrigger] );

const handleInit = async () => {
    try {
      setLoading(true);
      await initializeRooms(); // Llama al endpoint de creación
      await fetchRooms(); // Recarga
      alert("✅ Habitaciones creadas exitosamente.");
    } catch (error) {
      alert("Error inicializando: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{textAlign:'center'}}>Cargando inventario...</p>;
if (rooms.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #ccc', borderRadius: '10px', marginTop: '20px' }}>
        <h3 style={{ color: '#666' }}>Este hotel no tiene habitaciones configuradas</h3>
        <p>Como es un hotel nuevo, debe inicializar el inventario base.</p>
        <button 
          onClick={handleInit}
          style={{ backgroundColor: '#1565c0', color: 'white', padding: '15px 30px', border: 'none', borderRadius: '5px', fontSize: '1.1em', cursor: 'pointer', marginTop: '10px' }}
        >
          🏗️ Construir Habitaciones (Demo)
        </button>
      </div>
    );
  }

  const handleClean = async (roomNumber) => {
    try {
      setLoading(true);
      //Limpieza manual (set status available y ocupacion a 0)
      await updateRoomStatus(roomNumber, 'AVAILABLE',0);
      // 1. Avisamos al padre (App) para que actualice a los demás (Wizard)
      if (onUpdate) onUpdate();
      // 2. Nos actualizamos nosotros mismos
      await fetchRooms();
    } catch (error) {
      alert("Error al actualizar estado");
      setLoading(false);
    }
  };

  if (loading) return <p style={{textAlign:'center'}}>Actualizando inventario...</p>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return '#4CAF50'; // Verde
      case 'OCCUPIED': return '#F44336'; // Rojo
      case 'PARTIALLY_OCCUPIED': return '#2196F3'; // AZUL (Nuevo)
      case 'DIRTY': return '#FF9800';    // Naranja
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
        {rooms.map((room) => {
          // Calculamos porcentaje de ocupación para una mini barra
          const occupancyPct = room.maxOccupancy > 0 
            ? (room.currentOccupancy / room.maxOccupancy) * 100 
            : 0;

          return (
            <div key={room.id} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '10px',
              width: '140px', // Un poco más ancho
              textAlign: 'center',
              backgroundColor: '#fff',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{room.number}</h3>
              
              {/* ETIQUETA DE ESTADO */}
              <div style={{ 
                backgroundColor: getStatusColor(room.status), 
                color: 'white', padding: '4px', borderRadius: '4px',
                fontSize: '10px', fontWeight: 'bold', marginBottom: '5px'
              }}>
                {room.status.replace('_', ' ')}
              </div>
              
              {/* INFO DE TIPO Y PRECIO */}
              <p style={{ fontSize: '11px', color: '#666', margin: '2px 0' }}>
                {room.RoomType ? room.RoomType.name : 'N/A'}
              </p>

              {/* BARRA DE OCUPACIÓN (Solo si no está sucia) */}
              {room.status !== 'DIRTY' && room.status !== 'MAINTENANCE' && (
                <div style={{ marginTop: '8px', textAlign: 'left' }}>
                  <small style={{fontSize: '10px', color: '#333'}}>
                    Ocupación: <strong>{room.currentOccupancy} / {room.maxOccupancy}</strong>
                  </small>
                  <div style={{ width: '100%', height: '5px', backgroundColor: '#eee', borderRadius: '3px', marginTop: '2px' }}>
                    <div style={{ 
                      width: `${occupancyPct}%`, 
                      height: '100%', 
                      backgroundColor: getStatusColor(room.status), 
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              )}

              {/* BOTÓN DE LIMPIEZA */}
              {room.status === 'DIRTY' && (
                <button 
                  onClick={() => handleClean(room.number)}
                  style={{
                    marginTop: '5px', width: '100%', cursor: 'pointer',
                    backgroundColor: '#FF9800', color: 'white', border: 'none',
                    borderRadius: '4px', padding: '5px', fontWeight: 'bold', fontSize: '12px'
                  }}
                >
                  🧹 Limpiar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoomList;