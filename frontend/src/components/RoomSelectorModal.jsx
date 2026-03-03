import { useState, useEffect } from 'react';
import { getRooms } from '../services/roomService';

function RoomSelectorModal({ onClose, onSelect, title = "Seleccionar Habitación" }) {
  const [rooms, setRooms] = useState([]);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    getRooms().then(data => {
        // Solo mostrar disponibles
        setRooms(data.filter(r => 
            r.status === 'AVAILABLE' ||
            (r.status === 'PARTIALLY_OCCUPIED' && r.currentOccupancy < r.maxOccupancy)
        ));
    });
  }, []);

  // Obtener tipos únicos para el filtro
  const types = [...new Set(rooms.map(r => r.RoomType?.name))];

  return (
    <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div style={{background:'white', padding:'20px', borderRadius:'8px', width:'600px', maxHeight:'80vh', overflowY:'auto'}}>
        
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
            <h3 style={{margin:0, color:'#1565c0'}}>{title}</h3>
            <button onClick={onClose} style={{border:'none', background:'none', fontSize:'1.5em', cursor:'pointer'}}>&times;</button>
        </div>

        {/* Filtro */}
        <div style={{marginBottom:'15px'}}>
            <label style={{marginRight:'10px'}}>Filtrar por tipo:</label>
            <select onChange={(e) => setFilterType(e.target.value)} style={{padding:'5px'}}>
                <option value="ALL">Todos</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>

        {/* Grid de Habitaciones */}
        <div style={{display:'flex', flexWrap:'wrap', gap:'10px'}}>
            {rooms
                .filter(r => filterType === 'ALL' || r.RoomType?.name === filterType)
                .map(room => (
                <div key={room.id} 
                     onClick={() => onSelect(room)}
                     style={{
                        padding:'15px', 
                        border:'2px solid #4CAF50', 
                        borderRadius:'8px', 
                        cursor:'pointer', 
                        width:'100px', 
                        textAlign:'center', 
                        backgroundColor: room.status === 'PARTIALLY_OCCUPIED' ? '#BBDEFB' : '#E8F5E9'
                     }}
                     onMouseEnter={e => e.currentTarget.style.backgroundColor = '#C8E6C9'}
                     onMouseLeave={e => e.currentTarget.style.backgroundColor = '#E8F5E9'}
                >
                    <div style={{fontWeight:'bold', fontSize:'1.2em'}}>{room.number}</div>
                    <div style={{fontSize:'0.8em'}}>{room.RoomType?.name}</div>
                    <div style={{fontSize:'0.8em', color:'#1565c0'}}>${room.RoomType?.basePrice}</div>
                    <div style={{fontSize:'0.7em', color:'#666'}}>Cap: {room.maxOccupancy}</div>
                </div>
            ))}
            {rooms.length === 0 && <p>No hay habitaciones disponibles limpias.</p>}
        </div>

      </div>
    </div>
  );
}

export default RoomSelectorModal;