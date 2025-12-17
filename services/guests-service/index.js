const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de Base de Datos
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Conexión a la BD
client.connect()
  .then(() => console.log('🟢 Conectado exitosamente a PostgreSQL (guests_db)'))
  .catch(err => console.error('🔴 Error de conexión a la BD:', err));

// Rutas
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Guests Service', 
    status: 'Active', 
    timestamp: new Date() 
  });
});

// Iniciar Servidor
app.listen(port, () => {
  console.log(`🚀 Guests Service corriendo en http://localhost:${port}`);
});