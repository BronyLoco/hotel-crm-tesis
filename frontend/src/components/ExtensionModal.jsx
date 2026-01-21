import { useState, useEffect } from 'react';
import { extendStay } from '../services/reservationService';
import { addCharge, getFolioByReservation } from '../services/billingService';
import { getRooms } from '../services/roomService';

function ExtensionModal({ reservation, onClose, onSuccess }) {
  const [newDate, setNewDate] = useState(reservation.checkOut);
  const [extraCost, setExtraCost] = useState(0);
  const [pricePerPerson, setPricePerPerson] = useState(0);
  const [loading, setLoading] = useState(false);

  // Calcular costos al cambiar fecha
  useEffect(() => {
    const loadPrice = async () => {
      // Obtenemos precio de la habitación (esto podría optimizarse pasándolo por props)
      const rooms = await getRooms();
      const myRoom = rooms.find(r => r.RoomType && r.RoomType.id === reservation.roomTypeId);
      if (myRoom) {
        setPricePerPerson(parseFloat(myRoom.RoomType.basePrice));
      }
    };
    loadPrice();
  }, [reservation.roomTypeId]);

  useEffect(() => {
    if (!pricePerPerson) return;

    const currentOut = new Date(reservation.checkOut);
    const selectedOut = new Date(newDate);
    
    // Diferencia en días
    const diffTime = selectedOut - currentOut;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      setExtraCost(diffDays * pricePerPerson * reservation.totalGuests);
    } else {
      setExtraCost(0);
    }
  }, [newDate, pricePerPerson, reservation]);

  const handleConfirm = async () => {
    if (extraCost <= 0) return alert("Seleccione una fecha posterior a la actual.");
    
    try {
      setLoading(true);
      // 1. Extender Reserva
      await extendStay(reservation.id, newDate);

      // 2. Cargar Costo
      const folio = await getFolioByReservation(reservation.id);
      if (folio) {
        const days = extraCost / (pricePerPerson * reservation.totalGuests);
        await addCharge(folio.id, `Extensión Estadía (${days} días)`, extraCost);
      }

      alert("✅ Estadía extendida correctamente.");
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
        <h3 style={{marginTop: 0, color: '#1565c0'}}>📅 Extender Estadía</h3>
        
        <p>Salida Actual: <strong>{reservation.checkOut}</strong></p>
        
        <div style={{marginBottom: '20px'}}>
          <label style={{display:'block', marginBottom:'5px'}}>Nueva Fecha de Salida:</label>
          <input 
            type="date" 
            value={newDate} 
            min={reservation.checkOut}
            onChange={(e) => setNewDate(e.target.value)}
            style={{width: '100%', padding: '10px', fontSize: '1.1em', borderRadius: '5px', border: '1px solid #ccc'}}
          />
        </div>

        <div style={{backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px', marginBottom: '20px'}}>
          <div style={{fontSize: '0.9em', color: '#666'}}>Costo Adicional Estimado:</div>
          <div style={{fontSize: '1.5em', fontWeight: 'bold', color: '#1565c0'}}>${extraCost.toFixed(2)}</div>
          <small>{reservation.totalGuests} pers x ${pricePerPerson}/noche</small>
        </div>

        <div style={{display: 'flex', justifyContent: 'end', gap: '10px'}}>
          <button onClick={onClose} style={{padding: '10px', border:'none', background: 'none', cursor: 'pointer'}}>Cancelar</button>
          <button 
            onClick={handleConfirm} 
            disabled={loading || extraCost <= 0}
            style={{padding: '10px 20px', backgroundColor: '#2E7D32', color: 'white', border:'none', borderRadius: '5px', cursor: 'pointer', opacity: loading ? 0.7 : 1}}
          >
            {loading ? 'Procesando...' : 'Confirmar Extensión'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExtensionModal;