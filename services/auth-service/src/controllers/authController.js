const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op } = require('sequelize');

// Generar Token JWT
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// 1. REGISTRO (Crear usuario)
const register = async (req, res) => {
  try {
    const { username, password, role, fullName } = req.body;

    // Verificar si existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear usuario
    const newUser = await User.create({
      username,
      password: hashedPassword,
      role,
      fullName
    });

    // Crear token (Auto-login al registrar)
    const token = signToken(newUser.id, newUser.role);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: { id: newUser.id, username: newUser.username, role: newUser.role }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. LOGIN (Entrar al sistema)
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Verificar inputs
    if (!username || !password) {
      return res.status(400).json({ message: 'Por favor ingrese usuario y contraseña' });
    }

    // Buscar usuario y traer la password encriptada
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Comparar contraseñas (La que puso vs La encriptada)
    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    // Todo bien -> Enviar Token
    const token = signToken(user.id, user.role);

    res.status(200).json({
      message: 'Login exitoso',
      token,
      user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Buscar usuario por username exacto (para asignación de staff)
const findUser = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: "Falta username" });

    const user = await User.findOne({ 
        where: { username },
        attributes: ['id', 'username', 'fullName', 'role'] // No devolvemos el password
    });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsersBatch = async (req, res) => {
  try {
    const { ids } = req.body; // Esperamos un array [1, 2, 5]
    
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ message: "Se requiere un array de IDs" });

    const users = await User.findAll({
      where: { 
        id: { [Op.in]: ids } // SQL: WHERE id IN (1, 2, 5)
      },
      attributes: ['id', 'username', 'fullName', 'role'] // Sin password
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, findUser, getUsersBatch };