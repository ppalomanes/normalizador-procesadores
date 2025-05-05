// routes/rulesRoutes.js
const express = require("express");
const {
  createRule,
  getUserRules,
  getRuleById,
  updateRule,
  deleteRule,
  getDefaultRule,
} = require("../controllers/rulesController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas principales
router.post("/", createRule);
router.get("/", getUserRules);
router.get("/default", getDefaultRule);
router.get("/:id", getRuleById);
router.put("/:id", updateRule);
router.delete("/:id", deleteRule);

module.exports = router;
