import { useState, useEffect } from 'react';
import axios from 'axios';
import RoomManager from './RoomManager';
import { getAuditLogs } from '../services/auditService'; 

// URL base
const API_URL_AUTH = 'http://localhost:8080/api/auth';
const API_URL_HOTELS = 'http://localhost:8080/api/hotels';

function SettingsPanel({ hotel, user }) {
  // Pestaña activa por defecto
  const [activeTab, setActiveTab] = useState('rooms');
  
  // Estados para personal
  const [staffList, setStaffList] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStaffData, setNewStaffData] = useState({ fullName: '', password: '' });

  // Estados para Auditoría (NUEVO)
  const [auditLogs, setAuditLogs] = useState([]);

  // --- CARGA DE DATOS ---
  const loadStaff = async () => {
    try {
      const res = await axios.get(`${API_URL_HOTELS}/staff?hotelId=${hotel.id}`);
      setStaffList(res.data);
    } catch (error) { console.error("Error cargando personal", error); }
  };

  useEffect(() => {
      // Cargar según la pestaña
      if (activeTab === 'staff') loadStaff();
      
      if (activeTab === 'audit') {
          getAuditLogs(hotel.id)
              .then(setAuditLogs)
              .catch(e => console.error(e));
      }
  }, [activeTab, hotel.id]);

  // --- LÓGICA DE PERSONAL (Tu código existente) ---
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername) return;
    setIsSearching(true); setFoundUser(null); setShowCreateForm(false);
    try {
      const res = await axios.get(`${API_URL_AUTH}/find?username=${searchUsername}`);
      setFoundUser(res.data);
    } catch (error) {
      if (error.response && error.response.status === 404) setShowCreateForm(true);
      else alert("Error al buscar: " + error.message);
    } finally { setIsSearching(false); }
  };

  const handleAssignExisting = async () => {
    try {
      await axios.post(`${API_URL_HOTELS}/staff`, { hotelId: hotel.id, userId: foundUser.id });
      alert(`✅ ${foundUser.fullName} ahora trabaja en este hotel.`);
      resetForm(); loadStaff();
    } catch (error) { alert("Error: " + (error.response?.data?.message || error.message)); }
  };

  const handleCreateAndAssign = async () => {
    try {
      const authRes = await axios.post(`${API_URL_AUTH}/register`, {
        username: searchUsername, password: newStaffData.password, fullName: newStaffData.fullName, role: 'RECEPTIONIST'
      });
      await axios.post(`${API_URL_HOTELS}/staff`, { hotelId: hotel.id, userId: authRes.data.user.id });
      alert("✅ Recepcionista creado y asignado.");
      resetForm(); loadStaff();
    } catch (error) { alert("Error creando usuario: " + (error.response?.data?.message || error.message)); }
  };

  const resetForm = () => {
    setSearchUsername(''); setFoundUser(null); setShowCreateForm(false); setNewStaffData({ fullName: '', password: '' });
  };


  // --- RENDERIZADO ---
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', minHeight: '80vh' }}>
      <h2 style={{borderBottom:'2px solid #eee', paddingBottom:'10px', color: '#1565c0'}}>⚙️ Configuración: {hotel.name}</h2>
      
      {/* BOTONES DE PESTAÑA */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('rooms')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='rooms'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='rooms'?'bold':'normal'}}>
            Habitaciones
        </button>
        <button onClick={() => setActiveTab('staff')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='staff'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='staff'?'bold':'normal'}}>
            Personal
        </button>
        {/* TERCER BOTÓN NUEVO */}
        <button onClick={() => setActiveTab('audit')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='audit'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='audit'?'bold':'normal'}}>
            Auditoría
        </button>
      </div>

      {/* --- PESTAÑA 1: HABITACIONES --- */}
      {activeTab === 'rooms' && (
        <div>
            <p>Gestione el inventario físico de este hotel.</p>
            <RoomManager onUpdate={() => alert("Habitación creada.")} />
        </div>
      )}

      {/* --- PESTAÑA 2: PERSONAL --- */}
      {activeTab === 'staff' && (
        <div>
            {/* ... Aquí va todo tu código de buscador y lista de personal ... */}
            {/* Para abreviar, asumo que ya tienes esto, no lo borres */}
            <div style={{display: 'flex', gap: '20px'}}>
                <div style={{flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
                    <h3>Gestionar Acceso</h3>
                    <form onSubmit={handleSearch} style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                        <input placeholder="Buscar usuario..." value={searchUsername} onChange={e=>setSearchUsername(e.target.value)} disabled={foundUser || showCreateForm} style={{padding:'8px', flex:1}} />
                        {(!foundUser && !showCreateForm) && <button type="submit" disabled={isSearching} style={{cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', padding:'0 15px', borderRadius:'4px'}}>🔍</button>}
                        {(foundUser || showCreateForm) && <button type="button" onClick={resetForm} style={{cursor:'pointer', backgroundColor:'#666', color:'white', border:'none', padding:'0 15px', borderRadius:'4px'}}>❌</button>}
                    </form>
                    {foundUser && (
                        <div style={{backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '5px', textAlign:'center'}}>
                            <p><strong>{foundUser.fullName}</strong></p>
                            <button onClick={handleAssignExisting} style={{backgroundColor:'#2E7D32', color:'white', border:'none', padding:'10px', borderRadius:'5px', cursor:'pointer'}}>🔗 Vincular</button>
                        </div>
                    )}
                    {showCreateForm && (
                        <div style={{backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px'}}>
                            <p>Crear nuevo recepcionista:</p>
                            <input placeholder="Nombre Completo" value={newStaffData.fullName} onChange={e=>setNewStaffData({...newStaffData, fullName:e.target.value})} style={{padding:'8px', marginBottom:'5px', width:'100%'}} />
                            <input placeholder="Contraseña" type="password" value={newStaffData.password} onChange={e=>setNewStaffData({...newStaffData, password:e.target.value})} style={{padding:'8px', marginBottom:'5px', width:'100%'}} />
                            <button onClick={handleCreateAndAssign} style={{backgroundColor:'#FF9800', color:'white', border:'none', padding:'10px', borderRadius:'5px', cursor:'pointer', width:'100%'}}>✨ Crear</button>
                        </div>
                    )}
                </div>
                <div style={{flex: 1, padding: '20px', backgroundColor:'#f9f9f9', borderRadius:'8px'}}>
                    <h3>Equipo Actual</h3>
                    <ul style={{paddingLeft: '20px'}}>
                        {staffList.map(s => <li key={s.id}>ID Usuario: {s.userId} - {s.role}</li>)}
                    </ul>
                </div>
            </div>
        </div>
      )}

      {/* --- PESTAÑA 3: AUDITORÍA (NUEVO) --- */}
      {activeTab === 'audit' && (
          <div>
            <h3>🕵️‍♂️ Auditoría de Seguridad</h3>
            <p style={{fontSize:'0.9em', color:'#666'}}>Registro inmutable de actividades sensibles.</p>
            
            <div style={{maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '5px'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.9em'}}>
                    <thead style={{backgroundColor:'#333', color:'white', position:'sticky', top:0}}>
                        <tr>
                            <th style={{padding:'8px', textAlign:'left'}}>Fecha</th>
                            <th style={{padding:'8px', textAlign:'left'}}>Acción</th>
                            <th style={{padding:'8px', textAlign:'left'}}>Detalle</th>
                            <th style={{padding:'8px', textAlign:'left'}}>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map(log => (
                            <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:'8px', whiteSpace:'nowrap'}}>
                                    {new Date(log.timestamp || log.createdAt).toLocaleString()}
                                </td>
                                <td style={{padding:'8px', fontWeight:'bold', color: log.action==='CHECK_IN'?'green':'#d32f2f'}}>
                                    {log.action}
                                </td>
                                <td style={{padding:'8px'}}>{log.details}</td>
                                <td style={{padding:'8px', fontStyle:'italic'}}>
                                    {log.username || 'Sistema'}
                                </td>
                            </tr>
                        ))}
                        {auditLogs.length === 0 && (
                            <tr><td colSpan="4" style={{padding:'20px', textAlign:'center'}}>Sin actividad registrada</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
      )}
    </div>
  );
}

export default SettingsPanel;