import { useEffect, useState } from 'react';
import { getReservations, doCheckIn, doCheckOut } from '../services/reservationService';
import BillingModal from './BillingModal'; 

function ReservationList({ refresh, onCheckInSuccess }) {
  const [reservations, setReservations] = useState([]);
  
  // Estado para saber qué cuenta abrir (si es null, el modal está cerrado)
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      const sorted = data.sort((a, b) => (a.status === 'CONFIRMED' ? -1 : 1));
      setReservations(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const handleCheckIn = async (reservationId) => {
    const roomNumber = prompt("Ingrese el número de habitación a asignar (ej. 101):");
    if (roomNumber) {
      try {
        await doCheckIn(reservationId, roomNumber);
        alert("✅ Check-in realizado. Habitación entregada.");
        fetchReservations(); 
        if (onCheckInSuccess) onCheckInSuccess(); 
      } catch (error) {
        console.error(error);
        alert("❌ Error al realizar Check-in.");
      }
    }
  };
    // MANEJADOR CHECK-OUT
  const handleCheckOut = async (reservationId) => {
    if (!confirm("¿Iniciar proceso de Check-out?")) return;
    
    try {
      await doCheckOut(reservationId);
      alert("👋 Check-out completado. Vuelva pronto.");
      fetchReservations(); // Recargar lista
      if (onCheckInSuccess) onCheckInSuccess(); // Actualizar inventario (poner naranja)
    } catch (error) {
      // Aquí mostraremos el mensaje de "Debe dinero" si falla
      const msg = error.response?.data?.message || "Error al hacer Check-out";
      alert("❌ " + msg);
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
              <small>Entrada: {res.checkIn} - Estado: {res.status}</small>
            </div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
              {/* BOTÓN CHECK-IN (Solo si está confirmada) */}
              {res.status === 'CONFIRMED' && (
                <button 
                  onClick={() => handleCheckIn(res.id)}
                  style={{ cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                >
                  Check-in 🔑
                </button>
              )}

              {/* BOTÓN VER CUENTA (Solo si ya hizo Check-in) */}
              {res.status === 'CHECKED_IN' && (
                <button 
                  onClick={() => setSelectedReservationId(res.id)}
                  style={{ cursor: 'pointer', backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                >
                  Ver Cuenta 💲
                </button>
              )}
                 {/* BOTÓN VER CUENTA */}
              {res.status === 'CHECKED_IN' && (
                <>
                  <button 
                    onClick={() => setSelectedReservationId(res.id)}
                    style={{ cursor: 'pointer', backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', marginRight: '5px' }}
                  >
                    Cuenta 💲
                  </button>

                  <button 
                    onClick={() => handleCheckOut(res.id)}
                    style={{ cursor: 'pointer', backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                  >
                    Salida 🏃
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
        {reservations.length === 0 && <p style={{color: '#999'}}>No hay reservas.</p>}
      </ul>

      {/* RENDERIZADO CONDICIONAL DEL MODAL */}
      {selectedReservationId && (
        <BillingModal 
          reservationId={selectedReservationId} 
          onClose={() => setSelectedReservationId(null)} 
        />
      )}

    </div>
  );
}

export default ReservationList;