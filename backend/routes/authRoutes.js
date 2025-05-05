// routes/authRoutes.js
const express = require("express");
const {
  register,
  login,
  getCurrentUser,
  updateUser,
  getAllUsers,
} = require("../controllers/authController");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Rutas públicas
router.post("/register", register);
router.post("/login", login);

// Rutas protegidas (requieren autenticación)
router.get("/me", authMiddleware, getCurrentUser);
router.put("/update", authMiddleware, updateUser);

// Rutas de administrador
router.get("/users", authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
