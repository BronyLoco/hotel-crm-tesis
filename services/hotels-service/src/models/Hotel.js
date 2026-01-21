const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Hotel = sequelize.define('Hotel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING },
  stars: { type: DataTypes.INTEGER, defaultValue: 3 },
  // El ID del Tenant (Dueño) que viene del token de Auth
  tenantId: { type: DataTypes.INTEGER, allowNull: false }
});

module.exports = Hotel;