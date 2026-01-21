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
    allowNull: true,
    unique: false, // No puede haber dos emails iguales
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
    unique: false
  },
  
  country: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },

  groupCode: {
    type: DataTypes.STRING,
    allowNull: true, // Puede ser null si viene solo
    defaultValue: null
  },
  isVip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true, // Crea createdAt y updatedAt automáticamente
  tableName: 'guests'
});

module.exports = Guest;