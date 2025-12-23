const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const reservationRoutes = require('./src/routes/reservationRoutes');

const app = express();
const port = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/reservations', reservationRoutes);

app.listen(port, () => {
  console.log(`📅 Reservations Service corriendo en http://localhost:${port}`);
});