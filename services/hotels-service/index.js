const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');

const hotelRoutes = require('./src/routes/hotelRoutes'); 

const app = express();
const port = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/hotels', hotelRoutes); 

app.listen(port, () => {
  console.log(`🏨 Hotels Service corriendo en http://localhost:${port}`);
});