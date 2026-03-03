import { useState, useEffect } from 'react'; // Quitamos useCallback
import axios from 'axios';
import { getRooms, updateRoomStatus } from '../services/roomService';
import { createGuest, getGuestsByGroup } from '../services/guestService';
import { createReservation, getPendingArrivals, doCheckIn } from '../services/reservationService';
import { addCharge } from '../services/billingService';
import GuestDataForm from './GuestDataForm';

function WalkInWizard({ onComplete, refreshTrigger }) {
  const [mode, setMode] = useState('walkin'); 
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  // --- DATOS MODO WALKIN ---
  // Inicialización perezosa de fechas (Correcto para el linter)
  const [dates, setDates] = useState(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    return {
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0]
    };
  });

  const [filters, setFilters] = useState({ capacity: 1 });
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Estados Búsqueda
  const [searchDni, setSearchDni] = useState('');
  const [isExisting, setIsExisting] = useState(false);
  
  // Lista de huéspedes temporal
  const [guestsList, setGuestsList] = useState([]);
  const [newGuest, setNewGuest] = useState({ 
    firstName: '',
    lastName: '',
    documentId: '', 
    email: '', 
    country: '', 
    city: '',
    nationality: '',
    birthDate: '',
    civilStatus: 'SOLTERO' 
  });

  // --- DATOS MODO RESERVA ---
  const [pendingReservations, setPendingReservations] = useState([]);

  // --- DATOS MODO GRUPO ---
  const [groupCode, setGroupCode] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);

  // ==========================================
  // FUNCIONES DE CARGA
  // ==========================================
  
  const loadRooms = async () => {
    try {
      const allRooms = await getRooms();
      // Mostrar Disponibles O Parcialmente Ocupadas con espacio
      setRooms(allRooms.filter(r => 
        r.status === 'AVAILABLE' || 
        (r.status === 'PARTIALLY_OCCUPIED' && r.currentOccupancy < r.maxOccupancy)
      ));
    } catch (e) { console.error(e); }
  };

  const loadArrivals = async () => {
    try {
      const data = await getPendingArrivals();
      setPendingReservations(data);
    } catch (e) { console.error(e); }
  };

  // Efecto Unificado
  useEffect(() => {
    if (mode === 'reservation') {
        loadArrivals();
    } else if (mode === 'walkin') {
        loadRooms();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, refreshTrigger]); 


  // ==========================================
  // LÓGICA 1: BÚSQUEDA Y AGREGADO (Walk-in)
  // ==========================================

  const handleSearchDNI = async () => {
    if (!searchDni) return;
    try {
        const res = await axios.get(`http://localhost:8080/api/guests?documentId=${searchDni}`);
        if (res.data.length > 0) {
            const found = res.data[0];
            setNewGuest(found); 
            setIsExisting(true); 
        } else {
            alert("🔍 Cliente no encontrado.");
            setIsExisting(false);
            setNewGuest(prev => ({ ...prev, documentId: searchDni })); 
        }
    } catch (error) { console.error(error); }
  };

 const handleResetForm = () => {
    setNewGuest({ 
        firstName: '', 
        lastName: '', 
        documentId: '', 
        email: '', 
        country: '', 
        city: '', 
        nationality: '', 
        birthDate: '', 
        civilStatus: 'SOLTERO' 
    });
      setIsExisting(false);
      setSearchDni('');
  };

  // Función que faltaba: AGREGAR A LA LISTA
  const addGuestToList = () => {
      // Validaciones
      if (!selectedRoom) return alert("Seleccione habitación primero.");
      if (guestsList.length >= selectedRoom.maxOccupancy) return alert("Capacidad máxima alcanzada.");
      if (!newGuest.firstName || !newGuest.documentId) return alert("Faltan datos (Nombre o DNI).");

      // Validar duplicados en la lista
      if (guestsList.some(g => g.documentId === newGuest.documentId)) {
          return alert("Esta persona ya está en la lista.");
      }

      setGuestsList([...guestsList, { ...newGuest, isExisting }]);
      
      // Limpiar formulario para el siguiente
      handleResetForm();
  };

  // ==========================================
  // LÓGICA 2: WALK-IN SUBMIT
  // ==========================================
  const handleWalkInSubmit = async () => {
    if (!selectedRoom) return alert("Seleccione habitación.");
    if (guestsList.length === 0) return alert("Agregue al menos a una persona.");

    setLoading(true);
    try {
       const finalGuestIds = []; 

       // 1. Procesar Huéspedes (Crear o Reusar)
       for (const person of guestsList) {
           if (person.isExisting && person.id) {
               finalGuestIds.push(person.id);
           } else {
               const gRes = await createGuest({
                   ...person, 
                   email: person.email || null,
                   groupCode: 'WALKIN'
               });
               finalGuestIds.push(gRes.id);
           }
       }

       // 2. Calcular Precio
       const d1 = new Date(dates.checkIn);
       const d2 = new Date(dates.checkOut);
       const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) || 1;
       const totalPrice = parseFloat(selectedRoom.RoomType.basePrice) * diffDays * guestsList.length;

       // 3. Crear Reserva (Titular es el primero)
       const resRes = await createReservation({
           guestId: finalGuestIds[0], 
           roomTypeId: selectedRoom.RoomType.id,
           checkIn: dates.checkIn,
           checkOut: dates.checkOut,
           totalGuests: guestsList.length, 
           specificRoomNumber: selectedRoom.number
       });

       // 4. Check-in y Cobro
       await processCheckIn(resRes.reservation.id, selectedRoom.number, guestsList.length, totalPrice);
       
       // Limpiar todo
       setGuestsList([]);
       handleResetForm();
       setSelectedRoom(null);
       loadRooms(); // Recarga local

    } catch (error) { 
        alert("Error: " + (error.response?.data?.message || error.message)); 
    } 
    setLoading(false);
  };

  // ==========================================
  // LÓGICA 3: CHECK-IN RESERVA PREVIA
  // ==========================================
  const handleReservationCheckIn = async (reservation) => {
    const roomNumber = prompt(`Asignar habitación para reserva #${reservation.id}:`);
    if (!roomNumber) return;
    
    setLoading(true);
    try {
        await processCheckIn(reservation.id, roomNumber, reservation.totalGuests, 50); 
        loadArrivals(); 
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  // ==========================================
  // LÓGICA 4: GRUPOS
  // ==========================================
  const searchGroup = async (e) => {
      e.preventDefault();
      try {
          const data = await getGuestsByGroup(groupCode.toUpperCase());
          setGroupMembers(data);
          if(data.length === 0) alert("No se encontraron miembros.");
      } catch (e) { alert("Error buscando grupo"); }
  };

  const assignGroupMember = async (member) => {
      const roomNumber = prompt(`Habitación para ${member.firstName}:`);
      if(!roomNumber) return;
      const typeId = prompt("Tipo habitación ID (1, 2...):", "2");

      setLoading(true);
      try {
          // Fechas limpias
          const dateObj = new Date();
          const today = dateObj.toISOString().split('T')[0];
          dateObj.setDate(dateObj.getDate() + 1);
          const tomorrow = dateObj.toISOString().split('T')[0];
          
          const resRes = await createReservation({
              guestId: member.id,
              roomTypeId: parseInt(typeId),
              checkIn: today,
              checkOut: tomorrow,
              totalGuests: 1,
              groupEventId: member.groupEventId, // Importante para cuenta maestra
              specificRoomNumber: roomNumber
          });
          await processCheckIn(resRes.reservation.id, roomNumber, 1, 0); // Precio 0
          setGroupMembers(groupMembers.filter(m => m.id !== member.id));
      } catch (e) { alert(e.message); }
      setLoading(false);
  };

  // ==========================================
  // PROCESO COMÚN
  // ==========================================
  const processCheckIn = async (reservationId, roomNumber, guestsCount, price) => {
      await doCheckIn(reservationId, roomNumber);
      setTimeout(async () => {
          try {
            const resFolio = await axios.get(`http://localhost:8080/api/billing/reservation/${reservationId}`);
            if (price > 0) {
                await addCharge(resFolio.data.id, `Alojamiento (${guestsCount} pax)`, price);
            }
            alert("✅ Ingreso Confirmado.");
            if (onComplete) onComplete();
          } catch (e) { console.error(e); }
      }, 1000);
  };


  // --- RENDER ---
  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* TABS */}
      <div style={{ display: 'flex', backgroundColor: '#eee', borderBottom: '1px solid #ccc' }}>
        <button onClick={() => setMode('walkin')} style={{flex:1, padding:'10px', border:'none', background: mode==='walkin'?'white':'#eee', fontWeight:'bold', cursor:'pointer'}}>🚶 Walk-in</button>
        <button onClick={() => setMode('reservation')} style={{flex:1, padding:'10px', border:'none', background: mode==='reservation'?'white':'#eee', fontWeight:'bold', cursor:'pointer'}}>📅 Llegadas ({pendingReservations.length})</button>
        <button onClick={() => setMode('group')} style={{flex:1, padding:'10px', border:'none', background: mode==='group'?'white':'#eee', fontWeight:'bold', cursor:'pointer'}}>🚌 Grupos</button>
      </div>

      <div style={{ padding: '15px' }}>
        
        {/* MODO WALKIN */}
        {mode === 'walkin' && (
            <div>
                {/* Fechas y Pax */}
                <div style={{display:'flex', gap:'10px', marginBottom:'15px', backgroundColor:'#f5f5f5', padding:'10px', borderRadius:'5px'}}>
                    <div>
                        <label style={{fontSize:'0.8em', display:'block'}}>Entrada:</label>
                        <input type="date" value={dates.checkIn} onChange={e=>setDates({...dates, checkIn:e.target.value})} style={{border:'1px solid #ccc', padding:'5px'}} />
                    </div>
                    <div>
                        <label style={{fontSize:'0.8em', display:'block'}}>Salida:</label>
                        <input type="date" value={dates.checkOut} onChange={e=>setDates({...dates, checkOut:e.target.value})} style={{border:'1px solid #ccc', padding:'5px'}} />
                    </div>
                    <div>
                        <label style={{fontSize:'0.8em', display:'block'}}>Pax:</label>
                        <input type="number" min="1" style={{width:'50px', padding:'5px'}} value={filters.capacity} onChange={e=>setFilters({capacity:e.target.value})} />
                    </div>
                </div>

                {/* Selector de Habitación */}
                <p style={{fontSize:'0.8em', marginBottom:'5px', fontWeight:'bold'}}>Seleccione Habitación:</p>
                <div style={{display:'flex', gap:'5px', overflowX:'auto', paddingBottom:'10px', marginBottom:'10px'}}>
                    {rooms.filter(r=>r.maxOccupancy >= filters.capacity).map(r => (
                        <div key={r.id} onClick={() => setSelectedRoom(r)} 
                             style={{
                                minWidth:'80px', 
                                padding:'5px', 
                                border: selectedRoom?.id===r.id ? '2px solid #1565c0' : '1px solid #ccc', 
                                backgroundColor: selectedRoom?.id===r.id ? '#1565c0' : (r.status === 'PARTIALLY_OCCUPIED' ? '#E3F2FD' : '#f9f9f9'),
                                color: selectedRoom?.id===r.id ? 'white' : 'black', 
                                textAlign:'center',
                                cursor:'pointer'
                             }}>
                            <strong>{r.number}</strong><br/>
                            <small>${r.RoomType.basePrice}</small><br/>
                            {/* Mostrar cupos restantes */}
                            <span style={{fontSize:'0.7em', color: r.status === 'PARTIALLY_OCCUPIED' ? '#D32F2F' : 'green'}}>
                                {r.status === 'PARTIALLY_OCCUPIED' ? `Libres: ${r.maxOccupancy - r.currentOccupancy}` : 'Libre'}
                            </span>
                        </div>
                    ))}
                    {rooms.length === 0 && <span style={{fontSize:'0.8em', color:'red'}}>No hay habitaciones</span>}
                </div>

                {/* Buscador */}
                <div style={{display:'flex', gap:'5px', marginBottom:'10px', alignItems:'flex-end'}}>
                     <div style={{flex:1}}>
                        <label style={{fontSize:'0.8em', fontWeight:'bold'}}>Buscar Cliente:</label>
                        <input placeholder="Ingrese DNI..." value={searchDni} onChange={e=>setSearchDni(e.target.value)} style={{width:'100%', padding:'8px', border:'1px solid #1565c0'}} />
                     </div>
                     <button onClick={handleSearchDNI} style={{padding:'9px', backgroundColor:'#1565c0', color:'white', border:'none', cursor:'pointer'}}>🔍</button>
                     <button onClick={handleResetForm} style={{padding:'9px', backgroundColor:'#666', color:'white', border:'none', cursor:'pointer'}}>❌</button>
                </div>

                {/* FORMULARIO */}
                <div style={{marginBottom:'15px'}}>
                    <GuestDataForm 
                        guest={newGuest} 
                        onChange={setNewGuest} 
                        disabled={isExisting} 
                    />
                </div>
                
                <button onClick={addGuestToList} style={{width:'100%', marginBottom:'15px', backgroundColor:'#eee', border:'1px solid #ccc', padding:'5px', cursor:'pointer'}}>
                    ⬇️ Agregar a la Lista
                </button>

                {/* Lista Acumulada */}
                <ul style={{backgroundColor:'#fff3e0', padding:'10px', listStyle:'none', marginBottom:'10px'}}>
                    {guestsList.map((g, i) => <li key={i} style={{marginBottom:'5px'}}>👤 {g.firstName} {g.lastName}</li>)}
                    {guestsList.length === 0 && <li style={{color:'#999'}}>Lista vacía</li>}
                </ul>

                <button 
                   onClick={handleWalkInSubmit} 
                   disabled={loading || guestsList.length === 0} 
                   style={{width:'100%', padding:'12px', backgroundColor: '#1565c0', color:'white', border:'none', cursor:'pointer', opacity: loading ? 0.7 : 1}}
                >
                  {loading ? '...' : `Confirmar Ingreso (${guestsList.length} pax)`}
                </button>
            </div>
        )}

        {/* ... MODO RESERVATION Y GROUP ... (Ya estaban bien) */}
        {mode === 'reservation' && (
            <div>
                <h4>Próximas Llegadas</h4>
                <ul style={{padding:0, listStyle:'none', maxHeight:'300px', overflowY:'auto'}}>
                    {pendingReservations.map(res => (
                        <li key={res.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px', borderBottom:'1px solid #eee'}}>
                            <div>
                                <strong>Reserva #{res.id}</strong> <br/>
                                <small>Pers: {res.totalGuests} | Salida: {res.checkOut}</small>
                            </div>
                            <button onClick={() => handleReservationCheckIn(res)} style={{backgroundColor:'#4CAF50', color:'white', border:'none', padding:'8px 12px', borderRadius:'4px', cursor:'pointer'}}>Ingresar 🔑</button>
                        </li>
                    ))}
                    {pendingReservations.length === 0 && <p style={{color:'#999', fontStyle:'italic'}}>No hay llegadas pendientes.</p>}
                </ul>
            </div>
        )}

        {mode === 'group' && (
            <div>
                <h4>Recepción de Delegación</h4>
                <form onSubmit={searchGroup} style={{display:'flex', gap:'5px', marginBottom:'15px'}}>
                    <input placeholder="Código de Grupo (Ej. SANMATEO)" value={groupCode} onChange={e=>setGroupCode(e.target.value)} style={{flex:1, padding:'8px'}} />
                    <button type="submit" style={{padding:'8px 15px', cursor:'pointer'}}>🔍 Buscar</button>
                </form>
                <ul style={{padding:0, listStyle:'none', maxHeight:'300px', overflowY:'auto'}}>
                    {groupMembers.map(m => (
                        <li key={m.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px', borderBottom:'1px solid #eee'}}>
                            <span><strong>{m.firstName} {m.lastName}</strong> <br/><small>{m.documentId}</small></span>
                            <button onClick={() => assignGroupMember(m)} style={{fontSize:'0.8em', cursor:'pointer', padding:'5px', backgroundColor:'#e3f2fd', border:'1px solid #1565c0', borderRadius:'4px'}}>➡️ Asignar Cama</button>
                        </li>
                    ))}
                </ul>
            </div>
        )}

      </div>
    </div>
  );
}

export default WalkInWizard;