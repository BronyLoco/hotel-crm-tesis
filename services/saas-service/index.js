const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const saasRoutes = require('./src/routes/saasRoutes');

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/saas', saasRoutes);

app.listen(port, () => {
  console.log(`🚀 SaaS Service corriendo en http://localhost:${port}`);
});