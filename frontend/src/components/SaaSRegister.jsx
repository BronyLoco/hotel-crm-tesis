import { useState, useEffect } from 'react';
import { getPlans, registerManager, processPayment } from '../services/saasService';

function SaaSRegister() {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '', companyName: '', username: '', password: ''
  });
  
  const [cardData, setCardData] = useState({ number: '', exp: '', cvv: '' });
  const [createdTenantId, setCreatedTenantId] = useState(null);

  useEffect(() => {
    // Cargar planes al inicio
    getPlans()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        } else {
          // Si no hay planes, mostramos error visual
          alert("⚠️ No hay planes cargados en el sistema. Ejecuta el Seed.");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Error de conexión con SaaS Service. Revisa la consola.");
      });
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await registerManager({
        ...formData,
        planId: selectedPlan.id
      });
      setCreatedTenantId(res.tenant.id);
      setStep(3); 
    } catch (error) {
      console.error("Error detallado:", error);
      
      // Intentamos obtener el mensaje "details" que mandamos desde el backend
      const serverMsg = error.response?.data?.message;
      const details = error.response?.data?.details;
      
      alert(`❌ Fallo el registro:\n${serverMsg}\nDetalle: ${details || 'Sin detalles'}`);
    } finally {
      setLoading(false);
    }
  };

const handlePay = async (e) => {
    e.preventDefault();
    
    // --- DIAGNÓSTICO ---
    console.log("INTENTANDO PAGAR:");
    console.log("Tenant ID (Empresa):", createdTenantId);
    console.log("Tarjeta:", cardData.number);

    if (!createdTenantId) {
        return alert("Error Crítico: No se generó el ID de la empresa. Por favor recargue y regístrese de nuevo.");
    }
    // -------------------

    try {
      setLoading(true);
      
      // 1. Llamada al Backend (Simulación de pasarela)
      await processPayment(createdTenantId, cardData.number);
      
      // 2. Si pasa aquí, es éxito (200 OK)
      alert("✅ ¡Pago Aprobado! Su cuenta está activa. Redirigiendo al Login...");
      window.location.href = "/"; 

    } catch (error) {
      console.error("Error de Pago:", error);
      
      // 3. Manejo de errores detallado
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      alert(`❌ Error en el pago: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1565c0' }}>🚀 Hotel CRM - Registro de Gerencia</h1>

      {/* PASO 1: ELEGIR PLAN */}
      {step === 1 && (
        <div>
          <h3 style={{ textAlign: 'center' }}>Seleccione su Plan</h3>
          {plans.length === 0 && <p style={{textAlign:'center'}}>Cargando planes...</p>}
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {plans.map(plan => (
              <div key={plan.id} style={{ 
                border: '2px solid #ddd', borderRadius: '10px', padding: '20px', width: '200px', textAlign: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
              }}>
                <h3>{plan.name}</h3>
                <h2 style={{ color: '#2E7D32' }}>${plan.price} <small>/mes</small></h2>
                <p>Hasta {plan.maxHotels} Hoteles</p>
                <button 
                  onClick={() => { setSelectedPlan(plan); setStep(2); }}
                  style={{ backgroundColor: '#1565c0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Elegir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PASO 2: TUS DATOS (Con fix de Autocomplete) */}
      {step === 2 && (
        <div style={{ maxWidth: '400px', margin: '0 auto', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
          <h3>Datos de la Cuenta ({selectedPlan.name})</h3>
          
          {/* autoComplete="off" en el form ayuda a prevenir el rellenado global */}
          <form onSubmit={handleRegister} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <input 
              placeholder="Nombre Completo" required 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})} 
              style={{padding:'8px'}} 
            />
            
            <input 
              placeholder="Nombre de su Cadena / Hotel" required 
              value={formData.companyName} 
              onChange={e => setFormData({...formData, companyName: e.target.value})} 
              style={{padding:'8px'}} 
            />
            
            {/* Fix Autocomplete: new-password o random string */}
            <input 
              type="text"
              placeholder="Usuario para Login" required 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              autoComplete="new-user-crm"
              style={{padding:'8px'}} 
            />
            
            <input 
              type="password" 
              placeholder="Contraseña" required 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              autoComplete="new-password"
              style={{padding:'8px'}} 
            />
            
            <button type="submit" disabled={loading} style={{ backgroundColor: '#1565c0', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {loading ? 'Creando cuenta...' : 'Continuar al Pago'}
            </button>
            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>Atrás</button>
          </form>
        </div>
      )}

      {/* PASO 3: PASARELA DE PAGO FICTICIA */}
      {step === 3 && (
        <div style={{ maxWidth: '400px', margin: '0 auto', border: '2px solid #2E7D32', padding: '20px', borderRadius: '8px', backgroundColor: '#f9fff9' }}>
          <h3>💳 Pago Seguro (Simulador)</h3>
          <p>Total a pagar: <strong>${selectedPlan.price}</strong></p>
          <p style={{fontSize:'0.8em', color:'#666'}}>Use una tarjeta que empiece con <strong>4</strong> para aprobar.</p>
          
          <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              placeholder="Número de Tarjeta (4242...)" required maxLength={16}
              value={cardData.number} 
              onChange={e => setCardData({...cardData, number: e.target.value})} 
              style={{padding:'10px', fontSize:'1.1em', letterSpacing:'2px'}} 
            />
            <div style={{display:'flex', gap:'10px'}}>
              <input placeholder="MM/YY" required style={{flex:1, padding:'8px'}} />
              <input placeholder="CVV" required style={{flex:1, padding:'8px'}} />
            </div>
            
            <button type="submit" disabled={loading} style={{ backgroundColor: '#2E7D32', color: 'white', padding: '12px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Procesando con el Banco...' : `Pagar $${selectedPlan.price}`}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

export default SaaSRegister;