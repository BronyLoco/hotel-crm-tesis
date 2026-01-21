const { Sequelize } = require('sequelize');
require('dotenv').config();

// Inicializamos Sequelize con los datos del .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Ponlo en true si quieres ver las consultas SQL en la consola
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('🟢 PostgreSQL Conectado con Sequelize');
    
    // Esto crea las tablas automáticamente si no existen (Sincronización)
    await sequelize.sync({ force: false }); 
    console.log('📦 Modelos Sincronizados');
    
  } catch (error) {
    console.error('🔴 Error conectando a la BD:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };