import { useEffect, useState } from 'react';
import { getFolioByReservation, addCharge, payFolio } from '../services/billingService';

function BillingModal({ reservationId, onClose }) {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estado para el formulario de nuevo cargo
  const [newCharge, setNewCharge] = useState({ description: '', amount: '' });

  // Cargar datos al abrir el modal
  const loadFolio = async () => {
    try {
      setLoading(true);
      const data = await getFolioByReservation(reservationId);
      setFolio(data);
    } catch (error) {
      alert("No se pudo cargar la cuenta. Quizás no se creó el folio.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) loadFolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId]);

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!newCharge.description || !newCharge.amount) return;

    try {
      await addCharge(folio.id, newCharge.description, parseFloat(newCharge.amount));
      // Recargar para ver el nuevo total
      await loadFolio();
      // Limpiar form
      setNewCharge({ description: '', amount: '' });
    } catch (error) {
      alert("Error al agregar cargo");
    }
  };
  const handlePayment = async () => {
    if (!confirm("¿Confirmar recepción del pago total?")) return;
    try {
      await payFolio(folio.id);
      alert("✅ Pago registrado. Cuenta cerrada.");
      await loadFolio(); // Recargar para ver estado PAID
    } catch (error) {
      alert("Error al procesar el pago");
    }
  };

  if (loading) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
        
        {/* ENCABEZADO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>💸 Cuenta (Folio #{folio.id})</h2>
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.5em' }}>&times;</button>
        </div>

         {/* RESUMEN */}
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <span style={{ fontSize: '1.2em', color: '#555' }}>Total a Pagar:</span>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: folio.status === 'PAID' ? '#ccc' : '#2E7D32' }}>
            ${folio.totalAmount}
          </div>
          
          {/* BOTÓN DE PAGO */}
          {folio.status !== 'PAID' ? (
             <button 
               onClick={handlePayment}
               style={{ marginTop: '10px', backgroundColor: '#000', color: '#fff', padding: '10px 20px', fontSize: '1.2em', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
             >
               💳 Registrar Pago
             </button>
          ) : (
            <div style={{color: 'green', fontWeight: 'bold', border: '2px solid green', display: 'inline-block', padding: '5px 10px', marginTop: '10px', transform: 'rotate(-5deg)'}}>
              PAGADO / PAID
            </div>
          )}
        </div>

        {/* LISTA DE CARGOS */}
        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9f9f9' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>Concepto</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {folio.Charges && folio.Charges.map(charge => (
                <tr key={charge.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{charge.description}</td>
                  <td style={{ textAlign: 'right', padding: '8px' }}>${charge.amount}</td>
                </tr>
              ))}
              {folio.Charges?.length === 0 && <tr><td colSpan="2" style={{textAlign:'center', padding:'10px'}}>Sin cargos extra</td></tr>}
            </tbody>
          </table>
        </div>

        {/* FORMULARIO AGREGAR CARGO */}
        <form onSubmit={handleAddCharge} style={{ display: 'flex', gap: '10px', backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '5px' }}>
          <input 
            placeholder="Ej. Cerveza, Lavandería..." 
            value={newCharge.description}
            onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
            style={{ flex: 2, padding: '5px' }}
            required
          />
          <input 
            type="number" 
            placeholder="$" 
            value={newCharge.amount}
            onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})}
            style={{ flex: 1, padding: '5px' }}
            step="0.01"
            required
          />
          <button type="submit" style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            +
          </button>
        </form>

      </div>
    </div>
  );
}

export default BillingModal;