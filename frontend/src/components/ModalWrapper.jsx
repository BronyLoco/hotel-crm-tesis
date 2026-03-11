import React from 'react';

function ModalWrapper({ children, title, onClose }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000
    }}>
      <div style={{ 
          backgroundColor: 'white', borderRadius: '12px', padding: '0', 
          width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <div style={{
            padding: '15px 20px', borderBottom: '1px solid #eee', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#f8f9fa', borderTopLeftRadius: '12px', borderTopRightRadius: '12px'
        }}>
            <h3 style={{margin:0, color: '#333'}}>{title}</h3>
            <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5em', cursor:'pointer', color:'#666'}}>&times;</button>
        </div>
        <div style={{padding: '20px'}}>
            {children}
        </div>
      </div>
    </div>
  );
}

export default ModalWrapper;