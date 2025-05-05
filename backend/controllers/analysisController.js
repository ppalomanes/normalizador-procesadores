// controllers/analysisController.js
const Analysis = require("../models/Analysis");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Configuración de almacenamiento para archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Crear nombre único basado en timestamp y nombre original
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  },
});

// Filtro para permitir solo archivos Excel
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos Excel (.xlsx, .xls)"), false);
  }
};

// Configurar upload con multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limitar a 10MB
  },
});

// Middleware para manejar la subida de archivos
const uploadFile = upload.single("file");

// Crear un nuevo análisis
const createAnalysis = async (req, res) => {
  // El middleware upload ya manejó el archivo
  try {
    const userId = req.user.id;
    const { name, description } = req.body;
    const stats = req.body.stats ? JSON.parse(req.body.stats) : null;
    const data = req.body.data ? JSON.parse(req.body.data) : null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "El nombre del análisis es obligatorio",
      });
    }

    // Datos del archivo
    let file_name = null;
    let file_path = null;

    if (req.file) {
      file_name = req.file.originalname;
      file_path = req.file.path;
    }

    // Estadísticas calculadas para mejor rendimiento en consultas
    let total_processors = 0;
    let meeting_requirements = 0;
    let compliance_rate = 0;

    if (stats) {
      total_processors = stats.totalProcessors || 0;
      meeting_requirements = stats.meetingRequirements || 0;
      compliance_rate = stats.complianceRate || 0;
    }

    // Crear el análisis
    const analysisId = await Analysis.create({
      user_id: userId,
      name,
      description,
      file_name,
      file_path,
      stats_json: stats,
      data_json: data,
      total_processors,
      meeting_requirements,
      compliance_rate,
    });

    res.status(201).json({
      success: true,
      message: "Análisis creado correctamente",
      id: analysisId,
    });
  } catch (error) {
    console.error("Error al crear análisis:", error);

    // Si hay un archivo que fue subido, intentar eliminarlo
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error al eliminar archivo:", unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error al crear análisis",
    });
  }
};

// Obtener todos los análisis del usuario
const getUserAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const analyses = await Analysis.findByUserId(userId);

    res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error("Error al obtener análisis del usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener análisis",
    });
  }
};

// Obtener un análisis específico por ID
const getAnalysisById = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    // Usar query param para determinar si incluir datos completos
    const includeData = req.query.includeData === "true";

    // Obtener el análisis
    const analysis = await Analysis.findById(analysisId, includeData);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Análisis no encontrado",
      });
    }

    // Verificar que el análisis pertenece al usuario
    if (analysis.user_id !== userId) {
      // Verificar si está compartido con este usuario
      // Esto se implementaría en una versión completa
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a este análisis",
      });
    }

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Error al obtener análisis por ID:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener análisis",
    });
  }
};

// Actualizar un análisis
const updateAnalysis = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;
    const { name, description } = req.body;

    // Verificar si el análisis existe y pertenece al usuario
    const existingAnalysis = await Analysis.findById(analysisId);

    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Análisis no encontrado",
      });
    }

    if (existingAnalysis.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para modificar este análisis",
      });
    }

    // Actualizar solo campos permitidos
    const updated = await Analysis.update(analysisId, {
      name,
      description,
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No se pudo actualizar el análisis",
      });
    }

    res.status(200).json({
      success: true,
      message: "Análisis actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar análisis:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar análisis",
    });
  }
};

// Eliminar un análisis
const deleteAnalysis = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const userId = req.user.id;

    // Verificar si el análisis existe y pertenece al usuario
    const existingAnalysis = await Analysis.findById(analysisId);

    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Análisis no encontrado",
      });
    }

    if (existingAnalysis.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar este análisis",
      });
    }

    // Si hay archivo asociado, eliminarlo
    if (existingAnalysis.file_path) {
      try {
        fs.unlinkSync(existingAnalysis.file_path);
      } catch (unlinkError) {
        console.error("Error al eliminar archivo:", unlinkError);
        // Continuar incluso si no se puede eliminar el archivo
      }
    }

    // Eliminar el análisis
    const deleted = await Analysis.delete(analysisId);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "No se pudo eliminar el análisis",
      });
    }

    res.status(200).json({
      success: true,
      message: "Análisis eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar análisis:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar análisis",
    });
  }
};

// Compartir un análisis con otro usuario
const shareAnalysis = async (req, res) => {
  try {
    const analysisId = req.params.id;
    const sharedBy = req.user.id;
    const { sharedWith, permissions } = req.body;

    // Validar entradas
    if (!sharedWith) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el ID del usuario con quien compartir",
      });
    }

    // Verificar si el análisis existe y pertenece al usuario
    const existingAnalysis = await Analysis.findById(analysisId);

    if (!existingAnalysis) {
      return res.status(404).json({
        success: false,
        message: "Análisis no encontrado",
      });
    }

    if (existingAnalysis.user_id !== sharedBy) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para compartir este análisis",
      });
    }

    // Compartir el análisis
    const sharedId = await Analysis.shareWith(
      analysisId,
      sharedBy,
      sharedWith,
      permissions || "read"
    );

    res.status(200).json({
      success: true,
      message: "Análisis compartido correctamente",
      sharedId,
    });
  } catch (error) {
    console.error("Error al compartir análisis:", error);
    res.status(500).json({
      success: false,
      message: "Error al compartir análisis",
    });
  }
};

// Obtener análisis compartidos con el usuario
const getSharedAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const sharedAnalyses = await Analysis.getSharedWith(userId);

    res.status(200).json({
      success: true,
      count: sharedAnalyses.length,
      analyses: sharedAnalyses,
    });
  } catch (error) {
    console.error("Error al obtener análisis compartidos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener análisis compartidos",
    });
  }
};

// Buscar análisis por nombre o descripción
const searchAnalyses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { term } = req.query;

    if (!term) {
      return res.status(400).json({
        success: false,
        message: "Se requiere un término de búsqueda",
      });
    }

    const results = await Analysis.search(userId, term);

    res.status(200).json({
      success: true,
      count: results.length,
      analyses: results,
    });
  } catch (error) {
    console.error("Error al buscar análisis:", error);
    res.status(500).json({
      success: false,
      message: "Error al buscar análisis",
    });
  }
};

module.exports = {
  uploadFile,
  createAnalysis,
  getUserAnalyses,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  shareAnalysis,
  getSharedAnalyses,
  searchAnalyses,
};
