import { useState, useEffect } from 'react';
import { getRevenue } from './services/billingService';
import { getCurrentUser, logout } from './services/authService';

import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import RoomList from './components/RoomList';
import BookingForm from './components/BookingForm';
import ReservationList from './components/ReservationList';
import LoginPage from './components/LoginPage';
import PublicGroupRegister from './components/PublicGroupRegister';
import GroupManager from './components/GroupManager';

function App() {
  //Estado de sesión
  const [user, setUser] = useState(getCurrentUser());

  // Estados para controlar las recargas automáticas
  const [refreshGuests, setRefreshGuests] = useState(false);
  const [refreshReservations, setRefreshReservations] = useState(false);
  const [refreshInventory, setRefreshInventory] = useState(false);
  const [totalMoney, setTotalMoney] = useState(0);
  
  // 1. fix ROUTING MANUAL (Para la Tesis)
  // Si la URL es "/registro-grupo", mostramos el componente público y salimos.
  if (window.location.pathname === '/registro-grupo') {
    return <PublicGroupRegister />;
  }

// Efecto de Ingresos (solo si hay usuario)
  useEffect(() => {
    if (user) {
      const loadMoney = async () => {
        try {
          const data = await getRevenue();
          setTotalMoney(data.totalRevenue);
        } catch (e) { console.error(e); }
      };
      loadMoney();
    }
  }, [refreshReservations, user]);

  // Manejador de Login exitoso
  const handleLoginSuccess = () => {
    setUser(getCurrentUser());
  };

  // Manejador de Logout
  const handleLogout = () => {
    logout();
    setUser(null);
  };
// 🔒 EL MURO DE SEGURIDAD
  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }
    // Efecto para cargar dinero cada vez que cambia algo en reservas (por si pagaron)
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER CON USUARIO Y LOGOUT */}
      <header style={{ 
        marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', color: '#1565c0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0 }}>🏨 Hotel CRM</h1>
          <span style={{ backgroundColor: '#e3f2fd', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', color: '#1565c0' }}>
            👤 Hola, {user.username} ({user.role})
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* TARJETA INGRESOS */}
          <div style={{ backgroundColor: '#E8F5E9', padding: '5px 15px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'right' }}>
            <small style={{ color: '#2E7D32', fontWeight: 'bold' }}>INGRESOS</small>
            <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#1B5E20' }}>
              ${totalMoney.toFixed(2)}
            </div>
          </div>

          {/* BOTÓN SALIR */}
          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '10px 15px', 
              borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Salir 🚪
          </button>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* COLUMNA 1: CLIENTES */}
        <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h2>👤 Recepción</h2>
          <GuestForm onGuestAdded={() => setRefreshGuests(!refreshGuests)} />
          <GroupManager onUpdate={() => {
             setRefreshReservations(!refreshReservations);
             setRefreshInventory(!refreshInventory);
          }} />

          <hr/>
          <GuestList key={refreshGuests} />
        </section>

        {/* COLUMNA 2: RESERVAS */}
        <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h2>📅 Central de Reservas</h2>
          
          <BookingForm onReservationCreated={() => setRefreshReservations(!refreshReservations)} />
          <ReservationList 
            refresh={refreshReservations} 
            onCheckInSuccess={() => setRefreshInventory(!refreshInventory)} 
          />
        </section>

        {/* COLUMNA 3: INVENTARIO */}
        <section>
          <h2>🛏️ Inventario Físico</h2>
          <p style={{fontSize: '0.9em', color: '#666'}}>Estado en tiempo real de las habitaciones.</p>
          <RoomList key={refreshInventory} />
        </section>

      </div>
    </div>
  )
}

export default App;