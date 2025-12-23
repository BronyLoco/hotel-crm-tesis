import { useEffect, useState } from 'react';
import { getReservations, doCheckIn } from '../services/reservationService';

function ReservationList({ refresh, onCheckInSuccess }) {
  const [reservations, setReservations] = useState([]);

  // Función auxiliar pura para cargar datos (la usaremos en varios lugares)
  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      // Ordenar: Las CONFIRMED primero
      const sorted = data.sort((a, b) => (a.status === 'CONFIRMED' ? -1 : 1));
      setReservations(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  // 1. Efecto para Carga Inicial y cuando cambia 'refresh'
  useEffect(() => { 
    fetchReservations();
    // Desactivamos la advertencia de dependencias aquí porque 'fetchReservations' es estable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  // 2. Manejador del Check-in
  const handleCheckIn = async (reservationId) => {
    const roomNumber = prompt("Ingrese el número de habitación a asignar (ej. 101):");
    
    if (roomNumber) {
      try {
        await doCheckIn(reservationId, roomNumber);
        alert("✅ Check-in realizado. Habitación entregada.");
        
        // Recargamos la lista reutilizando la función
        fetchReservations(); 
        
        if (onCheckInSuccess) onCheckInSuccess(); 
      } catch (error) {
        console.error(error);
        alert("❌ Error al realizar Check-in. Revise la consola.");
      }
    }
  };

  return (
    <div>
      <h3>📋 Reservas (Operaciones)</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {reservations.map(res => (
          <li key={res.id} style={{ 
            padding: '15px', borderBottom: '1px solid #eee', 
            backgroundColor: res.status === 'CHECKED_IN' ? '#f0f9ff' : 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <strong>Reserva #{res.id}</strong> {res.assignedRoomId && <span style={{color:'blue'}}>| Hab: {res.assignedRoomId}</span>} <br/>
              <small>Entrada: {res.checkIn} - Tipo ID: {res.roomTypeId}</small>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ 
                fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                backgroundColor: res.status === 'CONFIRMED' ? '#FFF3E0' : '#E1F5FE',
                color: res.status === 'CONFIRMED' ? '#E65100' : '#0277BD'
              }}>
                {res.status}
              </span>

              {res.status === 'CONFIRMED' && (
                <button 
                  onClick={() => handleCheckIn(res.id)}
                  style={{ cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                >
                  Check-in 🔑
                </button>
              )}
            </div>
          </li>
        ))}
        {reservations.length === 0 && <p style={{color: '#999'}}>No hay reservas registradas.</p>}
      </ul>
    </div>
  );
}

export default ReservationList;