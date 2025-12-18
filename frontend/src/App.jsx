import { useState } from 'react';
import GuestList from './components/GuestList';
import GuestForm from './components/GuestForm';
import RoomList from './components/RoomList'; // <--- Importar esto

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleGuestAdded = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        <h1 style={{ margin: 0 }}>🏨 Hotel CRM - Recepción</h1>
        <small>Panel de Control Integral</small>
      </header>
      
      <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE HUÉSPEDES */}
        <section>
          <h2 style={{ borderBottom: '1px solid #ccc' }}>👤 Gestión de Huéspedes</h2>
          <GuestForm onGuestAdded={handleGuestAdded} />
          <GuestList key={refreshTrigger} /> 
        </section>

        {/* COLUMNA DERECHA: ESTADO DEL HOTEL */}
        <section>
          <h2 style={{ borderBottom: '1px solid #ccc' }}>🛏️ Inventario de Habitaciones</h2>
          <RoomList />
        </section>

      </main>
    </div>
  )
}

export default App;