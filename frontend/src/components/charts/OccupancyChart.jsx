import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  AVAILABLE: '#4CAF50', // Verde
  OCCUPIED: '#F44336',  // Rojo
  PARTIALLY_OCCUPIED: '#2196F3', // Azul
  DIRTY: '#FF9800',     // Naranja
  MAINTENANCE: '#9E9E9E' // Gris
};

const RADIAN = Math.PI / 180;

// ESTA FUNCIÓN SOLO DIBUJA EL NUMERITO (%)
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (percent > 0) ? (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

function OccupancyChart({ rooms }) {
  // 1. Procesar datos: Contar cuántas hay de cada estado
  const dataMap = {};
  
  rooms.forEach(r => {
    const status = r.status;
    if (!dataMap[status]) dataMap[status] = 0;
    dataMap[status]++;
  });

  // Convertir a formato para Recharts
  const data = Object.keys(dataMap).map(status => ({
    name: status.replace('_', ' '),
    value: dataMap[status],
    color: COLORS[status] || '#000'
  }));

  if (rooms.length === 0) return <p style={{textAlign:'center', color:'#999'}}>Sin datos de habitaciones.</p>;

  return (
    // CONTENEDOR PRINCIPAL CON TAMAÑO DEFINIDO
    <div style={{ width: '100%', height: '300px', backgroundColor: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
      <h3 style={{textAlign: 'center', color: '#555', marginBottom: 0}}>Estado del Hotel</h3>
      
      {/* WRAPPER INTERNO PARA RESPONSIVECONTAINER */}
      <div style={{ width: '100%', height: '90%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel} // Aquí llamamos a la función pequeña
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default OccupancyChart;