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
import RoomManager from './components/RoomManager';

function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentHotel, setCurrentHotel] = useState(null);
  
  // NUEVO ESTADO: Bandera de seguridad
  const [isContextReady, setIsContextReady] = useState(false);

  const [lastUpdate, setLastUpdate] = useState(0); 
  const [totalMoney, setTotalMoney] = useState(0);

  // 1. CONFIGURACIÓN DEL CONTEXTO (HOTEL)
  useEffect(() => {
    if (currentHotel) {
      // A. Configurar Axios
      axios.defaults.headers.common['x-hotel-id'] = currentHotel.id;
      console.log(`🔌 Contexto Establecido: ${currentHotel.name} (ID: ${currentHotel.id})`);
      
      // B. Marcar como listo PARA QUE SE RENDERICE EL DASHBOARD
      setIsContextReady(true);
      
      // C. Recargar datos
      refreshAll(); 
    } else {
      delete axios.defaults.headers.common['x-hotel-id'];
      setIsContextReady(false); // Bloquear dashboard
    }
  }, [currentHotel]);

  // 2. CARGA DE DINERO (Protegida)
  useEffect(() => {
    if (user && isContextReady) { // Solo si el contexto está listo
      const loadMoney = async () => {
        try {
          const data = await getRevenue();
          setTotalMoney(data.totalRevenue);
        } catch (e) { console.error("Error cargando dinero:", e.message); }
      };
      loadMoney();
    }
  }, [lastUpdate, user, isContextReady]);

  const refreshAll = () => setLastUpdate(prev => prev + 1);

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentHotel(null);
    setIsContextReady(false);
    delete axios.defaults.headers.common['x-hotel-id'];
  };

  const handleLoginSuccess = () => setUser(getCurrentUser());

  // ENRUTAMIENTO PÚBLICO
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/registro-grupo') return <PublicGroupRegister />;
  if (path === '/registro-saas') return <SaaSRegister />;

  // MURO DE SEGURIDAD
  if (!user) return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  
  // SELECCIÓN DE SUCURSAL
  if (user.role === 'MANAGER' && !currentHotel) {
    return <HotelSelector user={user} onHotelSelected={setCurrentHotel} />;
  }

  // DASHBOARD PRINCIPAL
  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0 }}>🏨 Hotel CRM</h1>
          <span style={{ backgroundColor: '#e3f2fd', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', color: '#1565c0' }}>👤 {user.username}</span>
          {currentHotel && (
             <div style={{backgroundColor:'#fff3cd', padding:'5px 10px', borderRadius:'5px', border:'1px solid #ffecb3'}}>
                🏨 {currentHotel.name}
                <button onClick={() => setCurrentHotel(null)} style={{marginLeft:'10px', fontSize:'0.8em', cursor:'pointer', border:'none', background:'none', textDecoration:'underline'}}>Cambiar</button>
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
         </nav>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#E8F5E9', padding: '5px 15px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'right' }}>
            <small style={{ color: '#2E7D32', fontWeight: 'bold' }}>INGRESOS</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#1B5E20' }}>${totalMoney.toFixed(2)}</div>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>

      {currentView === 'dashboard' && isContextReady && (
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
            <RoomManager onUpdate={refreshAll}/>
            <RoomList refreshTrigger={lastUpdate} onUpdate={refreshAll} />
          </section>
        </div>
      )}

      {currentView === 'calendar' && isContextReady && <CalendarView />}
      {currentView === 'reports' && isContextReady && <ReportsPanel />}

    </div>
  )
}

export default App;