import { useEffect, useState } from 'react';
import axios from 'axios';
import { getFolioByReservation, addCharge, payFolio, createFolio } from '../services/billingService';

// Ajustar URL si es necesario, pero debería usar la del servicio o proxy
const API_URL_BILLING = 'http://localhost:8080/api/billing';

function BillingModal({ reservationId, groupId, onClose, onPaymentSuccess, defaultPayer }) {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados formularios
  const [newCharge, setNewCharge] = useState({ description: '', amount: '' });
  const [category, setCategory] = useState('Minibar');
  const [detail, setDetail] = useState('');
  const [dealData, setDealData] = useState({ payerName: defaultPayer ||'', days: 3, totalAmount: 0 });

  // --- LÓGICA DE CARGA SIMPLIFICADA Y VERBOSA ---
  useEffect(() => {
    const initFolio = async () => {
        console.log("🚀 [BillingModal] Iniciando carga...");
        setLoading(true);
        
        try {
            let data = null;
            
            // 1. INTENTO DE BÚSQUEDA
            try {
                if (reservationId) {
                    data = await getFolioByReservation(reservationId);
                } else if (groupId) {
                    const res = await axios.get(`${API_URL_BILLING}/group/${groupId}`);
                    data = res.data;
                }
                
                console.log("🔍 Resultado búsqueda:", data);

            } catch (searchError) {
                // Si el error NO es 404, es un error real, lo lanzamos
                if (!searchError.response || searchError.response.status !== 404) {
                    throw searchError;
                }
                // Si es 404, data se queda en null y pasamos al siguiente bloque
                data = null;
            }

            // 2. LÓGICA DE CREACIÓN (Si no se encontró o vino null)
            if (!data) {
                console.warn("⚠️ Folio no existe (es null o 404). Creando uno nuevo...");
                try {
                    // Crear el folio automáticamente
                    data = await createFolio(reservationId || null, groupId || null);
                    console.log("✨ Folio creado exitosamente:", data);
                } catch (createError) {
                    console.error("🔴 Error fatal creando folio:", createError);
                    alert("No se pudo iniciar la cuenta. Revise la consola.");
                    return; // Salir
                }
            }

            // 3. ESTABLECER DATOS
            setFolio(data);

        } catch (err) {
            console.error("💥 Error general:", err);
            // No cerramos, mostramos el error en la UI (que ya tiene el manejo de !folio)
        } finally {
            setLoading(false);
        }
    };

    initFolio();
  }, [reservationId, groupId]);


  // --- HANDLERS (Igual que antes) ---
  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!detail || !newCharge.amount || !folio) return;
    try {
      const finalDesc = `${category}: ${detail}`;
      await addCharge(folio.id, finalDesc, parseFloat(newCharge.amount));
      // Recarga rápida sucia para ver cambios
      setLoading(true);
      const updated = reservationId ? await getFolioByReservation(reservationId) : (await axios.get(`${API_URL_BILLING}/group/${groupId}`)).data;
      setFolio(updated);
      setDetail(''); setNewCharge({ ...newCharge, amount: '' });
    } catch (error) { alert("Error agregando cargo"); console.error(error); } 
    finally { setLoading(false); }
  };

  const handleSetupDeal = async (e) => {
      e.preventDefault();
      try {
          const desc = `Paquete Delegación (${dealData.days} días) - A cargo de: ${dealData.payerName}`;
          await addCharge(folio.id, desc, parseFloat(dealData.totalAmount));
          alert("✅ Acuerdo registrado.");
          // Recarga simple
          onClose(); // Cerrar para obligar a refrescar al abrir de nuevo (más seguro)
      } catch (error) { alert("Error"); }
  };

  const handlePayment = async () => {
    if (!confirm("¿Confirmar pago?")) return;
    try {
      await payFolio(folio.id);
      alert("✅ Pagado.");
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (error) { alert("Error pago"); console.error(error); }
  };


  // --- RENDER ---
  if (loading) return (
      <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000}}>
          <h2>Cargando Cuenta...</h2>
      </div>
  );

  // Si falló y folio es null, mostramos error simple sin ocultar consola
  if (!folio) {
      return (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000}}>
              <div style={{background:'white', padding:'30px', borderRadius:'8px', textAlign:'center'}}>
                  <h3 style={{color:'red'}}>Error</h3>
                  <p>No se pudo cargar la cuenta.</p>
                  <p>Presiona <strong>F12</strong> y mira la pestaña <strong>Console</strong> para ver el error real.</p>
                  <button onClick={onClose}>Cerrar</button>
              </div>
          </div>
      );
  }

  // SI HAY FOLIO, MOSTRAR UI NORMAL
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight:'90vh', overflowY:'auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <div>
              <h2 style={{ margin: 0 }}>{groupId ? '💰 Cuenta Maestra' : `Factura #${reservationId}`}</h2>
              <small>Folio ID: {folio.id} | Estado: {folio.status}</small>
          </div>
          <button onClick={onClose} style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.5em' }}>&times;</button>
        </div>

        {/* SETUP GRUPO */}
        {groupId && parseFloat(folio.totalAmount) === 0 && folio.status === 'OPEN' && (
            <div style={{backgroundColor:'#fff3cd', padding:'15px', borderRadius:'8px', marginTop:'15px'}}>
                <h4>🤝 Acuerdo</h4>
                <form onSubmit={handleSetupDeal} style={{display:'grid', gap:'10px'}}>
                    <input placeholder="Responsable" required value={dealData.payerName} onChange={e=>setDealData({...dealData, payerName:e.target.value})} style={{padding:'5px'}} />
                    <input type="number" placeholder="Precio Total" value={dealData.totalAmount} onChange={e=>setDealData({...dealData, totalAmount:e.target.value})} style={{padding:'5px'}} />
                    <button type="submit">Registrar</button>
                </form>
            </div>
        )}

        {/* RESUMEN */}
        <div style={{ margin: '20px 0', textAlign: 'center', padding:'20px', background:'#f9f9f9', borderRadius:'8px' }}>
          <span style={{ fontSize: '1.2em' }}>Total:</span>
          <div style={{ fontSize: '3em', fontWeight: 'bold', color: folio.status === 'PAID' ? '#ccc' : '#2E7D32' }}>
            ${parseFloat(folio.totalAmount).toFixed(2)}
          </div>
          {folio.status !== 'PAID' && (
             <button onClick={handlePayment} style={{ marginTop: '10px', backgroundColor: '#000', color: '#fff', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>
               💳 Pagar
             </button>
          )}
        </div>

        {/* CARGOS */}
        <h4>Detalle</h4>
        <ul>
            {folio.Charges && folio.Charges.map(c => (
                <li key={c.id} style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', padding:'5px'}}>
                    <span>{c.description}</span>
                    <span>${c.amount}</span>
                </li>
            ))}
        </ul>

        {/* AGREGAR */}
        {folio.status === 'OPEN' && (
            <form onSubmit={handleAddCharge} style={{ display: 'flex', gap: '5px', marginTop:'20px' }}>
                <select value={category} onChange={e => setCategory(e.target.value)}><option>Minibar</option><option>Restaurante</option><option>Varios</option></select>
                <input placeholder="Detalle" value={detail} onChange={(e) => setDetail(e.target.value)} style={{flex:1}} />
                <input type="number" placeholder="$" value={newCharge.amount} onChange={(e) => setNewCharge({...newCharge, amount: e.target.value})} style={{width:'80px'}} />
                <button type="submit">+</button>
            </form>
        )}
      </div>
    </div>
  );
}

export default BillingModal;