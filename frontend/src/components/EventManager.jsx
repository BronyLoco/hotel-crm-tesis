import { useState, useEffect, Fragment } from 'react';
import { createGroupEvent, getGroupEvents } from '../services/guestService';
import axios from 'axios';
import { createFolio } from '../services/billingService';
import BillingModal from './BillingModal';
import EditGroupModal from './EditGroupModal';

function EventManager( { onUpdate }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', expectedGuests: '' });
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [selectedGroupFolio, setSelectedGroupFolio] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  // Función externa para cargar
  const loadEvents = async () => {
    try {
      const data = await getGroupEvents();
      setEvents(data);
    } catch (error) { console.error(error); }
  };

  // Efecto limpio
  useEffect(() => { 
    loadEvents(); 
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createGroupEvent(formData);
      alert("✅ Evento creado.");
      setShowCreate(false);
      setFormData({ name: '', code: '', expectedGuests: '' });
      loadEvents();
    } catch (error) {
      alert("Error: " + (error.response?.data?.error || error.message));
    }
  };
  const handleEdit = async (ev) => {
      const newGuests = prompt("Cantidad esperada:", ev.expectedGuests);
      const newPrice = prompt("Precio Total Acordado (Cuenta Maestra):", ev.agreedPrice || 0);
      
      if (newGuests || newPrice) {
          try {
             await axios.patch(`http://localhost:8080/api/guests/groups/${ev.id}`, { 
                 expectedGuests: newGuests,
                 agreedPrice: newPrice
             });
             
             // Si pusieron precio, actualizamos el folio maestro automáticamente?
             // Sería ideal, pero por ahora solo guardamos el dato informativo.
             // El gerente puede ir a "Cuenta Maestra" y agregar el cargo manualmente.
             
             loadEvents();
          } catch(e) { alert(e.message); }
      }
  };

  const copyLink = (code) => {
    const tenantId = axios.defaults.headers.common['x-tenant-id'];
    const hotelId = axios.defaults.headers.common['x-hotel-id'];
    const link = `${window.location.origin}/registro-grupo?code=${code}&tid=${tenantId}&hid=${hotelId}`;
    navigator.clipboard.writeText(link);
    alert("Enlace copiado: " + link);
  };
const handleOpenMasterFolio = async (event) => {
      try {
          // 1. Intentar crear/obtener el folio maestro
          const res = await axios.post('http://localhost:8080/api/billing', {
              groupEventId: event.id
          });
          // 2. Abrir el modal (Necesitamos modificar BillingModal para que acepte groupEventId o pasarle el folio directo)
          // Truco: Para no reescribir BillingModal, usaremos una prop nueva 'groupMode={true}'
          setSelectedGroupFolio(event.id);
      } catch (e) { alert("Error abriendo cuenta maestra"); }
  };
  const toggleStatus = async (ev) => {
      const newState = !ev.isActive;
      try {
          await axios.patch(`http://localhost:8080/api/guests/groups/${ev.id}/status`, { isActive: newState });
          loadEvents(); // Recargar para ver el cambio visual
      } catch (e) { alert("Error cambiando estado"); }
  };

  const handleDeleteMember = async (guestId, guestName) => {
      if(!confirm(`¿Estás seguro de eliminar a ${guestName} de la lista?`)) return;
      
      try {
          await axios.delete(`http://localhost:8080/api/guests/${guestId}`);
          alert("🗑️ Eliminado.");
          loadEvents(); // Recargar lista
      } catch (e) { alert("Error al eliminar (quizás tiene reservas activas)."); }
  };
  
  return (
    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
        <h3 style={{margin:0, color:'#1565c0'}}>🚌 Delegaciones</h3>
        <button onClick={() => setShowCreate(!showCreate)} style={{cursor:'pointer', padding:'5px 10px'}}>{showCreate ? '-' : '+'}</button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{marginBottom:'20px', padding:'10px', backgroundColor:'#f0f9ff', borderRadius:'5px'}}>
          <div style={{display:'flex', gap:'10px'}}>
             <input placeholder="Nombre" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required style={{padding:'5px'}} />
             <input placeholder="Código" value={formData.code} onChange={e=>setFormData({...formData, code:e.target.value})} required style={{padding:'5px'}} />
             <input type="number" placeholder="Cant." value={formData.expectedGuests} onChange={e=>setFormData({...formData, expectedGuests:e.target.value})} style={{padding:'5px', width:'60px'}} />
             <button type="submit" style={{backgroundColor:'#1565c0', color:'white', border:'none', cursor:'pointer', padding:'5px 10px'}}>Guardar</button>
          </div>
        </form>
      )}

      <table style={{width:'100%', fontSize:'0.9em', borderCollapse:'collapse'}}>
        <thead>
            <tr style={{textAlign:'left', backgroundColor:'#eee'}}>
                <th style={{padding:'5px'}}>Código</th>
                <th>Nombre</th>
                <th>Progreso</th>
                <th>Acción</th>
            </tr>
        </thead>
        <tbody>
            {events.map(ev => (
                <Fragment key={ev.id}>
                    <tr style={{borderBottom:'1px solid #eee', backgroundColor: expandedEventId===ev.id ? '#f9f9f9': 'white'}}>
                        <td style={{fontWeight:'bold', color:'#1565c0'}}>{ev.code}</td>
                        <td>{ev.name}
                            {ev.isActive ? 
                              <span style={{color:'green', fontSize:'0.8em', marginLeft:'5px'}}>● Abierto</span> : 
                              <span style={{color:'red', fontSize:'0.8em', marginLeft:'5px'}}>🔒 Cerrado</span>
                            }
                        </td>
                        <td>
                            {ev.registeredCount} / {ev.expectedGuests}
                        </td>
                        <td>
                            <button onClick={() => handleOpenMasterFolio(ev)} style={{marginRight:'5px', cursor:'pointer'}}>
                                  💰 Cuenta Maestra
                            </button>
                            <button onClick={() => copyLink(ev.code)} title="Link">🔗</button>
                            <button onClick={() => setExpandedEventId(expandedEventId === ev.id ? null : ev.id)} style={{marginLeft:'5px'}}>
                               {expandedEventId === ev.id ? '🔼' : '👥'}
                            </button>
                            <button onClick={() => setEditingEvent(ev)} title="Editar Detalles" style={{marginRight:'5px', cursor:'pointer'}}>✏️</button>
                            <button onClick={() => toggleStatus(ev)} title={ev.isActive ? "Cerrar Registro" : "Abrir Registro"} style={{cursor:'pointer', marginRight:'5px'}}>
                            {ev.isActive ? '🔒' : '🔓'}
                        </button>
                        </td>
                    </tr>
                    {expandedEventId === ev.id && (
                        <tr>
                            <td colSpan="4" style={{padding:'5px 10px', backgroundColor:'#f0f4c3', fontSize:'0.85em'}}>
                                <strong>Miembros ({ev.Guests ? ev.Guests.length : 0}):</strong>
                                <ul style={{margin:'5px 0', paddingLeft:'20px'}}>
                                    {ev.Guests && ev.Guests.map(g => (
                                        <li key={g.id} style={{display:'flex', justifyContent:'space-between', width:'300px'}}>
                                            <span>{g.firstName} {g.lastName}</span>
                                            <button 
                                                onClick={() => handleDeleteMember(g.id, g.firstName)}
                                                style={{border:'none', background:'none', cursor:'pointer'}}
                                                title="Expulsar de la lista"
                                            >
                                                ❌
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    )}
                </Fragment>
                
            ))}
        </tbody>
      </table>
       {/* MODAL DE EDICIÓN */}
      {editingEvent && (
        <EditGroupModal 
            event={editingEvent} 
            onClose={() => setEditingEvent(null)} 
            onSuccess={loadEvents} 
        />
      )}

      {selectedGroupFolio && (
        <BillingModal
        groupId={selectedGroupFolio}
        onClose={() => setSelectedGroupFolio(null)}
        onPaymentSuccess={() => {
          if (onUpdate) onUpdate(); 
       }}
      />
   )}
    </div>
  );
}

export default EventManager;