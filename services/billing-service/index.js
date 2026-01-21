const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');
const billingRoutes = require('./src/routes/billingRoutes');

const Folio = require('./src/models/Folio');
const Charge = require('./src/models/Charge');

const app = express();
const port = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

Folio.hasMany(Charge, { foreignKey: 'folioId' });
Charge.belongsTo(Folio, { foreignKey: 'folioId' });

connectDB();

app.use('/api/billing', billingRoutes);

app.listen(port, () => {
  console.log(`💸 Billing Service corriendo en http://localhost:${port}`);
});