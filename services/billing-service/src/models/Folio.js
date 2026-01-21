const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Folio = sequelize.define('Folio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true // Una reserva solo tiene un folio activo
  },
  hotelId: { 
    type: DataTypes.INTEGER, allowNull: false
  },
  status: {
    type: DataTypes.STRING, // 'OPEN', 'CLOSED', 'PAID'
    defaultValue: 'OPEN'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  }
});

module.exports = Folio;