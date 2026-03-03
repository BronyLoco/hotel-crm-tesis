import { useState } from 'react';
import axios from 'axios';
import { createFolio, addCharge, getFolioByGroup } from '../services/billingService';

function EditGroupModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: event.name || '',
    expectedGuests: event.expectedGuests || 0,
    agreedPrice: event.agreedPrice || 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Actualizar datos del Evento (Etiqueta)
      await axios.patch(`http://localhost:8080/api/guests/groups/${event.id}`, formData);

      // 2. SINCRONIZACIÓN FINANCIERA (La Magia)
      // Buscamos si existe un folio para este grupo
      try {
          // Intentamos obtener el folio. Si no existe, axios lanzará error (o devuelve null)
          // Nota: Asegúrate de que tu backend de billing tenga la ruta /group/:id
          const res = await axios.get(`http://localhost:8080/api/billing/group/${event.id}`);
          const folio = res.data;

          if (folio && folio.status === 'OPEN') {
              const currentTotal = parseFloat(folio.totalAmount);
              const targetPrice = parseFloat(formData.agreedPrice);
              const difference = targetPrice - currentTotal;

              // Solo aplicamos ajuste si hay diferencia y es significativa (> 0.01)
              if (Math.abs(difference) > 0.01) {
                  await addCharge(folio.id, "Ajuste automático por cambio de contrato", difference);
                  console.log(`Ajuste aplicado: ${difference}`);
              }
          }
      } catch (billingError) {
          console.log("No se pudo sincronizar el folio (quizás no existe aún):", billingError.message);
          // No bloqueamos el proceso, solo avisamos en consola
      }

      alert("✅ Delegación y Costos actualizados.");
      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      console.error(error);
      alert("Error: " + (error.response?.data?.message || "Error al actualizar"));
    } finally {
      setLoading(false);
    }
  };

 return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h3 style={{marginTop:0, color:'#1565c0'}}>✏️ Editar Delegación</h3>
        
        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <label style={{fontWeight:'bold'}}>Nombre:</label>
            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{padding:'8px'}} />

            <label style={{fontWeight:'bold'}}>Cantidad Esperada:</label>
            <input type="number" value={formData.expectedGuests} onChange={e => setFormData({...formData, expectedGuests: e.target.value})} style={{padding:'8px'}} />

            <label style={{fontWeight:'bold', color:'#2E7D32'}}>Precio Total Acordado ($):</label>
            <p style={{fontSize:'0.8em', color:'#666', margin:0}}>Al cambiar esto, se ajustará la deuda en el folio automáticamente.</p>
            <input type="number" step="0.01" value={formData.agreedPrice} onChange={e => setFormData({...formData, agreedPrice: e.target.value})} style={{padding:'8px', border:'2px solid #2E7D32', fontWeight:'bold'}} />

            <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                <button type="button" onClick={onClose} style={{flex:1, padding:'10px'}}>Cancelar</button>
                <button type="submit" disabled={loading} style={{flex:1, padding:'10px', backgroundColor:'#1565c0', color:'white', border:'none'}}>
                    {loading ? 'Guardando...' : 'Guardar y Sincronizar'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

export default EditGroupModal;