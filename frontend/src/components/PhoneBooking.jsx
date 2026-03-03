import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms } from '../services/roomService';
import { createReservation } from '../services/reservationService';
import { createGuest } from '../services/guestService';

function PhoneBooking({ onReservationCreated }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    adults: 1
  });

  const [guestDni, setGuestDni] = useState('');
  const [guestData, setGuestData] = useState({ firstName: '', lastName: '', documentId: '', phone: '' });
  const [isExisting, setIsExisting] = useState(false);

  // Inventario
  const [roomTypesAvailability, setRoomTypesAvailability] = useState([]);
  const [selectedType, setSelectedType] = useState(null); // Guardamos el TIPO, no la habitación

  // PASO 1: VER DISPONIBILIDAD POR TIPO
  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const allRooms = await getRooms();
        
        // Agrupar habitaciones por tipo
        const typesMap = {};
        
        allRooms.forEach(room => {
            const tId = room.RoomType.id;
            if (!typesMap[tId]) {
                typesMap[tId] = { 
                    ...room.RoomType, 
                    count: 0, 
                    capacity: room.maxOccupancy 
                };
            }
            // Aquí deberíamos cruzar con reservas existentes para saber la disponibilidad real (backend logic).
            // Por ahora visualizaremos el total físico.
            typesMap[tId].count++;
        });

        // Filtrar por capacidad solicitada
        const viableTypes = Object.values(typesMap).filter(t => t.capacity >= bookingData.adults);
        
        if (viableTypes.length === 0) alert("No hay tipos de habitación con esa capacidad.");
        
        setRoomTypesAvailability(viableTypes);
        if(viableTypes.length > 0) setStep(2);

    } catch (e) { alert("Error consultando disponibilidad"); }
    setLoading(false);
  };

  const handleSelectType = (type) => {
      setSelectedType(type);
      setStep(3); // Ir a datos del cliente
  };

  // PASO 3: CONFIRMAR RESERVA FLOTANTE
  const handleConfirm = async () => {
      if(!selectedType) return;
      setLoading(true);
      try {
          let guestId = guestData.id;
          if(!isExisting) {
              const newG = await createGuest({ ...guestData, groupCode: 'PHONE' });
              guestId = newG.id;
          }

          await createReservation({
              guestId,
              roomTypeId: selectedType.id,
              checkIn: bookingData.checkIn,
              checkOut: bookingData.checkOut,
              totalGuests: bookingData.adults,
              specificRoomNumber: null // <--- IMPORTANTE: Se va sin asignar (Flotante)
          });

          alert("✅ Reserva guardada en la Libreta (Sin habitación asignada).");
          
          setStep(1);
          setGuestData({ firstName: '', lastName: '', documentId: '', phone: '' });
          if(onReservationCreated) onReservationCreated();

      } catch (e) {
          alert("Error: " + (e.response?.data?.message || e.message));
      }
      setLoading(false);
  };

  // Buscar Cliente (Reutilizado)
  const handleSearchGuest = async () => {
      try {
          const res = await axios.get(`http://localhost:8080/api/guests?documentId=${guestDni}`);
          if(res.data.length > 0) {
              setGuestData(res.data[0]); setIsExisting(true);
          } else {
              setGuestData({ ...guestData, documentId: guestDni }); setIsExisting(false);
          }
      } catch(e) { console.error(e); }
  };

  return (
    <div style={{padding:'15px', backgroundColor:'#fff8e1', borderRadius:'8px', border:'1px solid #ffe082'}}>
        <h3 style={{marginTop:0, color:'#f57f17'}}>📞 Libro de Reservas (Telefónicas)</h3>

        {step === 1 && (
            <form onSubmit={handleCheckAvailability} style={{display:'grid', gap:'10px'}}>
                <div style={{display:'flex', gap:'5px'}}>
                    <div><label style={{fontSize:'0.8em'}}>Entrada</label><input type="date" value={bookingData.checkIn} onChange={e=>setBookingData({...bookingData, checkIn:e.target.value})} style={{width:'100%'}}/></div>
                    <div><label style={{fontSize:'0.8em'}}>Salida</label><input type="date" value={bookingData.checkOut} onChange={e=>setBookingData({...bookingData, checkOut:e.target.value})} style={{width:'100%'}}/></div>
                </div>
                <div><label style={{fontSize:'0.8em'}}>Personas</label><input type="number" min="1" value={bookingData.adults} onChange={e=>setBookingData({...bookingData, adults:e.target.value})} style={{width:'50px'}}/></div>
                <button type="submit" disabled={loading} style={{backgroundColor:'#f57f17', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Consultar</button>
            </form>
        )}

        {step === 2 && (
            <div>
                <p style={{fontSize:'0.9em'}}>Seleccione Tipo de Habitación:</p>
                <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
                    {roomTypesAvailability.map(t => (
                        <div key={t.id} onClick={() => handleSelectType(t)} 
                             style={{border:'1px solid #ccc', padding:'10px', borderRadius:'5px', cursor:'pointer', backgroundColor:'white', minWidth:'120px', textAlign:'center'}}>
                            <strong>{t.name}</strong><br/>
                            <small>${t.basePrice} / pers</small>
                        </div>
                    ))}
                </div>
                <button onClick={()=>setStep(1)} style={{marginTop:'10px', border:'none', background:'none', textDecoration:'underline', cursor:'pointer'}}>Atrás</button>
            </div>
        )}

        {step === 3 && (
            <div>
                <p><strong>{selectedType.name}</strong> ({bookingData.checkIn} - {bookingData.checkOut})</p>
                <div style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                    <input placeholder="DNI" value={guestDni} onChange={e=>setGuestDni(e.target.value)} style={{flex:1}}/>
                    <button onClick={handleSearchGuest}>🔍</button>
                </div>
                <div style={{display:'grid', gap:'5px'}}>
                    <input placeholder="Nombre" value={guestData.firstName} onChange={e=>setGuestData({...guestData, firstName:e.target.value})} disabled={isExisting}/>
                    <input placeholder="Apellido" value={guestData.lastName} onChange={e=>setGuestData({...guestData, lastName:e.target.value})} disabled={isExisting}/>
                </div>
                <div style={{marginTop:'15px', display:'flex', gap:'10px'}}>
                    <button onClick={()=>setStep(2)} style={{flex:1}}>Atrás</button>
                    <button onClick={handleConfirm} style={{flex:2, backgroundColor:'#2E7D32', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Anotar en Libro</button>
                </div>
            </div>
        )}
    </div>
  );
}

export default PhoneBooking;