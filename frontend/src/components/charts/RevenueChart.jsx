import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function RevenueChart({ folios }) {
  // 1. Agrupar ingresos por fecha (YYYY-MM-DD)
  const groupedData = {};

  folios.forEach(folio => {
    // Usamos updatedAt como fecha de pago
    const date = new Date(folio.updatedAt).toISOString().split('T')[0];
    if (!groupedData[date]) groupedData[date] = 0;
    groupedData[date] += parseFloat(folio.totalAmount);
  });

  // 2. Convertir a array ordenado por fecha
  const data = Object.keys(groupedData).sort().map(date => ({
    fecha: date,
    Ingresos: groupedData[date]
  }));

  if (data.length === 0) return <div style={{padding:'20px', textAlign:'center'}}>Sin movimientos financieros en este período.</div>;

  return (
    <div style={{ width: '100%', height: '300px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h3 style={{textAlign: 'center', color: '#555'}}>Ingresos por Día</h3>
      
      <div style={{ width: '100%', height: '90%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" fontSize={12} />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            <Legend />
            <Bar dataKey="Ingresos" fill="#1565c0" barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;