import { useState, useEffect } from 'react';
import axios from 'axios';
import RoomManager from './RoomManager';
import { getAuditLogs } from '../services/auditService';
import GuestList from './GuestList'; 

// URL base
const API_URL_AUTH = 'http://localhost:8080/api/auth';
const API_URL_HOTELS = 'http://localhost:8080/api/hotels';

function SettingsPanel({ hotel, user, refreshTrigger }) {
  const [activeTab, setActiveTab] = useState('rooms');
  
  // Estados Personal
  const [myTeam, setMyTeam] = useState([]); // Lista de objetos usuario {id, name...}
  const [staffInThisHotel, setStaffInThisHotel] = useState([]); // IDs de los que están aquí
  const [newStaff, setNewStaff] = useState({ fullName: '', username: '', password: '' });
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Estados Auditoría
  const [auditLogs, setAuditLogs] = useState([]);

  // --- CARGA INICIAL ---
  useEffect(() => {
    if (activeTab === 'staff') loadStaffData();
    if (activeTab === 'audit') loadAudit();
  }, [activeTab, hotel.id]);

  const loadAudit = () => {
     getAuditLogs(hotel.id).then(setAuditLogs).catch(console.error);
  };

  // --- LÓGICA DE PERSONAL ---
  const loadStaffData = async () => {
    try {
        setLoadingStaff(true);
        // 1. ¿Quién trabaja en ESTE hotel actual?
        const resCurrent = await axios.get(`${API_URL_HOTELS}/staff?hotelId=${hotel.id}`);
        const currentIds = resCurrent.data.map(s => s.userId);
        setStaffInThisHotel(currentIds);

        // 2. ¿Quién trabaja para MÍ (Empresa) en total?
        // Necesitamos el tenantId. El usuario Manager lo tiene en su contexto o lo buscamos
        // Truco: Usamos el endpoint que creamos antes getTenantByUser si no tenemos el ID a mano
        const tenantRes = await axios.get(`http://localhost:8080/api/saas/user/${user.id}`);
        const tenantId = tenantRes.data.id;

        const resGlobalIds = await axios.get(`${API_URL_HOTELS}/staff/tenant?tenantId=${tenantId}`);
        const globalIds = resGlobalIds.data;

        // 3. Obtener Nombres de todos esos IDs (Auth Service Batch)
        if (globalIds.length > 0) {
            const resUsers = await axios.post(`${API_URL_AUTH}/batch`, { ids: globalIds });
            setMyTeam(resUsers.data);
        } else {
            setMyTeam([]);
        }

    } catch (e) { console.error(e); }
    finally { setLoadingStaff(false); }
  };

  // Asignar un empleado existente a este hotel
  const assignToHotel = async (userId) => {
      try {
          await axios.post(`${API_URL_HOTELS}/staff`, { hotelId: hotel.id, userId });
          alert("✅ Asignado a este hotel.");
          loadStaffData();
      } catch (e) { alert(e.response?.data?.message || "Error asignando"); }
  };

  // Crear nuevo empleado
  const createStaff = async (e) => {
      e.preventDefault();
      try {
          // 1. Crear usuario
          const authRes = await axios.post(`${API_URL_AUTH}/register`, {
              ...newStaff, role: 'RECEPTIONIST'
          });
          const newUserId = authRes.data.user.id;

          // 2. Asignar automáticamente a este hotel
          await axios.post(`${API_URL_HOTELS}/staff`, { hotelId: hotel.id, userId: newUserId });
          
          alert("✅ Recepcionista creado y asignado.");
          setNewStaff({ fullName: '', username: '', password: '' });
          loadStaffData();
      } catch (e) { alert("Error: " + (e.response?.data?.message || e.message)); }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', minHeight: '80vh' }}>
      <h2 style={{borderBottom:'2px solid #eee', paddingBottom:'10px', color: '#1565c0'}}>⚙️ Configuración: {hotel.name}</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('rooms')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='rooms'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='rooms'?'bold':'normal'}}>Habitaciones</button>
        <button onClick={() => setActiveTab('staff')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='staff'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='staff'?'bold':'normal'}}>Personal</button>
        <button onClick={() => setActiveTab('audit')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='audit'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='audit'?'bold':'normal'}}>Auditoría</button>
        <button onClick={() => setActiveTab('clients')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='clients'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='clients'?'bold':'normal', color: activeTab==='clients'?'#1565c0':'#333'}}>👥 Clientes (CRM)</button>
      </div>

      {/* --- PESTAÑA HABITACIONES --- */}
      {activeTab === 'rooms' && (
        <RoomManager onUpdate={() => alert("Habitación creada.")} />
      )}

      {/* --- PESTAÑA PERSONAL (RENOVADA) --- */}
      {activeTab === 'staff' && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'30px'}}>
            
            {/* IZQUIERDA: CREAR NUEVO */}
            <div style={{padding:'20px', border:'1px solid #ddd', borderRadius:'8px', height:'fit-content'}}>
                <h3 style={{marginTop:0, color:'#2E7D32'}}>✨ Contratar Nuevo</h3>
                <form onSubmit={createStaff} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                    <label>Nombre Completo</label>
                    <input value={newStaff.fullName} onChange={e=>setNewStaff({...newStaff, fullName:e.target.value})} required style={{padding:'8px', border:'1px solid #ccc'}} />
                    
                    <label>Usuario (Login)</label>
                    <input value={newStaff.username} onChange={e=>setNewStaff({...newStaff, username:e.target.value})} required style={{padding:'8px', border:'1px solid #ccc'}} autoComplete="new-username" />
                    
                    <label>Contraseña Inicial</label>
                    <input type="password" value={newStaff.password} onChange={e=>setNewStaff({...newStaff, password:e.target.value})} required style={{padding:'8px', border:'1px solid #ccc'}} autoComplete="new-password" />
                    
                    <button type="submit" style={{marginTop:'10px', padding:'10px', backgroundColor:'#2E7D32', color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>
                        Crear y Asignar
                    </button>
                </form>
            </div>

            {/* DERECHA: MI EQUIPO GLOBAL */}
            <div>
                <h3 style={{marginTop:0, color:'#1565c0'}}>👥 Mi Equipo (Toda la Cadena)</h3>
                {loadingStaff ? <p>Cargando...</p> : (
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9em'}}>
                        <thead style={{backgroundColor:'#f5f5f5'}}>
                            <tr style={{textAlign:'left'}}>
                                <th style={{padding:'10px'}}>Nombre</th>
                                <th style={{padding:'10px'}}>Usuario</th>
                                <th style={{padding:'10px'}}>Estado en {hotel.name}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myTeam.map(employee => {
                                const isAssigned = staffInThisHotel.includes(employee.id);
                                return (
                                    <tr key={employee.id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:'10px', fontWeight:'bold'}}>{employee.fullName}</td>
                                        <td style={{padding:'10px', color:'#666'}}>{employee.username}</td>
                                        <td style={{padding:'10px'}}>
                                            {isAssigned ? (
                                                <span style={{color:'green', fontWeight:'bold'}}>✅ Asignado</span>
                                            ) : (
                                                <button onClick={() => assignToHotel(employee.id)} style={{cursor:'pointer', padding:'5px 10px', backgroundColor:'#e3f2fd', border:'1px solid #1565c0', borderRadius:'4px', color:'#1565c0'}}>
                                                    + Asignar Aquí
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {myTeam.length === 0 && <tr><td colSpan="3" style={{padding:'20px', textAlign:'center', color:'#999'}}>No tienes empleados registrados aún. Crea uno a la izquierda.</td></tr>}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
      )}

      {/* --- PESTAÑA AUDITORÍA --- */}
      {activeTab === 'audit' && (
          <div>
            <h3>🕵️‍♂️ Auditoría de Seguridad</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '5px'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9em'}}>
                    <thead style={{backgroundColor:'#333', color:'white', position:'sticky', top:0}}>
                        <tr>
                            <th style={{padding:'8px'}}>Fecha</th>
                            <th style={{padding:'8px'}}>Acción</th>
                            <th style={{padding:'8px'}}>Detalle</th>
                            <th style={{padding:'8px'}}>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:'8px'}}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                                <td style={{padding:'8px', fontWeight:'bold', color: log.action==='CHECK_IN'?'green':'#d32f2f'}}>{log.action}</td>
                                <td style={{padding:'8px'}}>{log.details}</td>
                                <td style={{padding:'8px', fontStyle:'italic'}}>{log.username || 'Sistema'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
      )}
      {/* --- PESTAÑA 4: CLIENTES / CRM --- */}
        {activeTab === 'clients' && (
            <div>
                <div style={{marginBottom:'15px'}}>
                    <h3 style={{marginTop:0, color:'#1565c0'}}>Base de Datos de Huéspedes</h3>
                    <p style={{fontSize:'0.9em', color:'#666'}}>
                        Gestione la información personal, corrija errores de registro y asigne estatus VIP a sus clientes frecuentes.
                    </p>
                </div>
                
                {/* Reutilizamos tu componente GuestList que ya tiene búsqueda y VIP */}
                <GuestList refreshTrigger={refreshTrigger} />
            </div>
        )}
    </div>
  );
}

export default SettingsPanel;