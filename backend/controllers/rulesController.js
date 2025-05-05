// controllers/rulesController.js
const ValidationRule = require("../models/ValidationRule");

// Crear una nueva regla de validación
const createRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, rules_json, is_default } = req.body;

    // Validar entradas
    if (!name || !rules_json) {
      return res.status(400).json({
        success: false,
        message: "El nombre y las reglas son obligatorios",
      });
    }

    // Crear la regla
    const ruleId = await ValidationRule.create({
      user_id: userId,
      name,
      rules_json,
      is_default: is_default || false,
    });

    res.status(201).json({
      success: true,
      message: "Regla de validación creada correctamente",
      id: ruleId,
    });
  } catch (error) {
    console.error("Error al crear regla de validación:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear regla de validación",
    });
  }
};

// Obtener todas las reglas del usuario
const getUserRules = async (req, res) => {
  try {
    const userId = req.user.id;
    const rules = await ValidationRule.findByUserId(userId);

    res.status(200).json({
      success: true,
      count: rules.length,
      rules,
    });
  } catch (error) {
    console.error("Error al obtener reglas del usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reglas de validación",
    });
  }
};

// Obtener una regla específica por ID
const getRuleById = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const userId = req.user.id;

    // Obtener la regla
    const rule = await ValidationRule.findById(ruleId);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Regla de validación no encontrada",
      });
    }

    // Verificar que la regla pertenece al usuario
    if (rule.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para acceder a esta regla",
      });
    }

    res.status(200).json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error("Error al obtener regla por ID:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener regla de validación",
    });
  }
};

// Actualizar una regla
const updateRule = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const userId = req.user.id;
    const { name, rules_json, is_default } = req.body;

    // Verificar si la regla existe y pertenece al usuario
    const existingRule = await ValidationRule.findById(ruleId);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: "Regla de validación no encontrada",
      });
    }

    if (existingRule.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para modificar esta regla",
      });
    }

    // Actualizar la regla
    const updated = await ValidationRule.update(ruleId, {
      name,
      rules_json,
      is_default,
    });

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No se pudo actualizar la regla de validación",
      });
    }

    res.status(200).json({
      success: true,
      message: "Regla de validación actualizada correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar regla de validación:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar regla de validación",
    });
  }
};

// Eliminar una regla
const deleteRule = async (req, res) => {
  try {
    const ruleId = req.params.id;
    const userId = req.user.id;

    // Verificar si la regla existe y pertenece al usuario
    const existingRule = await ValidationRule.findById(ruleId);

    if (!existingRule) {
      return res.status(404).json({
        success: false,
        message: "Regla de validación no encontrada",
      });
    }

    if (existingRule.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para eliminar esta regla",
      });
    }

    // Verificar si es la única regla predeterminada
    if (existingRule.is_default) {
      const userRules = await ValidationRule.findByUserId(userId);
      const defaultRules = userRules.filter((rule) => rule.is_default);

      if (defaultRules.length <= 1) {
        return res.status(400).json({
          success: false,
          message: "No se puede eliminar la única regla predeterminada",
        });
      }
    }

    // Eliminar la regla
    const deleted = await ValidationRule.delete(ruleId);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: "No se pudo eliminar la regla de validación",
      });
    }

    res.status(200).json({
      success: true,
      message: "Regla de validación eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar regla de validación:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar regla de validación",
    });
  }
};

// Obtener la regla predeterminada del usuario
const getDefaultRule = async (req, res) => {
  try {
    const userId = req.user.id;
    const defaultRule = await ValidationRule.getDefaultForUser(userId);

    if (!defaultRule) {
      return res.status(404).json({
        success: false,
        message: "No se encontró una regla predeterminada",
      });
    }

    res.status(200).json({
      success: true,
      rule: defaultRule,
    });
  } catch (error) {
    console.error("Error al obtener regla predeterminada:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener regla predeterminada",
    });
  }
};

module.exports = {
  createRule,
  getUserRules,
  getRuleById,
  updateRule,
  deleteRule,
  getDefaultRule,
};
