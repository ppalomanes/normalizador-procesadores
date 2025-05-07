// controllers/authController.js
const User = require("../models/User");
const ValidationRule = require("../models/ValidationRule");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Registro de usuario
const register = async (req, res) => {
  try {
    const { username, email, password, company } = req.body;

    // Validar entradas
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporcione nombre de usuario, email y contraseña",
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Este email ya está registrado",
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Este nombre de usuario ya está en uso",
      });
    }

    // Crear nuevo usuario
    const newUser = await User.create({
      username,
      email,
      password,
      company,
      role: "user", // Por defecto todos los usuarios son regulares
    });

    // Crear reglas de validación predeterminadas para el usuario
    await ValidationRule.createDefaultForNewUser(newUser.id);

    // Generar token
    const token = generateToken(newUser.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        company: newUser.company,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
    });
  }
};

// Inicio de sesión
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar entradas
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Por favor proporcione nombre de usuario/email y contraseña",
      });
    }

    console.log(`Intento de login: Usuario=${username}`);

    // Verificar credenciales
    const user = await User.verifyCredentials(username, password);

    if (!user) {
      console.log(`Login fallido para usuario: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas",
      });
    }

    console.log(`Login exitoso: Usuario=${user.username}, ID=${user.id}`);

    // Generar token
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        company: user.company,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en inicio de sesión:", error);
    res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
    });
  }
};

// Obtener perfil del usuario actual
const getCurrentUser = async (req, res) => {
  try {
    // El middleware ya adjuntó el usuario a req.user
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        company: req.user.company,
        role: req.user.role,
        created_at: req.user.created_at,
      },
    });
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del usuario",
    });
  }
};

// Actualizar perfil de usuario
const updateUser = async (req, res) => {
  try {
    const { username, email, password, company } = req.body;
    const userId = req.user.id;

    // Verificar si cambia el nombre de usuario y si ya existe
    if (username && username !== req.user.username) {
      const existingUsername = await User.findByUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Este nombre de usuario ya está en uso",
        });
      }
    }

    // Verificar si cambia el email y si ya existe
    if (email && email !== req.user.email) {
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Este email ya está registrado",
        });
      }
    }

    // Actualizar usuario
    const updated = await User.update(userId, {
      username,
      email,
      password,
      company,
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No se pudo actualizar el perfil",
      });
    }

    // Obtener el usuario actualizado
    const updatedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: "Perfil actualizado correctamente",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        company: updatedUser.company,
        role: updatedUser.role,
        created_at: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar perfil de usuario",
    });
  }
};

// Listar todos los usuarios (solo para administradores)
const getAllUsers = async (req, res) => {
  try {
    // Esta ruta solo será accesible para administradores (verificado por el middleware)
    const users = await User.findAll();

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener lista de usuarios",
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUser,
  getAllUsers,
};
