const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  action: { type: DataTypes.STRING, allowNull: false }, // Ej: "CHECK_IN", "PAYMENT"
  details: { type: DataTypes.TEXT }, // JSON stringified con datos extra
  userId: { type: DataTypes.INTEGER }, // Quién lo hizo
  username: { type: DataTypes.STRING }, // Nombre para no buscar en auth
  hotelId: { type: DataTypes.INTEGER },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = AuditLog;