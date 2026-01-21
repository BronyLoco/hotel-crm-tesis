const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Plan = sequelize.define('Plan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }, // Ej: "Basic", "Gold"
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // Ej: 29.99
  maxHotels: { type: DataTypes.INTEGER, defaultValue: 1 } // Cuantos hoteles permite
}, { timestamps: false });

module.exports = Plan;