import { useState } from 'react';
import GuestDataForm from './GuestDataForm';
import { createGuest } from '../services/guestService';

function AddGuestToGroupModal({ event, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  // Estado inicial vacío
  const [guestData, setGuestData] = useState({
    firstName: '', 
    lastName: '', 
    documentId: '', 
    email: '', 
    country: '', 
    city: '', 
    nationality: '', 
    birthDate: '', 
    civilStatus: 'SOLTERO',
    groupCode: event.code 
  });

  const handleSave = async () => {
    // Validaciones básicas
    if (!guestData.firstName || !guestData.lastName || !guestData.documentId) {
        return alert("Complete los campos obligatorios (Nombre, Apellido, Documento)");
    }
    const currentCount = event.Guests ? event.Guests.length : (event.registeredCount || 0);
    const maxCapacity = event.expectedGuests || 0;

    if (currentCount >= maxCapacity) {
        return alert(`⛔ ERROR DE CAPACIDAD: Este expediente espera ${maxCapacity} personas y ya tiene ${currentCount}.\n\nSi necesita agregar más, edite la capacidad del evento primero.`);
    }
    setLoading(true);
    try {
      await createGuest(guestData);
      
      alert(`✅ ${guestData.firstName} agregado al expediente.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      alert("Error: " + msg);
    } finally {
      setLoading(false);
    }
  };

return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
            <div>
                <h3 style={{margin:0, color:'#1565c0'}}>👤 Agregar a: {event.name}</h3>
                {/* MOSTRAR CAPACIDAD VISUALMENTE EN EL MODAL */}
                <small style={{color: (event.registeredCount >= event.expectedGuests) ? 'red' : 'green'}}>
                    Cupos: {event.registeredCount} / {event.expectedGuests} ocupados
                </small>
            </div>
            <button onClick={onClose} style={{border:'none', background:'none', fontSize:'1.5em', cursor:'pointer'}}>&times;</button>
        </div>

        <GuestDataForm 
            guest={guestData} 
            onChange={setGuestData} 
        />

        <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
            <button onClick={onClose} style={{padding: '10px 20px', border:'1px solid #ccc', background:'white', borderRadius:'5px', cursor:'pointer'}}>
                Cancelar
            </button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                style={{padding: '10px 20px', backgroundColor: '#2E7D32', color: 'white', border:'none', borderRadius:'5px', cursor: 'pointer', fontWeight: 'bold'}}
            >
                {loading ? 'Guardando...' : 'Guardar Huésped'}
            </button>
        </div>

      </div>
    </div>
  );
}

export default AddGuestToGroupModal;