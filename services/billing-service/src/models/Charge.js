const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Folio = require('./Folio');

const Charge = sequelize.define('Charge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false // Ej: "Alojamiento Noche 1", "Cerveza", "Servicio a la habitación"
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
});

// Relación: Un Folio tiene muchos Cargos
Folio.hasMany(Charge, { foreignKey: 'folioId' });
Charge.belongsTo(Folio, { foreignKey: 'folioId' });

module.exports = Charge;