const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RoomType = sequelize.define('RoomType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 }
}, { timestamps: false });

module.exports = RoomType;