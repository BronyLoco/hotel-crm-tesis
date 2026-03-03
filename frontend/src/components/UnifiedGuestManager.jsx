import { useState, useEffect } from 'react';
import axios from 'axios';
import { getReservations, doCheckIn, doCheckOut, createReservation, extendStay } from '../services/reservationService';
import { getGuests } from '../services/guestService';
import { getFolioByReservation, addCharge } from '../services/billingService';
import RoomSelectorModal from './RoomSelectorModal';
import BillingModal from './BillingModal';
import ExtensionModal from './ExtensionModal';

function UnifiedGuestManager({ refreshTrigger, onUpdate }) {
  const [activeTab, setActiveTab] = useState('IN_HOUSE'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [dataList, setDataList] = useState([]);
  
  // Modales: showBilling ahora puede ser un objeto { reservationId } o { groupId }
  const [showRoomSelector, setShowRoomSelector] = useState(null); 
  const [showBilling, setShowBilling] = useState(null); 
  const [showExtension, setShowExtension] = useState(null);
  
  const loadData = async () => {
    try {
      // Pedimos datos a las APIs
      const [allRes, allGuests, groups] = await Promise.all([
          getReservations(),
          getGuests(),
          axios.get('http://localhost:8080/api/guests/groups').then(r => r.data)
      ]);

      const gMap = {};
      allGuests.forEach(g => gMap[g.id] = g);

      let unifiedList = [];

      // 1. PROCESAR RESERVAS (Ya existentes)
      allRes.forEach(res => {
          const guest = gMap[res.guestId] || {};
          unifiedList.push({
              type: 'RESERVATION',
              id: res.id,
              guestName: `${guest.firstName} ${guest.lastName}`,
              documentId: guest.documentId,
              status: res.status,
              room: res.assignedRoomId,
              checkIn: res.checkIn,
              checkOut: res.checkOut,
              
              // Dato clave para saber si es de grupo
              groupEventId: res.groupEventId, 
              
              raw: res
          });
      });

      // 2. PROCESAR MIEMBROS DE GRUPO (Pendientes de asignar)
      const guestsWithAnyReservation = new Set(allRes.map(r => r.guestId));

       groups.forEach(ev => {
          if (ev.Guests) {
              ev.Guests.forEach(g => {
                  // Solo lo agregamos si NO tiene historial de reservas
                  if (!guestsWithAnyReservation.has(g.id)) {
                      unifiedList.push({
                          type: 'GROUP_MEMBER',
                          id: g.id, 
                          guestName: `${g.firstName} ${g.lastName}`,
                          documentId: g.documentId,
                          status: 'WAITING_ROOM', 
                          groupName: ev.name,
                          groupEventId: ev.id,
                          raw: g 
                      });
                  }
              });
          }
      });

      setDataList(unifiedList);

    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadData(); }, [refreshTrigger]);

  // --- ACCIONES ---

  const handleAssignClick = (item) => {
      setShowRoomSelector(item);
  };

  const onRoomSelected = async (room) => {
      if (!showRoomSelector) return;
      const item = showRoomSelector;
      
      const action = prompt(`Seleccionó la Habitación ${room.number}.\nEscriba 1 para INGRESO INMEDIATO (Check-in).\nEscriba 2 para PRE-ASIGNAR (Reservar esta habitación).`, "1");

      if (action !== "1" && action !== "2") return;
      setShowRoomSelector(null);

      try {
          if (item.type === 'RESERVATION') {
            if (action === "1") {
              await doCheckIn(item.id, room.number);
              // Solo cobramos al individuo si NO es de grupo
              if (!item.groupEventId) {
                setTimeout(async () => {
                    const folio = await getFolioByReservation(item.id);
                    await addCharge(folio.id, "Alojamiento Inicial", parseFloat(room.RoomType.basePrice));
                }, 1000);
              }
            } else {
              await axios.patch(`http://localhost:8080/api/reservations/${item.id}/change-room`, {
                      newRoomNumber: room.number
                  });
                  alert("✅ Habitación reservada/asignada para este huésped.");
              }
          

          } else if (item.type === 'GROUP_MEMBER') {
              const today = new Date().toISOString().split('T')[0];
              const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
              
              const res = await createReservation({
                  guestId: item.id,
                  roomTypeId: room.RoomType.id,
                  checkIn: today,
                  checkOut: tomorrow,
                  totalGuests: 1,
                  groupEventId: item.groupEventId // Pasamos el ID del grupo a la reserva
              });
              await doCheckIn(res.reservation.id, room.number);
          }

          alert("✅ Habitación asignada correctamente.");
          if(onUpdate) onUpdate();
          loadData();

      } catch (error) {
          alert("Error: " + error.message);
      }
  };

  const handleCheckOut = async (reservationId) => {
      if (!confirm("¿Confirmar salida?")) return;
      try {
          await doCheckOut(reservationId);
          alert("👋 Salida registrada.");
          if(onUpdate) onUpdate();
          loadData();
      } catch (e) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  // Necesitas una función para cancelar
const handleCancelReservation = async (reservationId) => {
    if (!confirm("¿Seguro que desea CANCELAR esta reserva? Se liberará el cupo.")) return;
    try {
        await axios.patch(`http://localhost:8080/api/reservations/${reservationId}/cancel`);
        alert("✅ Reserva cancelada.");
        if (onUpdate) onUpdate();
        loadData(); // Recargar lista
    } catch (e) {
        alert("Error: " + (e.response?.data?.message || e.message));
    }
};
const handleDelete = async (id) => {
      if(!confirm("⚠️ ¿Estás seguro de ELIMINAR permanentemente este registro?")) return;
      try {
          await axios.delete(`http://localhost:8080/api/reservations/${id}`);
          alert("🗑️ Registro eliminado.");
          loadData();
          if(onUpdate) onUpdate();
      } catch (e) { alert("Error: " + e.message); }
  };

  // --- FILTROS Y RENDER ---
  const getFilteredData = () => {
      let filtered = dataList;
      if (activeTab === 'PENDING') {
          filtered = dataList.filter(i => i.status === 'CONFIRMED' || i.status === 'WAITING_ROOM');
      } else if (activeTab === 'IN_HOUSE') {
          filtered = dataList.filter(i => i.status === 'CHECKED_IN');
      } else if (activeTab === 'HISTORY') {
          filtered = dataList.filter(i => i.status === 'CHECKED_OUT' || i.status === 'CANCELLED');
      }
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          filtered = filtered.filter(i => i.guestName.toLowerCase().includes(lower) || i.documentId.includes(searchTerm));
      }
      return filtered;
  };

  const rows = getFilteredData();

  return (
    <div style={{ marginTop: '20px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd', padding: '15px' }}>
      
      {/* TABS */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
          <div style={{display:'flex', gap:'10px'}}>
              <button onClick={()=>setActiveTab('PENDING')} style={{padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer', background: activeTab==='PENDING'?'#e3f2fd':'#eee', color: activeTab==='PENDING'?'#1565c0':'#666', fontWeight:'bold'}}>📥 Por Llegar</button>
              <button onClick={()=>setActiveTab('IN_HOUSE')} style={{padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer', background: activeTab==='IN_HOUSE'?'#e8f5e9':'#eee', color: activeTab==='IN_HOUSE'?'#2e7d32':'#666', fontWeight:'bold'}}>🏠 En Casa</button>
              <button onClick={()=>setActiveTab('HISTORY')} style={{padding:'8px 15px', borderRadius:'20px', border:'none', cursor:'pointer', background: activeTab==='HISTORY'?'#fff3e0':'#eee', color: activeTab==='HISTORY'?'#ef6c00':'#666', fontWeight:'bold'}}>📜 Historial</button>
          </div>
          <input placeholder="🔍 Buscar Huésped..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{padding:'8px', borderRadius:'5px', border:'1px solid #ccc', width:'250px'}} />
      </div>

      {/* TABLA */}
      <div style={{maxHeight:'500px', overflowY:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9em'}}>
              <thead style={{backgroundColor:'#f9f9f9', borderBottom:'2px solid #eee', position:'sticky', top:0}}>
                  <tr style={{textAlign:'left'}}>
                      <th style={{padding:'10px'}}>Huésped</th>
                      <th>Origen</th>
                      <th>Habitación</th>
                      <th>Fechas</th>
                      <th>Estado</th>
                      <th style={{textAlign:'center'}}>Acciones</th>
                  </tr>
              </thead>
              <tbody>
                  {rows.map((item) => (
                      <tr key={`${item.type}-${item.id}`} style={{borderBottom:'1px solid #eee'}}>
                          <td style={{padding:'10px'}}>
                              <div style={{fontWeight:'bold'}}>{item.guestName}</div>
                              <div style={{fontSize:'0.8em', color:'#666'}}>{item.documentId}</div>
                          </td>
                          <td>
                              {item.type === 'GROUP_MEMBER' || item.groupEventId ? 
                                <span style={{backgroundColor:'#e0f7fa', padding:'2px 5px', borderRadius:'4px', fontSize:'0.8em', color:'#006064'}}>🚌 {item.groupName || 'Delegación'}</span> : 
                                'Individual'}
                          </td>
                          <td style={{fontWeight:'bold', color:'#1565c0'}}>{item.room || '-'}</td>
                          <td>{item.type === 'RESERVATION' ? `${item.checkIn} > ${item.checkOut}` : 'Pendiente'}</td>
                          <td>
                              <span style={{padding:'3px 8px', borderRadius:'10px', fontSize:'0.8em', fontWeight:'bold', backgroundColor: item.status==='CHECKED_IN'?'#c8e6c9':(item.status==='WAITING_ROOM'?'#ffecb3':'#eee')}}>
                                  {item.status.replace('_', ' ')}
                              </span>
                          </td>
                          <td style={{textAlign:'center'}}>
                              {/* LÓGICA DE BOTONES */}
                              {(item.status === 'CONFIRMED' || item.status === 'WAITING_ROOM') && (
                                <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                                    <button onClick={() => handleAssignClick(item)} style={{cursor:'pointer', backgroundColor:'#1976d2', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px'}}>
                                        🛏️ Asignar
                                    </button>
                                    {/* BOTÓN CANCELAR */}
                                    <button onClick={() => handleCancelReservation(item.id)} style={{cursor:'pointer', backgroundColor:'#d32f2f', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px'}} title="Cancelar Reserva">
                                        ✖
                                    </button>
                                </div>
                            )}

                              {item.status === 'CHECKED_IN' && (
                                  <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
            
            {/* BOTÓN EXTENDER (NUEVO) */}
            <button 
                onClick={() => setShowExtension(item.raw)} // Pasamos el objeto original (raw)
                title="Extender Estadía"
                style={{cursor:'pointer', backgroundColor:'#E3F2FD', border:'1px solid #2196F3', padding:'5px', borderRadius:'4px', color:'#1565C0', fontWeight:'bold'}}
            >
                📅
            </button>

            {/* BOTÓN CUENTA */}
            {/* BOTÓN CUENTA INTELIGENTE */}
            <button 
                onClick={() => {
                    // LÓGICA DE DECISIÓN:
                    if (item.groupEventId) {
                        // Si pertenece a un grupo -> Abrir Cuenta Maestra
                        setShowBilling({ groupId: item.groupEventId });
                    } else {
                        // Si es individual -> Abrir Cuenta de la Reserva
                        setShowBilling({ reservationId: item.id });
                    }
                }} 
                title={item.groupEventId ? "Cuenta Maestra Delegación" : "Cuenta Personal"} 
                style={{
                    cursor: 'pointer', 
                    // Estilo Amarillo para Grupos, Blanco para Individuales
                    backgroundColor: item.groupEventId ? '#FFF3E0' : '#fff', 
                    border: item.groupEventId ? '1px solid #FF9800' : '1px solid #ccc', 
                    padding: '5px', 
                    borderRadius: '4px', 
                    fontWeight: 'bold', 
                    color: item.groupEventId ? '#E65100' : '#333'
                        }}
                    >
                        {/* Icono Ticket para Grupo, Dólar para Individual */}
                        {item.groupEventId ? '🎫' : '💲'}
                    </button>
                        
                        {/* BOTÓN SALIDA */}
                        <button onClick={() => handleCheckOut(item.id)} title="Salida" style={{cursor:'pointer', backgroundColor:'#d32f2f', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px'}}>🏃</button>
                    </div>
                              )}
                          </td>
                      </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:'20px', color:'#999'}}>No hay registros.</td></tr>}
              </tbody>
          </table>
      </div>

      {/* MODALES */}
      {showRoomSelector && (
          <RoomSelectorModal 
              title={`Asignar habitación a ${showRoomSelector.guestName}`}
              onClose={() => setShowRoomSelector(null)}
              onSelect={onRoomSelected}
          />
      )}
      
      {showBilling && (
          <BillingModal 
            reservationId={showBilling.reservationId} 
            groupId={showBilling.groupId} 
            onClose={() => setShowBilling(null)} 
          />
      )}

        {showExtension && (
          <ExtensionModal 
              reservation={showExtension}
              onClose={() => setShowExtension(null)}
              onSuccess={() => {
                 loadData(); // Recargar datos para ver la nueva fecha
                 if (onUpdate) onUpdate();
              }}
          />
      )}

    </div>
  );
}

export default UnifiedGuestManager;