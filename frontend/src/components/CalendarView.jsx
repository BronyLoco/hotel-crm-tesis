import { useState, useEffect } from 'react';
import { getRooms } from '../services/roomService';
import { getReservations } from '../services/reservationService';

function CalendarView() {
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  
  const [days] = useState(() => {
    const nextDays = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      nextDays.push(d.toISOString().split('T')[0]);
    }
    return nextDays;
  });

   useEffect(() => {
    // Ahora el useEffect solo se encarga de llamar a la API (Asíncrono)
    const load = async () => {
      try {
        const rData = await getRooms();
        const resData = await getReservations();
        
        // Ordenar habitaciones por número
        setRooms(rData.sort((a,b) => a.number.localeCompare(b.number)));
        
        // Filtrar solo reservas relevantes para el calendario (Activas o Futuras)
        // Omitimos las canceladas y las que ya salieron
        setReservations(resData.filter(r => r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT'));
      } catch (error) {
        console.error("Error cargando datos del calendario:", error);
      }
    };
    load();
  }, []);



  // Función para saber si una habitación está ocupada en una fecha
  const getReservationFor = (roomId, dateStr) => {
    return reservations.find(res => {
      // Comparar IDs (asegurando tipos string/int)
      if (res.assignedRoomId != roomId) return false; 
      
      // Verificar si la fecha cae en el rango
      // Rango es: CheckIn <= Fecha < CheckOut
      return dateStr >= res.checkIn && dateStr < res.checkOut;
    });
  };

   return (
    <div style={{ overflowX: 'auto', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
      <h2 style={{color: '#1565c0'}}>📅 Calendario de Ocupación (14 Días)</h2>
      
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
        <thead>
          <tr>
            <th style={{padding: '10px', border:'1px solid #ccc', backgroundColor: '#eee', position: 'sticky', left: 0, zIndex:2}}>Hab.</th>
            {days.map(day => (
              <th key={day} style={{padding: '5px', border:'1px solid #ccc', fontSize: '0.8em', minWidth: '40px', backgroundColor: '#f9f9f9'}}>
                {day.slice(5)} {/* Mostramos solo MM-DD */}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => (
            <tr key={room.id}>
              {/* Columna Fija con el número de habitación */}
              <td style={{padding: '10px', border:'1px solid #ccc', fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: 'white', zIndex:1}}>
                {room.number}
              </td>
              
              {/* Celdas de los días */}
              {days.map(day => {
                const res = getReservationFor(room.number, day);
                return (
                  <td key={day} style={{
                    border: '1px solid #ccc', 
                    backgroundColor: res ? (res.status === 'CHECKED_IN' ? '#F44336' : '#FF9800') : 'white',
                    textAlign: 'center',
                    cursor: res ? 'pointer' : 'default'
                  }} title={res ? `Reserva #${res.id} - ${res.status}` : 'Libre'}>
                    {res ? '👤' : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div style={{marginTop: '10px', fontSize: '0.8em'}}>
        <span style={{marginRight:'15px', display:'inline-block', width:'15px', height:'15px', border:'1px solid #ccc', verticalAlign:'middle'}}></span> Libre
        <span style={{marginRight:'15px', marginLeft:'15px'}}><span style={{display:'inline-block', width:'15px', height:'15px', backgroundColor:'#FF9800', verticalAlign:'middle'}}></span> Reservado (Futuro)</span>
        <span><span style={{display:'inline-block', width:'15px', height:'15px', backgroundColor:'#F44336', verticalAlign:'middle'}}></span> Ocupado (In-House)</span>
      </div>
    </div>
  );
}

export default CalendarView;