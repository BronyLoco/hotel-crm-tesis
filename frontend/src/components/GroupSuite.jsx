import { useState } from 'react';
import EventManager from './EventManager';
import GroupManager from './GroupManager';

function GroupSuite({ onUpdate }) {
  const [tab, setTab] = useState('process'); // 'process' (Llegadas) o 'manage' (Crear códigos)

  return (
    <div style={{ marginTop: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', backgroundColor: '#eee' }}>
        <button 
           onClick={() => setTab('process')}
           style={{ flex:1, padding:'10px', border:'none', background: tab==='process'?'white':'#eee', fontWeight: tab==='process'?'bold':'normal', cursor:'pointer' }}
        >
           🚌 Recepción de Grupos
        </button>
        <button 
           onClick={() => setTab('manage')}
           style={{ flex:1, padding:'10px', border:'none', background: tab==='manage'?'white':'#eee', fontWeight: tab==='manage'?'bold':'normal', cursor:'pointer' }}
        >
           ⚙️ Admin Eventos
        </button>
      </div>

      <div style={{ padding: '10px', backgroundColor: 'white' }}>
         {tab === 'process' && <GroupManager onUpdate={onUpdate} />}
         {tab === 'manage' && <EventManager onUpdate={onUpdate} />}
      </div>
    </div>
  );
}

export default GroupSuite;