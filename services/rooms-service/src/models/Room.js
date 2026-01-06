const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
// Quitamos el require de RoomType de aquí arriba para evitar bucles de importación

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false, unique: true },
  
  status: { 
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'PARTIALLY_OCCUPIED', 'DIRTY', 'MAINTENANCE'),
    defaultValue: 'AVAILABLE' 
  },
  
  // CAMPOS NUEVOS
  maxOccupancy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  currentOccupancy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  roomTypeId: { // Definimos la FK explícitamente
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = Room;