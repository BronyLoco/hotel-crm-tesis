import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRevenue } from './services/billingService';
import { getCurrentUser, logout } from './services/authService';

// --- COMPONENTES ACTIVOS (MVP v3) ---
import LoginPage from './components/LoginPage';
import HotelSelector from './components/HotelSelector';
import RoomList from './components/RoomList';
import WalkInWizard from './components/WalkInWizard';
import UnifiedGuestManager from './components/UnifiedGuestManager';
import GroupSuite from './components/GroupSuite';
import ReportsPanel from './components/ReportsPanel';
import CalendarView from './components/CalendarView';
import SettingsPanel from './components/SettingsPanel';
import PublicGroupRegister from './components/PublicGroupRegister';
import SaaSRegister from './components/SaaSRegister';
import GuestList from './components/GuestList';
import PhoneBooking from './components/PhoneBooking';
import BookingManager from './components/BookingManager';

function App() {
  // 1. ESTADOS
  const [user, setUser] = useState(getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentHotel, setCurrentHotel] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(0); 
  const [totalMoney, setTotalMoney] = useState(0);

  // 2. FUNCIONES
  const refreshAll = () => setLastUpdate(prev => prev + 1);

  const handleHotelSelected = (hotel) => {
    axios.defaults.headers.common['x-hotel-id'] = hotel.id;
    if (hotel.tenantId) axios.defaults.headers.common['x-tenant-id'] = hotel.tenantId;
    setCurrentHotel(hotel);
    refreshAll();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentHotel(null);
    delete axios.defaults.headers.common['x-hotel-id'];
    delete axios.defaults.headers.common['x-tenant-id'];
  };

  // 3. EFECTOS
  useEffect(() => {
    if (user && currentHotel) {
      const loadMoney = async () => {
        try {
          const data = await getRevenue();
          setTotalMoney(data.totalRevenue);
        } catch (e) { /* Error silencioso */ }
      };
      loadMoney();
    }
  }, [lastUpdate, user, currentHotel]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      r => r,
      error => {
        if (error.config?.url?.includes('/login')) return Promise.reject(error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          handleLogout();
          alert("Sesión expirada o acceso denegado.");
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  // 4. ENRUTAMIENTO PÚBLICO
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/registro-grupo') return <PublicGroupRegister />;
  if (path === '/registro-saas') return <SaaSRegister />;

  // 5. MUROS (LOGIN Y SELECTOR)
  if (!user) return <LoginPage onLoginSuccess={() => setUser(getCurrentUser())} />;
  
  if (!currentHotel && (user.role === 'MANAGER' || user.role === 'RECEPTIONIST')) {
    return <HotelSelector user={user} onHotelSelected={handleHotelSelected} />;
  }

  // 6. RENDER PRINCIPAL
  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1450px', margin: '0 auto' }}>
      
      {/* HEADER RECUPERADO Y MEJORADO */}
      <header style={{ 
        marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', color: '#1565c0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>🏨 Hotel CRM</h1>
          <span style={{ backgroundColor: '#e3f2fd', padding: '5px 12px', borderRadius: '15px', fontSize: '0.85em', fontWeight: 'bold' }}>
            👤 {user.username}
          </span>
          {currentHotel && (
             <div style={{backgroundColor:'#fff3cd', padding:'5px 12px', borderRadius:'5px', border:'1px solid #ffecb3', fontSize: '0.9em'}}>
                <strong>{currentHotel.name}</strong>
                <button onClick={() => {setCurrentHotel(null);}} style={{marginLeft:'10px', cursor:'pointer', border:'none', background:'none', textDecoration:'underline', color:'#666'}}>Cambiar</button>
             </div>
          )}
        </div>

        <nav style={{ display: 'flex', gap: '8px' }}>
            {['dashboard', 'calendar', 'reports'].map(view => (
              <button key={view} onClick={() => setCurrentView(view)} 
                style={{
                  cursor: 'pointer', padding: '8px 16px', borderRadius: '5px', border: 'none',
                  backgroundColor: currentView === view ? '#1565c0' : 'transparent',
                  color: currentView === view ? 'white' : '#1565c0',
                  fontWeight: 'bold'
                }}>
                 {view === 'dashboard' ? '🏠 Recepción' : (view === 'calendar' ? '📅 Calendario' : '📊 Reportes')}
              </button>
            ))}
            {user.role === 'MANAGER' && (
              <button onClick={() => setCurrentView('settings')} style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '5px', border: 'none', backgroundColor: currentView === 'settings' ? '#1565c0' : 'transparent', color: currentView === 'settings' ? 'white' : '#1565c0', fontWeight: 'bold' }}>
                 ⚙️ Configuración
              </button>
            )}
        </nav>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#E8F5E9', padding: '8px 15px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'right' }}>
            <small style={{ color: '#2E7D32', fontWeight: 'bold', display:'block' }}>CAJA HOTEL</small>
            <strong style={{ fontSize: '1.2em', color: '#1B5E20' }}>${totalMoney.toFixed(2)}</strong>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>
      
      {/* CONTENIDO DINÁMICO */}

      {currentView === 'dashboard' && currentHotel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* NIVEL 1: OPERACIONES DIARIAS */}
          <div style={{ display: 'grid', gridTemplateColumns: '6fr 4fr', gap: '30px' }}>
            
            {/* IZQUIERDA: RECEPCIÓN Y CONTROL */}
            <section>
                <div style={{marginBottom: '30px'}}>
                   <h2 style={{marginTop:0, color:'#1565c0', fontSize:'1.4em'}}>🛎️ Recepción</h2>
                   <WalkInWizard refreshTrigger={lastUpdate} onComplete={refreshAll} />
                </div>
                <div style={{marginBottom: '30px'}}>
                   <h2 style={{marginTop:0, color:'#1565c0', fontSize:'1.4em'}}>📅 Gestión de Estadía</h2>
                    <BookingManager  onUpdate={refreshAll} />
                </div>
                <div>
                   <h2 style={{color:'#2E7D32', fontSize:'1.4em'}}>📅 Centro de Control (Estadías)</h2>
                   <UnifiedGuestManager refreshTrigger={lastUpdate} onUpdate={refreshAll} />
                </div>
                 {/* Reserva Telefónica (Llegada Futura) */}
            <PhoneBooking onReservationCreated={refreshAll} />
                  {/* Lista de Llegadas */}
            <div style={{marginTop:'20px'}}>
               <h4>🔜 Llegadas Pendientes</h4>
               </div>
            </section>

            {/* DERECHA: ESTADO Y LOGÍSTICA */}
            <aside>
                <div style={{ marginBottom: '30px', backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                   <h2 style={{marginTop: 0, fontSize: '1.3em', color: '#F57C00'}}>🛏️ Inventario Físico</h2>
                   <RoomList refreshTrigger={lastUpdate} onUpdate={refreshAll} />
                </div>

                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }}>
                   <h2 style={{marginTop: 0, fontSize: '1.3em', color: '#1565c0'}}>🚌 Delegaciones</h2>
                   <GroupSuite onUpdate={refreshAll} />
                </div>
            </aside>
          </div>

          {/* NIVEL 2: CRM Y DATOS HISTÓRICOS (ANCHO COMPLETO) */}
          <section>
             <h2 style={{marginTop: 0, fontSize: '1.4em', color: '#555', borderTop:'2px solid #eee', paddingTop:'20px'}}>📇 CRM de Clientes y Fidelización</h2>
             {/* Aquí va la nueva lista super poderosa */}
             <GuestList refreshTrigger={lastUpdate} />
          </section>

        </div>
      )}

      {currentView === 'calendar' && <CalendarView />}
      {currentView === 'reports' && <ReportsPanel />}
      {currentView === 'settings' && <SettingsPanel hotel={currentHotel} user={user} />}

    </div>
  );
}

export default App;