const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const RoomType = require('./RoomType');

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  number: { type: DataTypes.STRING, allowNull: false, unique: true }, // Ej: "101"
  status: { 
    type: DataTypes.ENUM('AVAILABLE', 'OCCUPIED', 'DIRTY', 'MAINTENANCE'),
    defaultValue: 'AVAILABLE' 
  }
});

// Definir la relación: Un Tipo tiene muchas Habitaciones
RoomType.hasMany(Room, { foreignKey: 'roomTypeId' });
Room.belongsTo(RoomType, { foreignKey: 'roomTypeId' });

module.exports = Room;