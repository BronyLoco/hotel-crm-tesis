import { useState, useEffect } from 'react';
import { getGuests, updateGuest } from '../services/guestService';
import { getReservations } from '../services/reservationService';

function GuestList({ refreshTrigger }) {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Cargar Huéspedes y Reservas en paralelo
      const [guestsData, reservationsData] = await Promise.all([
        getGuests(),
        getReservations() // Esto trae el historial del hotel
      ]);

      // 2. Calcular Fidelización (Conteo de visitas)
      const guestsWithStats = guestsData.map(guest => {
        
        // CORRECCIÓN: Filtramos por estado
        const visitCount = reservationsData.filter(r => 
            r.guestId === guest.id && 
            (r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT')
        ).length;
        return { ...guest, visitCount };
      });

      // Ordenar por fidelidad (Más visitas primero)
      setGuests(guestsWithStats.sort((a, b) => b.visitCount - a.visitCount));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [refreshTrigger]);

  // Función rápida para cambiar VIP desde la lista
  const toggleVip = async (guest) => {
    try {
      const newStatus = !guest.isVip;
      await updateGuest(guest.id, { isVip: newStatus });
      // Actualizamos localmente para feedback inmediato
      setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, isVip: newStatus } : g));
    } catch (e) { alert("Error actualizando VIP"); }
  };

  // Filtrado
  const filteredGuests = guests.filter(g => 
    g.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.documentId.includes(searchTerm)
  );

  if (loading) return <p style={{textAlign:'center', padding:'20px'}}>Analizando base de datos...</p>;

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
      
      {/* HEADER DE LA LISTA */}
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor:'#f8f9fa' }}>
        <h3 style={{ margin: 0, color: '#333' }}>📇 Base de Datos de Clientes</h3>
        <input 
          placeholder="🔍 Buscar por nombre o DNI..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '250px' }}
        />
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
          <thead style={{ backgroundColor: '#eee', position: 'sticky', top: 0 }}>
            <tr style={{textAlign:'left'}}>
              <th style={{padding:'10px'}}>Huésped</th>
              <th>DNI / Pasaporte</th>
              <th>Origen</th>
              <th style={{textAlign:'center'}}>Visitas</th>
              <th>Estatus</th>
              <th style={{textAlign:'center'}}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr key={guest.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>
                  <div style={{fontWeight:'bold'}}>{guest.firstName} {guest.lastName}</div>
                  <small style={{color:'#666'}}>{guest.email || 'Sin email'}</small>
                </td>
                <td>{guest.documentId}</td>
                <td>{guest.country || '-'}</td>
                
                {/* COLUMNA DE FIDELIZACIÓN */}
                <td style={{textAlign:'center'}}>
                   <span style={{
                       backgroundColor: guest.visitCount > 2 ? '#E8F5E9' : '#f5f5f5',
                       color: guest.visitCount > 2 ? '#2E7D32' : '#666',
                       padding: '4px 10px', borderRadius: '15px', fontWeight: 'bold'
                   }}>
                      {guest.visitCount}
                   </span>
                </td>

                {/* COLUMNA DE ESTATUS VIP */}
                <td>
                   {guest.isVip && <span style={{color:'gold', textShadow:'0px 0px 1px black'}}>★ VIP</span>}
                   {guest.visitCount > 4 && !guest.isVip && <span style={{fontSize:'0.8em', color:'#1565c0', marginLeft:'5px'}}>(Frecuente)</span>}
                </td>

                <td style={{textAlign:'center'}}>
                  <button 
                    onClick={() => toggleVip(guest)}
                    title={guest.isVip ? "Quitar VIP" : "Hacer VIP"}
                    style={{
                        cursor:'pointer', border:'1px solid #ccc', backgroundColor: guest.isVip ? '#fff3cd' : 'white',
                        padding:'5px 10px', borderRadius:'4px'
                    }}
                  >
                    {guest.isVip ? 'Quitar ★' : 'Dar ★'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:'10px', fontSize:'0.8em', color:'#666', textAlign:'center', backgroundColor:'#f9f9f9'}}>
         Total Registrados: {guests.length} | Clientes Frecuentes: {guests.filter(g => g.visitCount > 2).length}
      </div>
    </div>
  );
}

export default GuestList;