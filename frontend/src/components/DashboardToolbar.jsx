import React from 'react';

function DashboardToolbar({ onOpenWalkIn, onOpenBooking }) {
  return (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
      
      {/* BOTÓN PRINCIPAL: ENTRADA SIN RESERVA */}
      <button 
        onClick={onOpenWalkIn}
        style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: '#1565c0', color: 'white', border: 'none',
            padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(21, 101, 192, 0.3)',
            fontSize: '1em', fontWeight: 'bold'
        }}
      >
        <span style={{fontSize: '1.5em'}}>🛎️</span> 
        <div>
            <div style={{lineHeight: '1'}}>Nueva Entrada</div>
            <small style={{fontWeight: 'normal', opacity: 0.8}}>Sin Reserva</small>
        </div>
      </button>

      {/* BOTÓN SECUNDARIO: RESERVA FUTURA */}
      <button 
        onClick={onOpenBooking}
        style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            backgroundColor: 'white', color: '#1565c0', border: '2px solid #1565c0',
            padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '1em', fontWeight: 'bold'
        }}
      >
        <span style={{fontSize: '1.5em'}}>📅</span>
        <div>
            <div style={{lineHeight: '1'}}>Nueva Reserva</div>
            <small style={{fontWeight: 'normal', opacity: 0.8, color: '#666'}}>A futuro</small>
        </div>
      </button>

    </div>
  );
}

export default DashboardToolbar;