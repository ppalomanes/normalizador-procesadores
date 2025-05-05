// routes/analysisRoutes.js
const express = require("express");
const {
  uploadFile,
  createAnalysis,
  getUserAnalyses,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  shareAnalysis,
  getSharedAnalyses,
  searchAnalyses,
} = require("../controllers/analysisController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas principales
router.post("/", uploadFile, createAnalysis);
router.get("/", getUserAnalyses);
router.get("/search", searchAnalyses);
router.get("/shared", getSharedAnalyses);
router.get("/:id", getAnalysisById);
router.put("/:id", updateAnalysis);
router.delete("/:id", deleteAnalysis);
router.post("/:id/share", shareAnalysis);

module.exports = router;
