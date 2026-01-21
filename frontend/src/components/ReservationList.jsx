import { useEffect, useState } from 'react';
import { getReservations, doCheckIn, doCheckOut, extendStay } from '../services/reservationService';
import { getGuests } from '../services/guestService'; 
import { getFolioByReservation, addCharge } from '../services/billingService'; // Importamos addCharge
import { getRooms } from '../services/roomService'; // Para saber precios
import BillingModal from './BillingModal';
import ExtensionModal from './ExtensionModal';

function ReservationList({ refresh, onCheckInSuccess }) {
  const [reservations, setReservations] = useState([]);
  
  // Mapas de datos para acceso rápido
  const [guestsMap, setGuestsMap] = useState({}); 
  const [foliosMap, setFoliosMap] = useState({}); // Guardará { status, totalAmount, id }
  const [roomTypesMap, setRoomTypesMap] = useState({}); // ID Tipo -> { price, name }
  
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [extendingReservation, setExtendingReservation] = useState(null);
  // CARGA DE DATOS MASIVA
  const fetchData = async () => {
    try {
      // 1. Cargar Reservas
      const resData = await getReservations();
      const sorted = resData.sort((a, b) => (a.status === 'CONFIRMED' || a.status === 'CHECKED_IN' ? -1 : 1));
      setReservations(sorted);

      // 2. Cargar Nombres de Huéspedes
      const allGuests = await getGuests();
      const gMap = {};
      allGuests.forEach(g => {
        gMap[g.id] = `${g.firstName} ${g.lastName}`;
      });
      setGuestsMap(gMap);

      // 3. Cargar Precios de Habitaciones (Para saber cuánto cobrar al extender)
      const allRooms = await getRooms();
      const rMap = {};
      allRooms.forEach(r => {
        if (r.RoomType) {
            rMap[r.RoomType.id] = { 
                name: r.RoomType.name, 
                price: parseFloat(r.RoomType.basePrice) 
            };
        }
      });
      setRoomTypesMap(rMap);

      // 4. Cargar Datos Financieros (Folios)
      const fMap = {};
      for (const res of sorted) {
        if (res.status !== 'CANCELLED') {
            try {
                const folio = await getFolioByReservation(res.id);
                // Guardamos todo el objeto folio
                fMap[res.id] = { 
                    id: folio.id, 
                    status: folio.status, 
                    totalAmount: folio.totalAmount 
                }; 
            } catch (e) { fMap[res.id] = { status: 'UNKNOWN', totalAmount: 0 }; }
        }
      }
      setFoliosMap(fMap);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { 
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  // --- LÓGICA DE EXTENSIÓN CON COBRO AUTOMÁTICO ---
  const handleExtend = (reservation) => {
    setExtendingReservation(reservation);
  };

  // --- CHECK IN / OUT ---
  const handleCheckIn = async (reservationId) => {
    const roomNumber = prompt("Ingrese habitación a asignar:");
    if (roomNumber) {
      try {
        await doCheckIn(reservationId, roomNumber);
        alert("✅ Check-in realizado.");
        fetchData(); 
        if (onCheckInSuccess) onCheckInSuccess(); 
      } catch (error) {
        alert("Error: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleCheckOut = async (reservationId) => {
    const folio = foliosMap[reservationId];
    if (folio && folio.status !== 'PAID') {
        // Validación estricta visual
        if(!confirm(`⚠️ DEUDA PENDIENTE: $${folio.totalAmount}\nEl huésped no ha pagado.\n¿Forzar salida de todos modos?`)) return;
    } else {
        if (!confirm("¿Confirmar salida y liberación de habitación?")) return;
    }
    
    try {
      await doCheckOut(reservationId);
      alert("👋 Check-out completado.");
      fetchData();
      if (onCheckInSuccess) onCheckInSuccess(); 
    } catch (error) {
      alert("❌ " + (error.response?.data?.message || "Error al hacer Check-out"));
    }
  };

  return (
    <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <h3 style={{marginTop:0, color:'#444'}}>📋 Panel de Control de Reservas</h3>
      
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1 }}>
          <tr style={{textAlign:'left', color:'#555'}}>
            <th style={{padding:'10px'}}>ID</th>
            <th>Huésped (Titular)</th>
            <th>Hab.</th>
            <th>Salida</th>
            <th>Deuda</th>
            <th>Estado</th>
            <th style={{textAlign:'center'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map(res => {
             const folio = foliosMap[res.id] || { status: 'UNKNOWN', totalAmount: 0 };
             const isPaid = folio.status === 'PAID';
             
             return (
            <tr key={res.id} style={{ borderBottom: '1px solid #eee', backgroundColor: res.status === 'CHECKED_OUT' ? '#fcfcfc' : 'white' }}>
              <td style={{padding:'10px'}}>#{res.id}</td>
              
              {/* COLUMNA HUÉSPED MEJORADA */}
              <td>
                  <div style={{fontWeight:'bold', fontSize:'1.1em'}}>
                    {guestsMap[res.guestId] || '...'}
                  </div>
                  {/* Aquí mostramos cuántos son en total */}
                  <div style={{color:'#666', fontSize:'0.9em'}}>
                    👥 Total: {res.totalGuests} persona{res.totalGuests > 1 ? 's' : ''}
                  </div>
              </td>
              
              {/* HABITACIÓN */}
              <td style={{fontWeight:'bold', color: '#1565c0', fontSize:'1.2em'}}>
                  {res.assignedRoomId || '-'}
              </td>

              {/* FECHAS Y EXTENSIÓN */}
              <td>
                  <div style={{color:'#d32f2f', fontWeight:'bold'}}>{res.checkOut}</div>
                  {res.status === 'CHECKED_IN' && (
                      <button onClick={() => handleExtend(res)} style={{marginTop:'5px', fontSize:'0.8em', cursor:'pointer', border:'1px solid #999', background:'#fff', padding:'2px 5px', borderRadius:'3px'}}>
                          📅 + Días
                      </button>
                  )}
              </td>

              {/* DINERO (NUEVO) */}
              <td>
                  <div style={{fontSize:'1.1em', fontWeight:'bold', color: isPaid ? 'green' : '#d32f2f'}}>
                    ${folio.totalAmount}
                  </div>
                  <div style={{fontSize:'0.8em', color: isPaid ? 'green' : '#f57c00'}}>
                    {isPaid ? 'PAGADO' : 'PENDIENTE'}
                  </div>
              </td>

              {/* ESTADO RESERVA */}
              <td>
                <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em', fontWeight:'bold',
                    backgroundColor: res.status === 'CHECKED_IN' ? '#E3F2FD' : (res.status === 'CHECKED_OUT' ? '#eee' : '#FFF3E0'),
                    color: res.status === 'CHECKED_IN' ? '#1565C0' : (res.status === 'CHECKED_OUT' ? '#999' : '#EF6C00')
                }}>
                    {res.status.replace('_', ' ')}
                </span>
              </td>

              {/* BOTONES ACCIONES */}
              <td style={{textAlign:'center'}}>
                <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                    {res.status === 'CONFIRMED' && (
                        <button onClick={() => handleCheckIn(res.id)} title="Entrada" style={{cursor:'pointer', backgroundColor:'#4CAF50', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>
                            🔑
                        </button>
                    )}

                    {(res.status === 'CHECKED_IN' || res.status === 'CHECKED_OUT') && (
                        <button onClick={() => setSelectedReservationId(res.id)} title="Ver Cuenta" style={{cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>
                            💲
                        </button>
                    )}

                    {res.status === 'CHECKED_IN' && (
                        <button onClick={() => handleCheckOut(res.id)} title="Salida" style={{cursor:'pointer', backgroundColor:'#D32F2F', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>
                            🏃
                        </button>
                    )}
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      </div>
      
      {selectedReservationId && (
        <BillingModal 
          reservationId={selectedReservationId} 
          onClose={() => { setSelectedReservationId(null); fetchData(); }} 
        />
      )}
      {extendingReservation && (
        <ExtensionModal 
          reservation={extendingReservation}
          onClose={() => setExtendingReservation(null)}
          onSuccess={() => {
             fetchData(); // Recargar datos al terminar
             if (onCheckInSuccess) onCheckInSuccess(); // Opcional
          }}
        />
      )}
    </div>
  );
}

export default ReservationList;