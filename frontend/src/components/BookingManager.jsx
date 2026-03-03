import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRooms } from '../services/roomService';
import { createGuest } from '../services/guestService';
import BillingModal from './BillingModal';
import AddGuestToGroupModal from './AddGuestToGroupModal';
import EditGroupModal from './EditGroupModal';

function BookingManager({ onUpdate }) {
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  
  // MODALES
  const [addingToEvent, setAddingToEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  
  // ESTADO MEJORADO PARA CUENTA MAESTRA (Guarda ID y Nombre Responsable)
  const [masterFolioProps, setMasterFolioProps] = useState(null); 

  const [formData, setFormData] = useState({
    name: '', contactName: '', startDate: '', endDate: '', 
    expectedGuests: '', // <--- CAMPO MANUAL
    requirements: [] 
  });
  
  const loadData = async () => {
    try {
      const rData = await getRooms();
      const typesMap = new Map();
      rData.forEach(r => { if(r.RoomType) typesMap.set(r.RoomType.id, r.RoomType); });
      setRoomTypes(Array.from(typesMap.values()));

      const eData = await axios.get('http://localhost:8080/api/guests/groups');
      setEvents(eData.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const addRequirement = () => setFormData({ ...formData, requirements: [...formData.requirements, { typeId: '', qty: 1 }] });
  
  const updateRequirement = (index, field, value) => {
    const updated = [...formData.requirements];
    updated[index][field] = value;
    setFormData({ ...formData, requirements: updated });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Usamos el valor manual o calculamos un estimado si está vacío
      const calcGuests = formData.requirements.reduce((acc, curr) => acc + parseInt(curr.qty || 0), 0) * 2;
      const finalGuests = formData.expectedGuests || calcGuests;

      await axios.post('http://localhost:8080/api/guests/groups', { 
          ...formData, 
          expectedGuests: finalGuests 
      });
      
      alert("✅ Expediente de Reserva creado.");
      setShowCreate(false);
      setFormData({ name: '', contactName: '', startDate: '', endDate: '', expectedGuests: '', requirements: [] });
      loadData();
    } catch (e) { alert("Error: " + e.message); }
  };

  const copyLink = (code) => {
    const tenantId = axios.defaults.headers.common['x-tenant-id'];
    const hotelId = axios.defaults.headers.common['x-hotel-id'];
    const link = `${window.location.origin}/registro-grupo?code=${code}&tid=${tenantId}&hid=${hotelId}`;
    navigator.clipboard.writeText(link);
    alert("Enlace copiado.");
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
        <h3 style={{margin:0, color:'#1565c0'}}>📂 Expedientes de Reserva</h3>
        <button onClick={() => setShowCreate(!showCreate)} style={{backgroundColor:'#1565c0', color:'white', border:'none', padding:'8px 15px', borderRadius:'4px', cursor:'pointer'}}>
            {showCreate ? 'Cancelar' : '+ Nuevo Expediente'}
        </button>
      </div>

      {showCreate && (
        <div style={{backgroundColor:'#f5f5f5', padding:'15px', borderRadius:'8px', marginBottom:'20px', border:'1px solid #ccc'}}>
             <h4>Nueva Solicitud</h4>
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'10px'}}>
                <input placeholder="Nombre Referencia (ej. Empresa X)" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                <input placeholder="Encargado (Pagador)" value={formData.contactName} onChange={e=>setFormData({...formData, contactName:e.target.value})} />
                <input type="date" value={formData.startDate} onChange={e=>setFormData({...formData, startDate:e.target.value})} />
                <input type="date" value={formData.endDate} onChange={e=>setFormData({...formData, endDate:e.target.value})} />
                {/* CAMPO DE CANTIDAD EXPLICITO */}
                <input type="number" placeholder="Total Personas Esperadas" value={formData.expectedGuests} onChange={e=>setFormData({...formData, expectedGuests:e.target.value})} style={{border:'2px solid #2E7D32'}} />
            </div>
            
            <div style={{backgroundColor:'white', padding:'10px', borderRadius:'5px'}}>
                <p style={{margin:'0 0 5px 0', fontSize:'0.9em', fontWeight:'bold'}}>Requerimientos de Habitaciones:</p>
                {formData.requirements.map((req, i) => (
                    <div key={i} style={{display:'flex', gap:'5px', marginBottom:'5px'}}>
                        <input type="number" placeholder="Cant." value={req.qty} onChange={e=>updateRequirement(i, 'qty', e.target.value)} style={{width:'60px'}} />
                        <select value={req.typeId} onChange={e=>updateRequirement(i, 'typeId', e.target.value)}>
                            <option value="">Tipo...</option>
                            {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                ))}
                <button onClick={addRequirement} style={{fontSize:'0.8em', cursor:'pointer'}}>+ Agregar Tipo</button>
            </div>
            <button onClick={handleCreate} style={{marginTop:'10px', width:'100%', padding:'10px', backgroundColor:'green', color:'white', border:'none', cursor:'pointer'}}>Confirmar Apertura</button>
        </div>
      )}

      {/* LISTA */}
      <div>
          {events.map(ev => {
              const registered = ev.registeredCount || 0;
              const expected = ev.expectedGuests || 1;
              const progress = Math.min((registered / expected) * 100, 100);
              const isFull = registered >= expected;

              return (
              <div key={ev.id} style={{border:'1px solid #ddd', borderRadius:'5px', marginBottom:'10px', overflow:'hidden'}}>
                  <div style={{padding:'10px', backgroundColor:'#f9f9f9', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}}
                       onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                      <div style={{flex: 1}}>
                          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                              <strong style={{fontSize:'1.1em'}}>{ev.name}</strong> 
                              <span style={{fontSize:'0.8em', backgroundColor:'#e3f2fd', padding:'2px 6px', borderRadius:'4px', color:'#1565c0'}}>{ev.code}</span>
                          </div>
                          <span style={{fontSize:'0.8em', color:'#666'}}>Encargado: {ev.contactName || 'N/A'}</span>
                      </div>
                      <div style={{width:'150px', marginRight:'20px'}}>
                          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.75em'}}>
                              <span>Progreso:</span>
                              <span style={{fontWeight:'bold', color: isFull ? 'green' : 'orange'}}>{registered} / {expected} Pax</span>
                          </div>
                          <div style={{width:'100%', height:'6px', backgroundColor:'#e0e0e0', borderRadius:'3px'}}>
                              <div style={{width: `${progress}%`, height:'100%', backgroundColor: isFull ? '#4CAF50' : '#FF9800', borderRadius:'3px'}}></div>
                          </div>
                      </div>
                  </div>

                  {expandedId === ev.id && (
                      <div style={{padding:'15px', borderTop:'1px solid #ddd'}}>
                          <div style={{display:'flex', gap:'10px', marginBottom:'15px', flexWrap:'wrap', alignItems:'center'}}>
                              <button onClick={() => copyLink(ev.code)} style={{padding:'6px 12px', cursor:'pointer', border:'1px solid #ccc', background:'white', borderRadius:'4px'}}>🔗 Link</button>
                              <button onClick={() => setAddingToEvent(ev)} style={{padding:'6px 12px', cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', borderRadius:'4px'}}>👤 + Registrar</button>
                              <button onClick={() => setEditingEvent(ev)} style={{padding:'6px 12px', cursor:'pointer', backgroundColor:'#FFF', border:'1px solid #999', borderRadius:'4px'}}>✏️ Editar</button>

                              {/* PASAR NOMBRE DEL ENCARGADO AL MODAL DE COBRO */}
                              <button 
                                onClick={() => setMasterFolioProps({ groupId: ev.id, payerName: ev.contactName })} 
                                style={{padding:'6px 12px', backgroundColor:'#FF9800', color:'white', border:'none', borderRadius:'4px', marginLeft:'auto'}}
                              >
                                  💰 Cuenta Maestra
                              </button>
                          </div>

                          <table style={{width:'100%', fontSize:'0.9em', borderCollapse:'collapse'}}>
                              <thead><tr style={{textAlign:'left', borderBottom:'1px solid #ccc', backgroundColor:'#f5f5f5'}}><th style={{padding:'5px'}}>Huésped</th><th>DNI</th><th>Estado</th></tr></thead>
                              <tbody>
                                  {ev.Guests && ev.Guests.map(g => (
                                      <tr key={g.id} style={{borderBottom:'1px solid #eee'}}>
                                          <td style={{padding:'5px'}}>{g.firstName} {g.lastName}</td>
                                          <td>{g.documentId}</td>
                                          <td style={{color:'green', fontWeight:'bold'}}>Registrado</td>
                                      </tr>
                                  ))}
                                  </tbody>
                              </table>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* MODALES */}
      {masterFolioProps && (
        <BillingModal 
            groupId={masterFolioProps.groupId} 
            defaultPayer={masterFolioProps.payerName} // <--- NUEVA PROP
            onClose={() => setMasterFolioProps(null)} 
        />
      )}
      
      {addingToEvent && <AddGuestToGroupModal event={addingToEvent} onClose={() => setAddingToEvent(null)} onSuccess={() => { loadData(); if(onUpdate) onUpdate(); }} />}
      {editingEvent && <EditGroupModal event={editingEvent} onClose={() => setEditingEvent(null)} onSuccess={() => { loadData(); if(onUpdate) onUpdate(); }} />}
    </div>
  );
}

export default BookingManager;