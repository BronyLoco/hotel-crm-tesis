import { useState, useEffect } from 'react';
import { getRevenueReport } from '../services/billingService';
import { getRooms } from '../services/roomService'; // <--- IMPORTAR
import RevenueChart from './charts/RevenueChart';   // <--- IMPORTAR
import OccupancyChart from './charts/OccupancyChart'; // <--- IMPORTAR

function ReportsPanel() {
  const [dates, setDates] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState(null);
  const [roomsData, setRoomsData] = useState([]); // Estado para habitaciones

  // Cargar habitaciones al montar (para el gráfico de torta actual)
  useEffect(() => {
    getRooms().then(setRoomsData).catch(console.error);
  }, []);

  const generateReport = async () => {
    try {
      const endDateAdjusted = new Date(dates.end);
      endDateAdjusted.setHours(23, 59, 59);
      
      const data = await getRevenueReport(dates.start, endDateAdjusted.toISOString());
      setReportData(data);
    } catch (error) {
      alert("Error generando reporte");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f6f8', minHeight: '80vh' }}>
      
      {/* CONTROLES */}
      <div className="no-print" style={{ marginBottom: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
           <h2 style={{margin:0, color:'#1565c0'}}>📊 Inteligencia de Negocio</h2>
           <p style={{margin:0, color:'#666'}}>Seleccione un rango para analizar finanzas.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label>Desde:</label><br/>
            <input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}}/>
          </div>
          <div>
            <label>Hasta:</label><br/>
            <input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} style={{padding:'8px', borderRadius:'4px', border:'1px solid #ccc'}}/>
          </div>
          <button onClick={generateReport} style={{ padding: '10px 20px', backgroundColor: '#1565c0', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px', fontWeight:'bold' }}>
            Generar
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            🖨️
          </button>
        </div>
      </div>

      {/* ÁREA DE GRÁFICOS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>
         {/* Gráfico 1: Agregamos minWidth: 0 para evitar el error de Recharts */}
         <div style={{ minWidth: 0 }}>
            <OccupancyChart rooms={roomsData} />
         </div>

         {/* Gráfico 2: Agregamos minWidth: 0 */}
         <div style={{ minWidth: 0 }}>
            {reportData ? (
                <RevenueChart folios={reportData.folios} />
            ) : (
                <div style={{height: '300px', backgroundColor:'white', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>
                    Genere un reporte para ver tendencias financieras.
                </div>
            )}
         </div>
      </div>

      {/* ÁREA IMPRIMIBLE (TABLAS DETALLADAS) */}
      {reportData && (
        <div id="printable-area" style={{backgroundColor: 'white', padding: '40px', borderRadius: '8px'}}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h1 style={{margin:0}}>REPORTE EJECUTIVO</h1>
            <p style={{color:'#666'}}>Período: {dates.start} al {dates.end}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
            <div style={{textAlign: 'center'}}>
              <h3 style={{margin:0}}>Total Recaudado</h3>
              <span style={{ fontSize: '2.5em', color: '#2E7D32', fontWeight: 'bold' }}>${reportData.totalRevenue.toFixed(2)}</span>
            </div>
            <div style={{textAlign: 'center'}}>
              <h3 style={{margin:0}}>Transacciones</h3>
              <span style={{ fontSize: '2.5em', color: '#1565c0', fontWeight: 'bold' }}>{reportData.count}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000', backgroundColor: '#eee' }}>
                <th style={{textAlign:'left', padding:'10px'}}>Folio #</th>
                <th style={{textAlign:'left', padding:'10px'}}>Fecha Pago</th>
                <th style={{textAlign:'left', padding:'10px'}}>Concepto Principal</th>
                <th style={{textAlign:'right', padding:'10px'}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {reportData.folios.map(folio => (
                <tr key={folio.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{padding:'10px'}}>#{folio.id}</td>
                  <td style={{padding:'10px'}}>{new Date(folio.updatedAt).toLocaleDateString()}</td>
                  <td style={{padding:'10px', fontSize:'0.9em'}}>
                      {folio.Charges && folio.Charges.length > 0 ? folio.Charges[0].description + (folio.Charges.length > 1 ? '...' : '') : 'Varios'}
                  </td>
                  <td style={{textAlign:'right', padding:'10px', fontWeight:'bold'}}>${parseFloat(folio.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '50px', display:'flex', justifyContent:'space-between', paddingTop: '10px' }}>
            <div style={{textAlign:'center', width:'200px', borderTop:'1px solid #000'}}>Firma Auditoría</div>
            <div style={{textAlign:'center', width:'200px', borderTop:'1px solid #000'}}>Firma Gerencia</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPanel;