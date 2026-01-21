import { useState, useEffect } from 'react';
import { getRevenueReport } from '../services/billingService';

function ReportsPanel() {
  const [dates, setDates] = useState({
    start: new Date().toISOString().split('T')[0], // Hoy
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    try {
      // Ajustamos la fecha fin para que incluya todo el día (hasta las 23:59)
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
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', minHeight: '80vh' }}>
      
      {/* CONTROLES (Se ocultan al imprimir) */}
      <div className="no-print" style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h2>📊 Reportes Financieros</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div>
            <label>Desde:</label><br/>
            <input type="date" value={dates.start} onChange={e => setDates({...dates, start: e.target.value})} style={{padding:'8px'}}/>
          </div>
          <div>
            <label>Hasta:</label><br/>
            <input type="date" value={dates.end} onChange={e => setDates({...dates, end: e.target.value})} style={{padding:'8px'}}/>
          </div>
          <button onClick={generateReport} style={{ padding: '10px 20px', backgroundColor: '#1565c0', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            Generar
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 20px', backgroundColor: '#555', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* ÁREA IMPRIMIBLE */}
      {reportData && (
        <div id="printable-area">
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h1>REPORTE DE INGRESOS</h1>
            <p>Período: {dates.start} al {dates.end}</p>
            <p>Generado el: {new Date().toLocaleString()}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>
            <div style={{textAlign: 'center'}}>
              <h3>Total Recaudado</h3>
              <span style={{ fontSize: '2em', color: '#2E7D32', fontWeight: 'bold' }}>${reportData.totalRevenue.toFixed(2)}</span>
            </div>
            <div style={{textAlign: 'center'}}>
              <h3>Transacciones</h3>
              <span style={{ fontSize: '2em', color: '#1565c0', fontWeight: 'bold' }}>{reportData.count}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{textAlign:'left', padding:'10px'}}>Folio #</th>
                <th style={{textAlign:'left', padding:'10px'}}>Fecha Pago</th>
                <th style={{textAlign:'right', padding:'10px'}}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {reportData.folios.map(folio => (
                <tr key={folio.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{padding:'10px'}}>Folio-{folio.id} (Reserva #{folio.reservationId})</td>
                  <td style={{padding:'10px'}}>{new Date(folio.updatedAt).toLocaleDateString()}</td>
                  <td style={{textAlign:'right', padding:'10px'}}>${parseFloat(folio.totalAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '50px', borderTop: '1px solid #000', width: '200px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center', paddingTop: '10px' }}>
            Firma Responsable
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPanel;