import { useState, useEffect } from 'react';
import axios from 'axios';
import { getRevenue } from './services/billingService';
import { getCurrentUser, logout } from './services/authService';

// Componentes Esenciales
import LoginPage from './components/LoginPage';
import HotelSelector from './components/HotelSelector';
import RoomList from './components/RoomList';
import UnifiedGuestManager from './components/UnifiedGuestManager';
import SettingsPanel from './components/SettingsPanel';
import ReportsPanel from './components/ReportsPanel';
import CalendarView from './components/CalendarView';
import PublicGroupRegister from './components/PublicGroupRegister';
import SaaSRegister from './components/SaaSRegister';

// Componentes que ahora vivirán en Modales
import WalkInWizard from './components/WalkInWizard';
import BookingManager from './components/BookingManager';

// Nuevos Componentes UI
import DashboardToolbar from './components/DashboardToolbar';
import ModalWrapper from './components/ModalWrapper';

function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentHotel, setCurrentHotel] = useState(null);
  
  // Triggers
  const [lastUpdate, setLastUpdate] = useState(0); 
  const [totalMoney, setTotalMoney] = useState(0);

  // Estados para MODALES (Visibilidad)
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [showBooking, setShowBooking] = useState(false);

  // --- LÓGICA (Igual que antes) ---
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

  useEffect(() => {
    if (user && currentHotel) {
      const loadMoney = async () => {
        try {
          const data = await getRevenue();
          setTotalMoney(data.totalRevenue);
        } catch (e) { }
      };
      loadMoney();
    }
  }, [lastUpdate, user, currentHotel]);

  // --- RENDERIZADO ---
  const path = window.location.pathname.replace(/\/+$/, '');
  
  if (path === '/registro-grupo') {
      return <PublicGroupRegister />; // <--- Si es esta ruta, sale de App.jsx inmediatamente
  }
  if (path === '/registro-saas') {
      return <SaaSRegister />;
  }
  if (!user) return <LoginPage onLoginSuccess={() => setUser(getCurrentUser())} />;
  
  if (!currentHotel && (user.role === 'MANAGER' || user.role === 'RECEPTIONIST')) {
    return <HotelSelector user={user} onHotelSelected={handleHotelSelected} />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1600px', margin: '0 auto', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <header style={{ 
        marginBottom: '20px', padding: '15px 20px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        
        {/* PARTE 1: IZQUIERDA (Logo y Cambio de Hotel) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{display:'flex', flexDirection:'column'}}>
             <h1 style={{ margin: 0, fontSize: '1.5em', lineHeight:'1' }}>🏨 Hotel CRM</h1>
             <span style={{ fontSize: '0.8em', color: '#666' }}>
               {user.role === 'MANAGER' ? 'Panel Gerencial' : 'Panel de Recepción'}
             </span>
          </div>

          {currentHotel && (
             <div 
                onClick={() => { setCurrentHotel(null); delete axios.defaults.headers.common['x-hotel-id']; }}
                title="Clic para cambiar de sucursal"
                style={{
                    backgroundColor: '#e3f2fd', 
                    padding: '8px 15px', 
                    borderRadius: '8px', 
                    border: '1px solid #90caf9', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#bbdefb'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#e3f2fd'}
             >
                <span style={{fontSize:'1.2em'}}>🏢</span>
                <div>
                    <div style={{fontWeight:'bold', color:'#1565c0', lineHeight:'1'}}>{currentHotel.name}</div>
                    <small style={{fontSize:'0.7em', color:'#555'}}>Cambiar Sede ↺</small>
                </div>
             </div>
          )}
        </div>

        {/* PARTE 2: CENTRO (Menú de Navegación - Lo que se había borrado) */}
        <nav style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => setCurrentView('dashboard')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background: currentView==='dashboard'?'#e3f2fd':'transparent', color: currentView==='dashboard'?'#1565c0':'#666', fontWeight:'bold', cursor:'pointer'}}>Recepción</button>
            <button onClick={() => setCurrentView('calendar')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background: currentView==='calendar'?'#e3f2fd':'transparent', color: currentView==='calendar'?'#1565c0':'#666', fontWeight:'bold', cursor:'pointer'}}>Calendario</button>
            
            {user.role === 'MANAGER' && (
                <>
                <button onClick={() => setCurrentView('reports')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background: currentView==='reports'?'#e3f2fd':'transparent', color: currentView==='reports'?'#1565c0':'#666', fontWeight:'bold', cursor:'pointer'}}>Finanzas</button>
                <button onClick={() => setCurrentView('settings')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background: currentView==='settings'?'#e3f2fd':'transparent', color: currentView==='settings'?'#1565c0':'#666', fontWeight:'bold', cursor:'pointer'}}>Configuración</button>
                </>
            )}
        </nav>
        
        {/* PARTE 3: DERECHA (Dinero y Salir - Lo que se había borrado) */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: '#888', fontSize:'0.8em' }}>CAJA AL DÍA</small>
            <div style={{ fontSize: '1.1em', fontWeight: 'bold', color: '#2E7D32' }}>${totalMoney.toFixed(2)}</div>
          </div>
          <button onClick={handleLogout} style={{ backgroundColor: '#ffcdd2', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>

      </header>

      {/* CONTENIDO PRINCIPAL */}
      {currentView === 'dashboard' && (
        <>
            {/* BARRA DE ACCIÓN RÁPIDA (Lo primero que ve el recepcionista) */}
            <DashboardToolbar 
                onOpenWalkIn={() => setShowWalkIn(true)} 
                onOpenBooking={() => setShowBooking(true)} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '25px' }}>
            
                {/* COLUMNA IZQUIERDA: CONTROL DE ESTADÍA (Lo importante) */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h3 style={{marginTop:0, color: '#333'}}>📋 Centro de Control</h3>
                    {/* Aquí está todo: Llegadas, En Casa, Historial */}
                    <UnifiedGuestManager refreshTrigger={lastUpdate} onUpdate={refreshAll} />
                </div>

                {/* COLUMNA DERECHA: ESTADO VISUAL (La referencia) */}
                <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                    <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <h3 style={{marginTop: 0, color: '#F57C00'}}>🛏️ Estado Habitaciones</h3>
                        <RoomList refreshTrigger={lastUpdate} onUpdate={refreshAll} />
                    </div>
                </div>

            </div>
        </>
      )}

      {/* VISTAS SECUNDARIAS */}
      {currentView === 'calendar' && <CalendarView />}
      {currentView === 'reports' && <ReportsPanel />}
      {currentView === 'settings' && user.role === 'MANAGER' && (
          <SettingsPanel 
             hotel={currentHotel} 
             user={user} 
             refreshTrigger={lastUpdate} // <--- NUEVA PROP
          />
      )}
      {/* --- MODALES FLOTANTES (Solo aparecen cuando se necesitan) --- */}
      
      {showWalkIn && (
          <ModalWrapper title="🛎️ Entrada sin Reserva (Check-in)" onClose={() => setShowWalkIn(false)}>
              <WalkInWizard 
                  refreshTrigger={lastUpdate} 
                  onComplete={() => { setShowWalkIn(false); refreshAll(); }} 
              />
          </ModalWrapper>
      )}

      {showBooking && (
          <ModalWrapper title="📅 Gestión de Reservas Futuras y Grupos" onClose={() => setShowBooking(false)}>
              <BookingManager onUpdate={refreshAll} />
          </ModalWrapper>
      )}

    </div>
  );
}

export default App;