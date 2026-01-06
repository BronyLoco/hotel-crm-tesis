const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);

app.listen(port, () => {
  console.log(`🔐 Auth Service corriendo en http://localhost:${port}`);
});