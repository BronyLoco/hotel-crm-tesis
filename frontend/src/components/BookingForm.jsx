import { useState, useEffect } from 'react';
import axios from 'axios';
import { createReservation } from '../services/reservationService';
import { getRooms } from '../services/roomService'; // Para saber tipos y precios

// Este componente permite crear reservas futuras
function BookingForm({ onReservationCreated }) {
  const [step, setStep] = useState(1);
  const [dni, setDni] = useState('');
  const [guestData, setGuestData] = useState(null);
  
  // Datos Reserva
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [roomTypes, setRoomTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [guestsCount, setGuestsCount] = useState(1);

  // Cargar Tipos de Habitación (Agrupados)
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const rooms = await getRooms();
        // Extraer tipos únicos
        const typesMap = new Map();
        rooms.forEach(r => {
            if(r.RoomType) typesMap.set(r.RoomType.id, r.RoomType);
        });
        setRoomTypes(Array.from(typesMap.values()));
      } catch (e) { console.error(e); }
    };
    loadTypes();
  }, []);

  // 1. Buscar Huésped
  const handleSearchGuest = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:8080/api/guests?documentId=${dni}`);
      if (res.data.length > 0) {
        setGuestData(res.data[0]);
        setStep(2);
      } else {
        alert("Huésped no encontrado. Por favor regístrelo primero en la Recepción o use el Wizard.");
      }
    } catch (e) { alert("Error buscando huésped"); }
  };

  // 2. Crear Reserva
  const handleCreate = async () => {
    if (!dates.checkIn || !dates.checkOut || !selectedType) return alert("Complete los datos");
    
    try {
      await createReservation({
        guestId: guestData.id,
        roomTypeId: selectedType.id,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        totalGuests: guestsCount
      });
      alert("✅ Reserva Futura Creada Exitosamente");
      setStep(1);
      setDni('');
      setGuestData(null);
      if (onReservationCreated) onReservationCreated();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #1565c0', borderRadius: '8px', backgroundColor: '#e3f2fd' }}>
      <h3 style={{margin:'0 0 10px 0', color:'#1565c0'}}>📅 Nueva Reserva Futura</h3>

      {step === 1 && (
        <form onSubmit={handleSearchGuest} style={{display:'flex', gap:'5px'}}>
          <input placeholder="Buscar DNI Cliente..." value={dni} onChange={e=>setDni(e.target.value)} required style={{flex:1, padding:'8px'}} />
          <button type="submit" style={{cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', borderRadius:'4px'}}>🔍</button>
        </form>
      )}

      {step === 2 && guestData && (
        <div>
          <p><strong>Cliente:</strong> {guestData.firstName} {guestData.lastName}</p>
          <div style={{display:'grid', gap:'10px'}}>
             <div style={{display:'flex', gap:'5px'}}>
                <div style={{flex:1}}>
                    <label style={{fontSize:'0.8em'}}>Entrada</label>
                    <input type="date" value={dates.checkIn} onChange={e=>setDates({...dates, checkIn:e.target.value})} style={{width:'100%'}} />
                </div>
                <div style={{flex:1}}>
                    <label style={{fontSize:'0.8em'}}>Salida</label>
                    <input type="date" value={dates.checkOut} onChange={e=>setDates({...dates, checkOut:e.target.value})} style={{width:'100%'}} />
                </div>
             </div>
             
             <div style={{display:'flex', gap:'5px'}}>
                 <select onChange={e => setSelectedType(roomTypes.find(t => t.id === parseInt(e.target.value)))} style={{flex:2}}>
                    <option value="">Seleccione Tipo...</option>
                    {roomTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (${t.basePrice})</option>
                    ))}
                 </select>
                 <input type="number" min="1" placeholder="Pax" value={guestsCount} onChange={e=>setGuestsCount(e.target.value)} style={{flex:1}} />
             </div>

             <button onClick={handleCreate} style={{padding:'10px', backgroundColor:'#2E7D32', color:'white', border:'none', cursor:'pointer', fontWeight:'bold'}}>
                Confirmar Reserva
             </button>
             <button onClick={()=>setStep(1)} style={{background:'none', border:'none', textDecoration:'underline', cursor:'pointer'}}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingForm;