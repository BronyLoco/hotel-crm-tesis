const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const guestRoutes = require('./src/routes/guestRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json()); // Vital para leer JSON en los POST

// Conexión a Base de Datos
connectDB();

// Rutas
app.use('/api/guests', guestRoutes);

app.get('/health', (req, res) => {
  res.json({ service: 'Guests Service', status: 'Active' });
});

// Iniciar
app.listen(port, () => {
  console.log(`🚀 Guests Service corriendo en http://localhost:${port}`);
});