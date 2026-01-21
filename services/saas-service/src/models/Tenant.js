const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Plan = require('./Plan');

const Tenant = sequelize.define('Tenant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  companyName: { type: DataTypes.STRING, allowNull: false }, // Nombre de su empresa
  ownerUserId: { type: DataTypes.INTEGER, allowNull: false, unique: true }, // ID del usuario en Auth-Service
  status: { 
    type: DataTypes.ENUM('PENDING_PAYMENT', 'ACTIVE', 'SUSPENDED'),
    defaultValue: 'PENDING_PAYMENT' 
  },
  subscriptionId: { type: DataTypes.STRING, allowNull: true } // Para futura referencia de pago
});

// Relación
Tenant.belongsTo(Plan, { foreignKey: 'planId' });

module.exports = Tenant;