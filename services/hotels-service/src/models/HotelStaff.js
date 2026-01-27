const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HotelStaff = sequelize.define('HotelStaff', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hotelId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }, // ID del recepcionista
  role: { type: DataTypes.STRING, defaultValue: 'RECEPTIONIST' }
});

module.exports = HotelStaff;