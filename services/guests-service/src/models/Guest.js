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
   documentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false
  },
  nationality: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  birthDate: { 
    type: DataTypes.DATEONLY, 
    allowNull: true 
  },
  civilStatus: { 
    type: DataTypes.ENUM('SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'OTRO'),
    defaultValue: 'SOLTERO' 
  },
  country: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  city: { 
    type: DataTypes.STRING, 
    allowNull: true 
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
    validate: {
      isEmail: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
 
//INFOSYS
  groupCode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  GroupEventId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }, 
  isVip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
   tenantId: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  }
  
}, {
  timestamps: true,
  tableName: 'guests'
});

module.exports = Guest;