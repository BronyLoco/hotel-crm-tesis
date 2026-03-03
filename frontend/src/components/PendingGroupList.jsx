import { useState, useEffect } from 'react';
import axios from 'axios';
import { createReservation, doCheckIn } from '../services/reservationService';

function PendingGroupList({ refreshTrigger, onUpdate }) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar TODOS los huéspedes que tienen grupo pero NO tienen habitación asignada
  // (Esto requiere un endpoint nuevo o filtrado en cliente. Filtremos en cliente por ahora)
  const loadPending = async () => {
    try {
        // Pedimos todos los huéspedes del hotel
        // Idealmente: GET /guests?hasRoom=false
        // Tesis Hack: Pedimos todos y filtramos los que tengan groupCode y NO tengan reservas activas?
        // Mejor: Usamos el endpoint de eventos y aplanamos la lista.
        const resEvents = await axios.get('http://localhost:8080/api/guests/groups'); // getGroupEvents
        const events = resEvents.data;
        
        let allPending = [];
        
        // Buscamos quiénes NO tienen habitación (esto es una simulación visual)
        // En un sistema real, el Guest tendría un estado. 
        // Aquí asumimos que si están en la lista del evento, están pendientes hasta que desaparecen
        // Pero como no tenemos ese campo, vamos a mostrar simplemente los miembros de eventos activos.
        
        events.forEach(ev => {
             if(ev.Guests) {
                 ev.Guests.forEach(g => {
                     // Solo agregamos si queremos mostrarlos. 
                     // Como no tenemos forma fácil de saber si ya tiene cuarto sin consultar reservas,
                     // mostraremos todos los del grupo para "Gestión Rápida".
                     allPending.push({ ...g, eventName: ev.name });
                 });
             }
        });

        setPendingMembers(allPending);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadPending(); }, [refreshTrigger]);

  const handleQuickAssign = async (member) => {
    const room = prompt(`Asignar habitación para ${member.firstName}:`);
    if(!room) return;
    const type = prompt("Tipo (1,2,3):", "2");
    
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        const tmrw = new Date(Date.now()+86400000).toISOString().split('T')[0];
        
        const res = await createReservation({
            guestId: member.id, roomTypeId: parseInt(type), checkIn: today, checkOut: tmrw, totalGuests: 1
        });
        await doCheckIn(res.reservation.id, room);
        
        alert("✅ Asignado.");
        if(onUpdate) onUpdate();
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  if (pendingMembers.length === 0) return null;

  return (
    <div style={{marginTop:'20px', border:'1px solid #FF9800', borderRadius:'5px', padding:'10px', backgroundColor:'#fff3e0'}}>
        <h4 style={{margin:'0 0 10px 0', color:'#E65100'}}>🚌 Miembros de Delegación (Llegadas)</h4>
        <ul style={{listStyle:'none', padding:0, maxHeight:'200px', overflowY:'auto'}}>
            {pendingMembers.map(m => (
                <li key={m.id} style={{display:'flex', justifyContent:'space-between', padding:'5px', borderBottom:'1px solid #ffcc80'}}>
                    <span>{m.firstName} {m.lastName} <small>({m.eventName})</small></span>
                    <button disabled={loading} onClick={() => handleQuickAssign(m)} style={{cursor:'pointer'}}>➡️ Cama</button>
                </li>
            ))}
        </ul>
    </div>
  );
}

export default PendingGroupList;