const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Reservation = sequelize.define('Reservation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  guestId: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Referencia lógica al servicio de Guests
  },
  roomTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Referencia lógica al servicio de Rooms
  },
    assignedRoomId: {
    type: DataTypes.STRING, // Guardaremos el número (ej. "101")
    allowNull: true         // Al principio es null, se llena al Check-in
  },
  
  // MODIFICAR ESTO (Agregar CHECKED_IN y CHECKED_OUT):
  status: {
    type: DataTypes.STRING,
    defaultValue: 'CONFIRMED'
  },
  checkIn: {
    type: DataTypes.DATEONLY, // Solo fecha, sin hora
    allowNull: false
  },
  checkOut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'CONFIRMED'
  }
});

module.exports = Reservation;