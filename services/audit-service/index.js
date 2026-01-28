const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');


const auditRoutes = require('./src/routes/auditRoutes');


const AuditLog = require('./src/models/AuditLog');

const app = express();
const port = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

// Conectar DB
connectDB();

// Rutas
app.use('/api/audit', auditRoutes);

app.listen(port, () => {
  console.log(`🕵️‍♂️ Audit Service corriendo en http://localhost:${port}`);
});