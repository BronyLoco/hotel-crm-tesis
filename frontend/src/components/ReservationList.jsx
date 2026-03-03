import { useEffect, useState } from 'react';
import { getReservations, doCheckIn, doCheckOut, extendStay } from '../services/reservationService';
import { getGuests } from '../services/guestService'; 
import { getFolioByReservation, addCharge } from '../services/billingService'; 
import { getRooms } from '../services/roomService'; 
import BillingModal from './BillingModal'; // Se usa abajo
import ExtensionModal from './ExtensionModal'; // Se usa abajo
import axios from 'axios';

function ReservationList({ refresh, onCheckInSuccess, filterMode = 'ALL' }) {
  const [reservations, setReservations] = useState([]);
  
  const [guestsMap, setGuestsMap] = useState({}); 
  const [foliosMap, setFoliosMap] = useState({}); 
  const [roomTypesMap, setRoomTypesMap] = useState({}); 
  
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [extendingReservation, setExtendingReservation] = useState(null);

  const fetchData = async () => {
    try {
      // 1. Cargar Reservas
      const resData = await getReservations();
      
      // Filtrado
      let filtered = resData;
      if (filterMode === 'PENDING') filtered = resData.filter(r => r.status === 'CONFIRMED');
      else if (filterMode === 'ACTIVE') filtered = resData.filter(r => r.status === 'CHECKED_IN');
      else if (filterMode === 'HISTORY') filtered = resData.filter(r => r.status === 'CHECKED_OUT' || r.status === 'CANCELLED');

      // Ordenar
      const sorted = filtered.sort((a, b) => (a.status === 'CONFIRMED' || a.status === 'CHECKED_IN' ? -1 : 1));
      setReservations(sorted);

      // 2. Cargar Nombres
      const allGuests = await getGuests();
      const gMap = {};
      allGuests.forEach(g => { gMap[g.id] = `${g.firstName} ${g.lastName}`; });
      setGuestsMap(gMap);

      // 3. Cargar Precios
      const allRooms = await getRooms();
      const rMap = {};
      allRooms.forEach(r => {
        if (r.RoomType) rMap[r.RoomType.id] = { name: r.RoomType.name, price: parseFloat(r.RoomType.basePrice) };
      });
      setRoomTypesMap(rMap);

      // 4. Cargar Folios
      const fMap = {};
      for (const res of sorted) {
        if (res.status !== 'CANCELLED') {
            try {
                const folio = await getFolioByReservation(res.id);
                fMap[res.id] = { id: folio.id, status: folio.status, totalAmount: folio.totalAmount }; 
            } catch (e) { fMap[res.id] = { status: 'UNKNOWN', totalAmount: 0 }; }
        }
      }
      setFoliosMap(fMap);

    } catch (error) { console.error(error); }
  };

  useEffect(() => { 
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  // --- HANDLERS ---
  const handleExtend = (reservation) => {
    setExtendingReservation(reservation);
  };

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
    let forceCheckout = false;
    
    if (folio && folio.status !== 'PAID' && parseFloat(folio.totalAmount) > 0) {
      const confirmVIP = confirm(`⚠️ DEUDA PENDIENTE: $${folio.totalAmount}.\n¿Es un cliente VIP o Autorizado para crédito?`);
        if(confirmVIP) {
            forceCheckout = true;
        } else {
            return;
        }
    } else {
        if (!confirm("¿Confirmar salida?")) return;
    }
    
    try {
      console.log("Enviando Checkout, Force:", forceCheckout);
      
      await axios.post(`http://localhost:8080/api/reservations/${reservationId}/checkout`, {
          force: forceCheckout
      });
      alert("👋 Check-out completado.");
      fetchData();
      if (onCheckInSuccess) onCheckInSuccess(); 
    } catch (error) {
       const msg = error.response?.data?.message || "Error al hacer Check-out";
      alert("❌ " + msg);
    }
  };
const handleCancel = async (reservationId) => {
      if(!confirm("¿Seguro que desea CANCELAR esta reserva? Se liberará la habitación.")) return;
      
      try {
          // Usamos el endpoint de checkout o uno específico.
          // Para tesis, podemos usar un endpoint PATCH directo si existe, o simularlo.
          // Mejor: Creamos endpoint específico en backend o reutilizamos update.
          
          // FORMA RÁPIDA (Reusando update standard si existe o creando uno):
          // En reservationRoutes.js deberías tener router.patch('/:id/cancel')
          // Si no, agregalo.
          
          await axios.patch(`http://localhost:8080/api/reservations/${reservationId}/cancel`);
          alert("Reserva Cancelada.");
          fetchData();
      } catch (e) { alert("Error al cancelar"); }
  };
  // --- RENDER ---
  return (
    <div>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85em' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1 }}>
          <tr style={{textAlign:'left', color:'#555'}}>
            <th style={{padding:'10px'}}>ID</th>
            <th>Huésped</th>
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
              <td style={{fontWeight:'bold', color:'#333'}}>
                  {guestsMap[res.guestId] || '...'}
                  <div style={{fontSize:'0.8em', color:'#666', fontWeight:'normal'}}>Pers: {res.totalGuests}</div>
              </td>
              <td style={{fontWeight:'bold', color: '#1565c0', fontSize:'1.2em'}}>{res.assignedRoomId || '-'}</td>
              <td>
                  <div style={{color:'#d32f2f', fontWeight:'bold'}}>{res.checkOut}</div>
                  {res.status === 'CHECKED_IN' && (
                      <button onClick={() => handleExtend(res)} style={{marginTop:'5px', fontSize:'0.8em', cursor:'pointer', border:'1px solid #999', background:'#fff', padding:'2px 5px', borderRadius:'3px'}}>
                          📅 + Días
                      </button>
                  )}
              </td>
              <td>
                  <div style={{fontSize:'1.1em', fontWeight:'bold', color: isPaid ? 'green' : '#d32f2f'}}>${folio.totalAmount}</div>
                  <div style={{fontSize:'0.8em', color: isPaid ? 'green' : '#f57c00'}}>{isPaid ? 'PAGADO' : 'PENDIENTE'}</div>
              </td>
              <td>
                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.8em', fontWeight:'bold', backgroundColor: '#eee' }}>
                    {res.status.replace('_', ' ')}
                </span>
              </td>
              <td style={{textAlign:'center'}}>
                <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                    {res.status === 'CONFIRMED' && <button onClick={() => handleCheckIn(res.id)} title="Entrada" style={{cursor:'pointer', backgroundColor:'#4CAF50', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>🔑</button>}
                    {(res.status === 'CHECKED_IN' || res.status === 'CHECKED_OUT') && <button onClick={() => setSelectedReservationId(res.id)} title="Ver Cuenta" style={{cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>💲</button>}
                    {res.status === 'CHECKED_IN' && <button onClick={() => handleCheckOut(res.id)} title="Salida" style={{cursor:'pointer', backgroundColor:'#D32F2F', color:'white', border:'none', padding:'8px', borderRadius:'4px'}}>🏃</button>}
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      </div>
      {reservations.length === 0 && <p style={{textAlign:'center', color:'#999'}}>No hay reservas en esta categoría.</p>}

      {/* --- MODALES (Aquí se usan las variables que el linter marcaba) --- */}
      
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
          onSuccess={() => { fetchData(); if(onCheckInSuccess) onCheckInSuccess(); }}
        />
      )}
    </div>
  );
}

export default ReservationList;