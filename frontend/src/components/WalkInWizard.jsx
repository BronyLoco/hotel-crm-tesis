import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms, updateRoomStatus } from '../services/roomService';
import { createGuest } from '../services/guestService';
import { createReservation, doCheckIn } from '../services/reservationService';
import { addCharge } from '../services/billingService';
import GuestDataForm from './GuestDataForm';

function WalkInWizard({ onComplete, refreshTrigger }) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);

  // --- DATOS MODO WALKIN ---
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
  
  // Huésped Actual
  const [newGuest, setNewGuest] = useState({ 
    firstName: '', lastName: '', documentId: '', email: '', 
    country: '', city: '', nationality: '', birthDate: '', civilStatus: 'SOLTERO',
    groupCode: 'WALKIN'
  });

  // Lista temporal para multi-ocupación
  const [guestsList, setGuestsList] = useState([]);

  // CARGAS
  const loadRooms = async () => {
    try {
      const allRooms = await getRooms();
      setRooms(allRooms.filter(r => 
        r.status === 'AVAILABLE' || 
        (r.status === 'PARTIALLY_OCCUPIED' && r.currentOccupancy < r.maxOccupancy)
      ));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadRooms(); }, [refreshTrigger]);

  // --- LÓGICA DE BÚSQUEDA ---
  const handleSearchDNI = async (e) => {
    e.preventDefault();
    if (!searchDni) return;
    try {
        const res = await axios.get(`http://localhost:8080/api/guests?documentId=${searchDni}`);
        if (res.data.length > 0) {
            setNewGuest(res.data[0]); 
            setIsExisting(true); 
        } else {
            alert("🔍 Cliente no encontrado. Ingrese datos manualmente.");
            setIsExisting(false);
            setNewGuest(prev => ({ ...prev, documentId: searchDni })); 
        }
    } catch (error) { console.error(error); }
  };

  const handleResetForm = () => {
      setNewGuest({ firstName: '', lastName: '', documentId: '', email: '', country: '', city: '', nationality: '', birthDate: '', civilStatus: 'SOLTERO', groupCode: 'WALKIN' });
      setIsExisting(false);
      setSearchDni('');
  };

  // --- AGREGAR A LISTA ---
  const addGuestToList = () => {
      if (!selectedRoom) return alert("Seleccione habitación primero.");
      if (guestsList.length >= selectedRoom.maxOccupancy) return alert("Capacidad máxima alcanzada.");
      if (!newGuest.firstName || !newGuest.documentId) return alert("Faltan datos.");

      if (guestsList.some(g => g.documentId === newGuest.documentId)) return alert("Ya está en la lista.");

      setGuestsList([...guestsList, { ...newGuest, isExisting }]);
      handleResetForm();
  };

  // --- CONFIRMAR INGRESO ---
  const handleWalkInSubmit = async () => {
    if (guestsList.length === 0) return alert("Agregue al menos a una persona.");
    setLoading(true);
    try {
       const finalGuestIds = []; 

       // 1. Crear/Actualizar Huéspedes
       for (const person of guestsList) {
           if (person.isExisting && person.id) {
               finalGuestIds.push(person.id);
           } else {
               const gRes = await createGuest(person);
               finalGuestIds.push(gRes.id);
           }
       }

       // 2. Calcular Precio
       const d1 = new Date(dates.checkIn);
       const d2 = new Date(dates.checkOut);
       const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) || 1;
       const totalPrice = parseFloat(selectedRoom.RoomType.basePrice) * diffDays * guestsList.length;

       // 3. Crear Reserva
       const resRes = await createReservation({
           guestId: finalGuestIds[0], 
           roomTypeId: selectedRoom.RoomType.id,
           checkIn: dates.checkIn,
           checkOut: dates.checkOut,
           totalGuests: guestsList.length, 
           specificRoomNumber: selectedRoom.number
       });

       // 4. Check-in y Cobro
       await doCheckIn(resRes.reservation.id, selectedRoom.number);

       setTimeout(async () => {
          try {
            const resFolio = await axios.get(`http://localhost:8080/api/billing/reservation/${resRes.reservation.id}`);
            await addCharge(resFolio.data.id, `Alojamiento (${guestsList.length} pax / ${diffDays} noches)`, totalPrice);
            
            alert("✅ Ingreso Confirmado.");
            setGuestsList([]);
            setSelectedRoom(null);
            loadRooms();
            if (onComplete) onComplete();
          } catch (e) { console.error(e); }
      }, 1000);

    } catch (error) { 
        alert("Error: " + (error.response?.data?.message || error.message)); 
    } 
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
        <h3 style={{marginTop:0, color:'#1565c0', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>🚀 Walk-in (Ingreso Rápido)</h3>

        {/* 1. FECHAS */}
        <div style={{display:'flex', gap:'5px', marginBottom:'10px', backgroundColor:'#f5f5f5', padding:'8px', borderRadius:'5px'}}>
            <div style={{flex:1}}>
                <label style={{fontSize:'0.7em', fontWeight:'bold'}}>Entrada</label>
                <input type="date" value={dates.checkIn} onChange={e=>setDates({...dates, checkIn:e.target.value})} style={{width:'100%', border:'1px solid #ccc'}} />
            </div>
            <div style={{flex:1}}>
                <label style={{fontSize:'0.7em', fontWeight:'bold'}}>Salida</label>
                <input type="date" value={dates.checkOut} onChange={e=>setDates({...dates, checkOut:e.target.value})} style={{width:'100%', border:'1px solid #ccc'}} />
            </div>
            <div style={{width:'50px'}}>
                <label style={{fontSize:'0.7em', fontWeight:'bold'}}>Pax</label>
                <input type="number" min="1" value={filters.capacity} onChange={e=>setFilters({capacity:e.target.value})} style={{width:'100%', border:'1px solid #ccc'}} />
            </div>
        </div>

        {/* 2. HABITACIONES */}
        <div style={{display:'flex', gap:'5px', overflowX:'auto', marginBottom:'15px', paddingBottom:'5px'}}>
            {rooms.filter(r=>r.maxOccupancy >= filters.capacity).map(r => (
                <div key={r.id} onClick={() => setSelectedRoom(r)} 
                        style={{
                            minWidth:'70px', padding:'5px', 
                            border: selectedRoom?.id===r.id ? '2px solid #1565c0' : '1px solid #ccc', 
                            backgroundColor: selectedRoom?.id===r.id ? '#e3f2fd' : '#fff', 
                            textAlign:'center', cursor:'pointer', borderRadius:'4px'
                        }}>
                    <strong style={{fontSize:'1.1em'}}>{r.number}</strong><br/>
                    <small style={{fontSize:'0.8em'}}>${r.RoomType.basePrice}</small>
                </div>
            ))}
            {rooms.length === 0 && <span style={{fontSize:'0.8em', color:'red'}}>Sin cupos.</span>}
        </div>

        {/* 3. BUSCADOR */}
        <div style={{display:'flex', gap:'5px', marginBottom:'10px'}}>
                <input placeholder="Buscar DNI..." value={searchDni} onChange={e=>setSearchDni(e.target.value)} style={{flex:1, padding:'6px', border:'1px solid #1565c0'}} />
                <button onClick={handleSearchDNI} style={{cursor:'pointer'}}>🔍</button>
                <button onClick={handleResetForm}>❌</button>
        </div>

        {/* 4. FORMULARIO REUTILIZABLE */}
        <div style={{marginBottom:'10px'}}>
            <GuestDataForm guest={newGuest} onChange={setNewGuest} disabled={isExisting} />
        </div>
        
        <button onClick={addGuestToList} style={{width:'100%', padding:'8px', backgroundColor:'#eee', border:'1px solid #ccc', cursor:'pointer', marginBottom:'10px'}}>
            ⬇️ Agregar ({guestsList.length})
        </button>

        {/* 5. LISTA Y CONFIRMACIÓN */}
        {guestsList.length > 0 && (
            <div style={{backgroundColor:'#e8f5e9', padding:'10px', borderRadius:'5px'}}>
                <ul style={{margin:0, paddingLeft:'20px', fontSize:'0.9em'}}>
                    {guestsList.map((g, i) => <li key={i}>{g.firstName} {g.lastName}</li>)}
                </ul>
                <button 
                    onClick={handleWalkInSubmit} 
                    disabled={loading} 
                    style={{width:'100%', marginTop:'10px', padding:'12px', backgroundColor:'#2E7D32', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}
                >
                    {loading ? 'Procesando...' : '✅ CONFIRMAR INGRESO'}
                </button>
            </div>
        )}
    </div>
  );
}

export default WalkInWizard;