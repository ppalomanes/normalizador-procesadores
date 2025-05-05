// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

// Middleware para verificar el token JWT
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message:
          "Acceso no autorizado. Token no proporcionado o formato inválido",
      });
    }

    // Extraer el token
    const token = authHeader.split(" ")[1];

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Añadir el usuario al objeto de solicitud
    req.user = user;

    // Continuar con la siguiente función
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "El token ha expirado, inicie sesión nuevamente",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido, inicie sesión nuevamente",
      });
    }

    console.error("Error en middleware de autenticación:", error);
    return res.status(500).json({
      success: false,
      message: "Error de servidor en la autenticación",
    });
  }
};

// Middleware para verificar roles de administrador
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Se requieren permisos de administrador",
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
