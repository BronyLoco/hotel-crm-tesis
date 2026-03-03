const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GroupEvent = sequelize.define('GroupEvent', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false }, // Ej: "Boda de Juan"
  code: { type: DataTypes.STRING, allowNull: false, unique: true }, // Ej: "BODA2026"
  expectedGuests: { type: DataTypes.INTEGER, defaultValue: 0 },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  tenantId: { type: DataTypes.INTEGER, allowNull: false },
  agreedPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  contactName: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('DRAFT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'), defaultValue: 'CONFIRMED' },
  roomRequirements: { type: DataTypes.JSONB, defaultValue: [] },
  agreedPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
});

module.exports = GroupEvent;