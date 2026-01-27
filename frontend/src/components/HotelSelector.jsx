import { useState, useEffect } from 'react';
import { getTenantByUser } from '../services/saasService';
import { getMyHotels, createHotel } from '../services/hotelService';

function HotelSelector({ user, onHotelSelected }) {
  const [tenant, setTenant] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Formulario nuevo hotel
  const [newHotel, setNewHotel] = useState({ name: '', address: '', stars: 3 });

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Obtener Tenant (Solo si soy Manager)
        let currentTenantId = null;
        
        if (user.role === 'MANAGER') {
            const tenantData = await getTenantByUser(user.id);
            setTenant(tenantData);
            currentTenantId = tenantData.id;
        }

        // 2. Obtener Hoteles (Pasando USER completo y el ID de empresa)
        // CORRECCIÓN AQUÍ: Pasamos 'user' como primer argumento
        const hotelsData = await getMyHotels(user, currentTenantId);
        setHotels(hotelsData);
        
        if (user.role === 'MANAGER' && hotelsData.length === 0) setShowCreate(true);

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user.id, user.role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createHotel({ ...newHotel, tenantId: tenant.id });
      alert("✅ Hotel creado exitosamente");
      // Recargar lista
      const updatedHotels = await getMyHotels(user, tenant.id);
      setHotels(updatedHotels);
      setShowCreate(false);
    } catch (error) {
      alert("Error creando hotel");
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Cargando sus propiedades...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
      
      <h1 style={{ color: '#1565c0' }}>🏢 Bienvenido, {tenant?.companyName}</h1>
      <p>Seleccione una sucursal para administrar:</p>

      {/* LISTA DE HOTELES */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', maxWidth: '800px', justifyContent: 'center' }}>
        {hotels.map(hotel => (
          <div key={hotel.id} onClick={() => onHotelSelected(hotel)}
               style={{ 
                 width: '200px', padding: '20px', backgroundColor: 'white', borderRadius: '10px', 
                 boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', textAlign: 'center',
                 border: '2px solid transparent', transition: 'all 0.2s'
               }}
               onMouseEnter={e => e.currentTarget.style.borderColor = '#1565c0'}
               onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
          >
            <div style={{ fontSize: '3em' }}>🏨</div>
            <h3>{hotel.name}</h3>
            <p style={{color:'#666'}}>{hotel.address}</p>
            <span style={{color:'#FFD700'}}>{"★".repeat(hotel.stars)}</span>
          </div>
        ))}

        {/* TARJETA DE "AGREGAR NUEVO" */}
        {!showCreate && user.role === 'MANAGER' && (
          <div onClick={() => setShowCreate(true)}
               style={{ 
                 width: '200px', padding: '20px', border: '2px dashed #ccc', borderRadius: '10px', 
                 display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color:'#666'
               }}>
            <span style={{fontSize:'3em'}}>+</span>
            <h3>Agregar Sede</h3>
          </div>
        )}
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      {showCreate && (
        <div style={{ marginTop: '40px', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '400px' }}>
          <h3>Nueva Sucursal</h3>
          <form onSubmit={handleCreate} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
            <input placeholder="Nombre del Hotel" required value={newHotel.name} onChange={e => setNewHotel({...newHotel, name: e.target.value})} style={{padding:'10px'}}/>
            <input placeholder="Dirección" required value={newHotel.address} onChange={e => setNewHotel({...newHotel, address: e.target.value})} style={{padding:'10px'}}/>
            <label>Estrellas:</label>
            <select value={newHotel.stars} onChange={e => setNewHotel({...newHotel, stars: parseInt(e.target.value)})} style={{padding:'10px'}}>
                <option value="1">1 Estrella</option>
                <option value="2">2 Estrellas</option>
                <option value="3">3 Estrellas</option>
                <option value="4">4 Estrellas</option>
                <option value="5">5 Estrellas</option>
            </select>
            <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
                <button type="submit" style={{flex:1, backgroundColor:'#2E7D32', color:'white', padding:'10px', border:'none', borderRadius:'5px', cursor:'pointer'}}>Crear</button>
                {hotels.length > 0 && <button type="button" onClick={() => setShowCreate(false)} style={{flex:1, padding:'10px', cursor:'pointer'}}>Cancelar</button>}
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default HotelSelector;