import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRevenue } from './services/billingService';
import { getCurrentUser, logout } from './services/authService';

// Componentes
import GuestList from './components/GuestList';
import RoomList from './components/RoomList';
import ReservationList from './components/ReservationList';
import LoginPage from './components/LoginPage';
import PublicGroupRegister from './components/PublicGroupRegister';
import GroupManager from './components/GroupManager';
import WalkInWizard from './components/WalkInWizard';
import ReportsPanel from './components/ReportsPanel';
import CalendarView from './components/CalendarView';
import SaaSRegister from './components/SaaSRegister';
import HotelSelector from './components/HotelSelector';
import SettingsPanel from './components/SettingsPanel';

function App() {
  // 1. ESTADOS
  const [user, setUser] = useState(getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentHotel, setCurrentHotel] = useState(null);
  
  // Triggers
  const [lastUpdate, setLastUpdate] = useState(0); 
  const [totalMoney, setTotalMoney] = useState(0);

  // 2. FUNCIONES DE LÓGICA (HANDLERS)

  const refreshAll = () => setLastUpdate(prev => prev + 1);

  // --- NUEVA FUNCIÓN: SELECCIONAR HOTEL ---
  // Configuramos Axios AQUÍ, antes de actualizar el estado.
  // Esto garantiza que cuando el Dashboard se renderice, Axios ya esté listo.
  const handleHotelSelected = (hotel) => {
    // 1. Configurar Header Global
    axios.defaults.headers.common['x-hotel-id'] = hotel.id;
    console.log(`🔌 Contexto Establecido: ${hotel.name} (ID: ${hotel.id})`);
    
    // 2. Actualizar Estado (Esto dispara el render del Dashboard)
    setCurrentHotel(hotel);
    
    // 3. Recargar datos iniciales
    refreshAll();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentHotel(null);
    // Limpiar header al salir
    delete axios.defaults.headers.common['x-hotel-id'];
  };

  const handleLoginSuccess = () => setUser(getCurrentUser());

  // 3. EFECTOS (Solo para cargas asíncronas, no para configuración síncrona)

  // Carga de Dinero (Solo si hay usuario Y hotel)
  useEffect(() => {
    if (user && currentHotel) {
      const loadMoney = async () => {
        try {
          const data = await getRevenue();
          setTotalMoney(data.totalRevenue);
        } catch (e) { 
           // console.error(e); 
        }
      };
      loadMoney();
    }
  }, [lastUpdate, user, currentHotel]);

  // Interceptor de Seguridad
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
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

  // 4. ENRUTAMIENTO Y RENDERIZADO

  const path = window.location.pathname.replace(/\/+$/, '');
  
  if (path === '/registro-grupo') return <PublicGroupRegister />;
  if (path === '/registro-saas') return <SaaSRegister />;

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
  
  // Selección de Sucursal
  if (!currentHotel && (user.role === 'MANAGER' || user.role === 'RECEPTIONIST')) {
    // Pasamos nuestra nueva función optimizada
    return <HotelSelector user={user} onHotelSelected={handleHotelSelected} />;
  }

  // DASHBOARD
  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>🏨 Hotel CRM</h1>
          <span style={{ backgroundColor: '#e3f2fd', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', color: '#1565c0' }}>
            👤 {user.username} ({user.role})
          </span>
          {currentHotel && (
             <div style={{backgroundColor:'#fff3cd', padding:'5px 10px', borderRadius:'5px', border:'1px solid #ffecb3'}}>
                🏨 {currentHotel.name}
                {/* Al cambiar, borramos el header manualmente también por seguridad */}
                <button onClick={() => { setCurrentHotel(null); delete axios.defaults.headers.common['x-hotel-id']; }} 
                        style={{marginLeft:'10px', fontSize:'0.8em', cursor:'pointer', border:'none', background:'none', textDecoration:'underline'}}>
                  Cambiar
                </button>
             </div>
          )}
        </div>
        
        <nav style={{ display: 'flex', gap: '10px' }}>
            {['dashboard', 'calendar', 'reports'].map(view => (
              <button key={view} onClick={() => setCurrentView(view)} 
                style={{ cursor: 'pointer', padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: currentView === view ? '#1565c0' : 'transparent', color: currentView === view ? 'white' : '#1565c0', fontWeight: 'bold' }}>
                 {view === 'dashboard' ? 'Recepción' : (view === 'calendar' ? 'Calendario' : 'Reportes')}
              </button>
            ))}
            {user.role === 'MANAGER' && (
                <button onClick={() => setCurrentView('settings')} style={{ cursor: 'pointer', padding: '8px 15px', borderRadius: '5px', border: 'none', backgroundColor: currentView === 'settings' ? '#1565c0' : 'transparent', color: currentView === 'settings' ? 'white' : '#1565c0', fontWeight: 'bold' }}>
                   ⚙️ Configuración
                </button>
            )}
         </nav>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#E8F5E9', padding: '5px 15px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'right' }}>
            <small style={{ color: '#2E7D32', fontWeight: 'bold' }}>INGRESOS</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#1B5E20' }}>${totalMoney.toFixed(2)}</div>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>
      
      {/* VISTAS */}

      {currentView === 'dashboard' && currentHotel && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
            <h2>👤 Recepción</h2>
            <WalkInWizard refreshTrigger={lastUpdate} onComplete={refreshAll} />
            <GroupManager onUpdate={refreshAll} />
            <hr/>
            <GuestList key={lastUpdate} /> 
          </section>
          <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
            <h2>📅 Gestión de Reservas</h2>
            <ReservationList refresh={lastUpdate} onCheckInSuccess={refreshAll} />
          </section>
          <section>
            <h2>🛏️ Inventario Físico</h2>
            <RoomList refreshTrigger={lastUpdate} onUpdate={refreshAll} />
          </section>
        </div>
      )}

      {currentView === 'settings' && currentHotel && user.role === 'MANAGER' && (
          <SettingsPanel hotel={currentHotel} user={user} />
      )}
      
      {currentView === 'calendar' && currentHotel && <CalendarView />}
      
      {currentView === 'reports' && currentHotel && <ReportsPanel />}

    </div>
  )
}

export default App;