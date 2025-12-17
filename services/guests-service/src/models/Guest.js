const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Guest = sequelize.define('Guest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // No puede haber dos emails iguales
    validate: {
      isEmail: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  documentId: { // DNI o Pasaporte
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true, // Crea createdAt y updatedAt automáticamente
  tableName: 'guests'
});

module.exports = Guest;