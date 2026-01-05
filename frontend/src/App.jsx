import { useState, useEffect } from 'react';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import RoomList from './components/RoomList';
import BookingForm from './components/BookingForm';
import ReservationList from './components/ReservationList';
import { getRevenue } from './services/billingService';
function App() {
  // Estados para controlar las recargas automáticas
  const [refreshGuests, setRefreshGuests] = useState(false);
  const [refreshReservations, setRefreshReservations] = useState(false);
  const [refreshInventory, setRefreshInventory] = useState(false);
  const [totalMoney, setTotalMoney] = useState(0);

    // Efecto para cargar dinero cada vez que cambia algo en reservas (por si pagaron)
  useEffect(() => {
    const loadMoney = async () => {
      try {
        const data = await getRevenue();
        setTotalMoney(data.totalRevenue);
      } catch (e) { console.error(e); }
    };
    loadMoney();
  }, [refreshReservations]); // Se actualiza cuando movemos reservas (checkouts)
  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER MEJORADO */}
      <header style={{ 
        marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', color: '#1565c0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>🏨 Hotel System <span style={{fontSize: '0.6em', color: '#666'}}>Microservices</span></h1>
        </div>
        
        {/* TARJETA DE INGRESOS */}
        <div style={{ backgroundColor: '#E8F5E9', padding: '10px 20px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'right' }}>
          <small style={{ color: '#2E7D32', fontWeight: 'bold' }}>INGRESOS TOTALES</small>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#1B5E20' }}>
            ${totalMoney.toFixed(2)}
          </div>
        </div>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* COLUMNA 1: CLIENTES */}
        <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h2>👤 Recepción</h2>
          <GuestForm onGuestAdded={() => setRefreshGuests(!refreshGuests)} />
          <GuestList key={refreshGuests} />
        </section>

        {/* COLUMNA 2: RESERVAS */}
        <section style={{ borderRight: '1px solid #ddd', paddingRight: '20px' }}>
          <h2>📅 Central de Reservas</h2>
          
          <BookingForm onReservationCreated={() => setRefreshReservations(!refreshReservations)} />
          
          {/* AQUÍ ESTABA EL FALTANTE: Pasamos la función onCheckInSuccess */}
          <ReservationList 
            refresh={refreshReservations} 
            onCheckInSuccess={() => setRefreshInventory(!refreshInventory)} 
          />
        </section>

        {/* COLUMNA 3: INVENTARIO */}
        <section>
          <h2>🛏️ Inventario Físico</h2>
          <p style={{fontSize: '0.9em', color: '#666'}}>Estado en tiempo real de las habitaciones.</p>
          
          {/* AQUÍ ESTABA EL FALTANTE: Usamos la key para forzar la recarga */}
          <RoomList key={refreshInventory} />
        </section>

      </div>
    </div>
  )
}

export default App;