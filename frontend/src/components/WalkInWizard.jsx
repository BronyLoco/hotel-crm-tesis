import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms, updateRoomStatus } from '../services/roomService';
import { createGuest } from '../services/guestService';
import { createReservation } from '../services/reservationService';
import { addCharge } from '../services/billingService';

// Recibimos refreshTrigger para recargar la lista si algo cambia afuera
function WalkInWizard({ onComplete, refreshTrigger }) {
  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState([]);
  
  const [dates, setDates] = useState(() => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    return {
      checkIn: today.toISOString().split('T')[0],
      checkOut: tomorrow.toISOString().split('T')[0]
    };
  });

  const [filters, setFilters] = useState({ capacity: 1, typePreference: '' });
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  const [guestsList, setGuestsList] = useState([]); 
  const [searchDNI, setSearchDNI] = useState('');
  const [currentGuest, setCurrentGuest] = useState({ 
    id: null, 
    firstName: '', 
    lastName: '', 
    documentId: '', 
    email: '',
    country: '',
    city: '',
    isVip: false 
  });
  const [isExisting, setIsExisting] = useState(false);

  // EFECTO DE RECARGA: Escucha cambios externos (refreshTrigger)
  useEffect(() => {
    const load = async () => {
      const allRooms = await getRooms();
      setRooms(allRooms.filter(r => r.status === 'AVAILABLE'));
    };
    load();
  }, [refreshTrigger]);

  const handleRoomSelect = (room) => {
    if (filters.capacity > room.maxOccupancy) return alert("Habitación muy pequeña.");
    setSelectedRoom(room);
    setStep(2);
  };

  const handleSearchDNI = async () => {
    if (!searchDNI) return;
    try {
      const res = await axios.get(`http://localhost:8080/api/guests?documentId=${searchDNI}`);
      if (res.data.length > 0) {
        const found = res.data[0];
        setCurrentGuest(found); 
        setIsExisting(true);    
        alert(found.isVip ? "🌟 ¡Cliente VIP encontrado!" : "✅ Cliente recurrente encontrado.");
      } else {
        alert("🔍 Cliente no encontrado. Llene los datos manualmente.");
        setIsExisting(false);
        setCurrentGuest({ ...currentGuest, documentId: searchDNI }); 
      }
    } catch (e) { console.error(e); }
  };

  const addGuestToList = () => {
    // 🛑 VALIDACIÓN DE CAPACIDAD
    if (guestsList.length >= selectedRoom.maxOccupancy) {
      return alert(`❌ Límite alcanzado. Esta habitación solo permite ${selectedRoom.maxOccupancy} personas.`);
    }
    const isDuplicate = guestsList.some(guest => guest.documentId === currentGuest.documentId);
    if (isDuplicate) {
      return alert("⚠️ Esta persona ya está en la lista de registro.");
    }

    if (!currentGuest.documentId || !currentGuest.firstName) return alert("Faltan datos");
    setGuestsList([...guestsList, { ...currentGuest, isExisting }]); 
    setCurrentGuest({ id: null, firstName: '', lastName: '', documentId: '', email: '', isVip: false });
    setSearchDNI('');
    setIsExisting(false);
  };

  const finishWalkIn = async () => {
    if (guestsList.length === 0) return alert("Debe registrar al menos a una persona.");

    try {
      const finalGuestIds = [];

      for (const person of guestsList) {
        if (person.isExisting && person.id) {
          finalGuestIds.push(person.id);
        } else {
          const payload = {
            ...person,
            email: person.email || null, 
            groupCode: 'WALKIN'
          };
          const newG = await createGuest(payload);
          finalGuestIds.push(newG.id);
        }
      }

      const d1 = new Date(dates.checkIn);
      const d2 = new Date(dates.checkOut);
      const diffTime = Math.abs(d2 - d1);
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 

      const pricePerPerson = parseFloat(selectedRoom.RoomType.basePrice);
      const totalCost = pricePerPerson * guestsList.length * nights;

      const resReserva = await createReservation({
        guestId: finalGuestIds[0], 
        roomTypeId: selectedRoom.RoomType.id,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        totalGuests: guestsList.length
      });
      const reservationId = resReserva.reservation.id;

      await axios.post(`http://localhost:8080/api/reservations/${reservationId}/checkin`, {
        roomNumber: selectedRoom.number
      });

      setTimeout(async () => {
          const resFolio = await axios.get(`http://localhost:8080/api/billing/reservation/${reservationId}`);
          
          await addCharge(resFolio.data.id, `Alojamiento (${nights} noches x ${guestsList.length} pers)`, totalCost);
          
          alert(`✅ Registro Exitoso.\nTotal cargado a cuenta: $${totalCost}`);
          // Reseteamos el Wizard al inicio
          setStep(1);
          setGuestsList([]);
          if (onComplete) onComplete();
      }, 1000);

    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h2 style={{color: '#1565c0'}}>🛎️ Recepción Inteligente (v2)</h2>

      {step === 1 && (
        <div>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#f5f5f5', padding: '10px' }}>
            <div>
              <label>Entrada:</label><input type="date" value={dates.checkIn} onChange={e=>setDates({...dates, checkIn:e.target.value})} />
            </div>
            <div>
              <label>Salida:</label><input type="date" value={dates.checkOut} onChange={e=>setDates({...dates, checkOut:e.target.value})} />
            </div>
            <div>
              <label>Personas:</label><input type="number" style={{width:'50px'}} value={filters.capacity} onChange={e=>setFilters({...filters, capacity:e.target.value})} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {rooms
              .filter(r => r.maxOccupancy >= filters.capacity)
              .map(room => (
              <div key={room.id} onClick={() => handleRoomSelect(room)} 
                   style={{ cursor: 'pointer', border: '2px solid #4CAF50', padding: '10px', borderRadius: '5px', width: '150px', backgroundColor: '#E8F5E9' }}>
                <h3>{room.number}</h3>
                <small>{room.RoomType.name}</small><br/>
                <strong>${room.RoomType.basePrice} / noche</strong>
              </div>
            ))}
            {rooms.length === 0 && <p>No hay habitaciones disponibles con este filtro.</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Habitación {selectedRoom.number} - Registro de Huéspedes</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              placeholder="Buscar por DNI..." 
              value={searchDNI}
              onChange={e => setSearchDNI(e.target.value)}
            />
            <button onClick={handleSearchDNI} style={{cursor:'pointer'}}>🔍 Buscar</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', backgroundColor: isExisting ? '#e8f5e9' : '#f9f9f9', padding: '10px' }}>
             <input placeholder="Nombre" value={currentGuest.firstName} onChange={e => setCurrentGuest({...currentGuest, firstName: e.target.value})} disabled={isExisting} />
             <input placeholder="Apellido" value={currentGuest.lastName} onChange={e => setCurrentGuest({...currentGuest, lastName: e.target.value})} disabled={isExisting} />
             <input placeholder="DNI / Pasaporte" value={currentGuest.documentId} onChange={e => setCurrentGuest({...currentGuest, documentId: e.target.value})} disabled={isExisting} />
             <input placeholder="País" value={currentGuest.country} onChange={e => setCurrentGuest({...currentGuest, country: e.target.value})} disabled={isExisting} />
             <input placeholder="Ciudad" value={currentGuest.city} onChange={e => setCurrentGuest({...currentGuest, city: e.target.value})} disabled={isExisting} />
             <input placeholder="Email (Opcional)" value={currentGuest.email} onChange={e => setCurrentGuest({...currentGuest, email: e.target.value})} disabled={isExisting} />

             <button onClick={addGuestToList} style={{gridColumn: 'span 2', padding:'8px', backgroundColor:'#1565c0', color:'white', border:'none', cursor:'pointer'}}>
               {isExisting ? 'Agregar Recurrente' : 'Agregar a la Lista'}
             </button>
          </div>

          <ul>
            {guestsList.map((g, i) => (
              <li key={i}>
                {g.firstName} {g.lastName} 
                {g.isVip && <span style={{color:'gold', fontWeight:'bold', marginLeft:'5px'}}>★ VIP</span>}
              </li>
            ))}
          </ul>

          <div style={{marginTop: '20px'}}>
             <button onClick={() => setStep(1)}>Atrás</button>
             <button onClick={finishWalkIn} style={{marginLeft: '10px', backgroundColor: 'green', color: 'white', padding: '10px'}}>
               Confirmar Ingreso
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalkInWizard;