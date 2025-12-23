import { useState } from 'react';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import RoomList from './components/RoomList';
import BookingForm from './components/BookingForm';
import ReservationList from './components/ReservationList';

function App() {
  // Estados para controlar las recargas automáticas
  const [refreshGuests, setRefreshGuests] = useState(false);
  const [refreshReservations, setRefreshReservations] = useState(false);
  const [refreshInventory, setRefreshInventory] = useState(false);

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #1565c0', paddingBottom: '10px', color: '#1565c0' }}>
        <h1 style={{ margin: 0 }}>🏨 Hotel System <span style={{fontSize: '0.6em', color: '#666'}}>Arquitectura Microservicios</span></h1>
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