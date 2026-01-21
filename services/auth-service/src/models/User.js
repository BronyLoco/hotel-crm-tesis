const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'RECEPTIONIST', 'HOUSEKEEPING', 'GUEST', 'MANAGER'),
    defaultValue: 'RECEPTIONIST'
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = User;