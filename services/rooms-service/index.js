const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
// Importaremos las rutas pronto
const roomRoutes = require('./src/routes/roomRoutes');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

connectDB();

// Rutas
app.use('/api/rooms', roomRoutes);

app.listen(port, () => {
  console.log(`🏨 Rooms Service corriendo en http://localhost:${port}`);
});