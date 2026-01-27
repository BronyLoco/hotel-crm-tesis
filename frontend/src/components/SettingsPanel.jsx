import { useState, useEffect } from 'react';
import RoomManager from './RoomManager';
import axios from 'axios';

// URL base (apunta al Gateway)
const API_URL_AUTH = 'http://localhost:8080/api/auth';
const API_URL_HOTELS = 'http://localhost:8080/api/hotels';

function SettingsPanel({ hotel, user }) {
  const [activeTab, setActiveTab] = useState('rooms');
  
  // --- ESTADOS PARA PERSONAL ---
  const [staffList, setStaffList] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUser, setFoundUser] = useState(null); // Usuario encontrado en la búsqueda
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Datos para crear nuevo empleado
  const [newStaffData, setNewStaffData] = useState({ fullName: '', password: '' });

  // 1. CARGAR PERSONAL EXISTENTE
  const loadStaff = async () => {
    try {
      const res = await axios.get(`${API_URL_HOTELS}/staff?hotelId=${hotel.id}`);
      setStaffList(res.data);
    } catch (error) {
      console.error("Error cargando personal", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'staff') loadStaff();
  }, [activeTab]);

  // 2. BUSCAR USUARIO
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername) return;
    
    setIsSearching(true);
    setFoundUser(null);
    setShowCreateForm(false);

    try {
      const res = await axios.get(`${API_URL_AUTH}/find?username=${searchUsername}`);
      setFoundUser(res.data); // ¡Lo encontramos!
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setShowCreateForm(true); // No existe, mostramos form para crear
      } else {
        alert("Error al buscar: " + error.message);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 3. ASIGNAR USUARIO EXISTENTE
  const handleAssignExisting = async () => {
    try {
      await axios.post(`${API_URL_HOTELS}/staff`, {
        hotelId: hotel.id,
        userId: foundUser.id
      });
      alert(`✅ ${foundUser.fullName} ahora trabaja en este hotel.`);
      resetForm();
      loadStaff();
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  // 4. CREAR Y ASIGNAR NUEVO
  const handleCreateAndAssign = async () => {
    try {
      // A. Crear en Auth
      const authRes = await axios.post(`${API_URL_AUTH}/register`, {
        username: searchUsername,
        password: newStaffData.password,
        fullName: newStaffData.fullName,
        role: 'RECEPTIONIST'
      });
      const newUserId = authRes.data.user.id;

      // B. Asignar al Hotel
      await axios.post(`${API_URL_HOTELS}/staff`, {
        hotelId: hotel.id,
        userId: newUserId
      });

      alert("✅ Recepcionista creado y asignado.");
      resetForm();
      loadStaff();
    } catch (error) {
      alert("Error creando usuario: " + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setSearchUsername('');
    setFoundUser(null);
    setShowCreateForm(false);
    setNewStaffData({ fullName: '', password: '' });
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', minHeight: '80vh' }}>
      <h2 style={{borderBottom:'2px solid #eee', paddingBottom:'10px', color: '#1565c0'}}>⚙️ Configuración: {hotel.name}</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('rooms')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='rooms'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='rooms'?'bold':'normal'}}>Habitaciones</button>
        <button onClick={() => setActiveTab('staff')} style={{padding:'10px', cursor:'pointer', border:'none', background: activeTab==='staff'?'#e3f2fd':'#f5f5f5', fontWeight: activeTab==='staff'?'bold':'normal'}}>Personal</button>
      </div>

      {/* --- PESTAÑA HABITACIONES --- */}
      {activeTab === 'rooms' && (
        <div>
            <p>Gestione el inventario físico de este hotel.</p>
            <RoomManager onUpdate={() => alert("Habitación creada. Verifique en el Dashboard.")} />
        </div>
      )}

      {/* --- PESTAÑA PERSONAL (REDISEÑADA) --- */}
      {activeTab === 'staff' && (
        <div>
            <div style={{display: 'flex', gap: '20px'}}>
                
                {/* IZQUIERDA: BUSCADOR / CREADOR */}
                <div style={{flex: 1, padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
                    <h3>Gestionar Acceso</h3>
                    <form onSubmit={handleSearch} style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                        <input 
                            placeholder="Buscar usuario (ej. juan123)" 
                            value={searchUsername} 
                            onChange={e=>setSearchUsername(e.target.value)}
                            disabled={foundUser || showCreateForm}
                            style={{padding:'8px', flex:1}}
                        />
                        {(!foundUser && !showCreateForm) && (
                            <button type="submit" disabled={isSearching} style={{cursor:'pointer', backgroundColor:'#1565c0', color:'white', border:'none', padding:'0 15px', borderRadius:'4px'}}>
                                {isSearching ? '...' : '🔍'}
                            </button>
                        )}
                        {(foundUser || showCreateForm) && (
                            <button type="button" onClick={resetForm} style={{cursor:'pointer', backgroundColor:'#666', color:'white', border:'none', padding:'0 15px', borderRadius:'4px'}}>
                                ❌ Cancelar
                            </button>
                        )}
                    </form>

                    {/* CASO A: USUARIO ENCONTRADO */}
                    {foundUser && (
                        <div style={{backgroundColor: '#e8f5e9', padding: '15px', borderRadius: '5px', textAlign:'center'}}>
                            <p><strong>Usuario Encontrado:</strong></p>
                            <p style={{fontSize:'1.2em'}}>{foundUser.fullName} ({foundUser.role})</p>
                            <button onClick={handleAssignExisting} style={{backgroundColor:'#2E7D32', color:'white', border:'none', padding:'10px 20px', borderRadius:'5px', cursor:'pointer'}}>
                                🔗 Vincular a este Hotel
                            </button>
                        </div>
                    )}

                    {/* CASO B: USUARIO NO EXISTE (CREAR) */}
                    {showCreateForm && (
                        <div style={{backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px'}}>
                            <p><strong>El usuario "{searchUsername}" no existe.</strong></p>
                            <p>Complete los datos para crearlo:</p>
                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                <input placeholder="Nombre Completo" value={newStaffData.fullName} onChange={e=>setNewStaffData({...newStaffData, fullName:e.target.value})} style={{padding:'8px'}} />
                                <input placeholder="Contraseña" type="password" value={newStaffData.password} onChange={e=>setNewStaffData({...newStaffData, password:e.target.value})} style={{padding:'8px'}} />
                                <button onClick={handleCreateAndAssign} style={{backgroundColor:'#FF9800', color:'white', border:'none', padding:'10px', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>
                                    ✨ Crear y Asignar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* DERECHA: LISTA ACTUAL */}
                <div style={{flex: 1, padding: '20px', backgroundColor:'#f9f9f9', borderRadius:'8px'}}>
                    <h3>Equipo Actual ({staffList.length})</h3>
                    <ul style={{paddingLeft: '20px'}}>
                        {staffList.map(s => (
                            <li key={s.id} style={{marginBottom: '10px'}}>
                                <strong>ID Usuario: {s.userId}</strong> - {s.role}
                            </li>
                        ))}
                    </ul>
                    {staffList.length === 0 && <p style={{color:'#999'}}>No hay personal asignado.</p>}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPanel;