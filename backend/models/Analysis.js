// models/Analysis.js
const { pool } = require("../config/database");

class Analysis {
  // Crear un nuevo análisis
  static async create(analysisData) {
    try {
      const {
        user_id,
        name,
        description,
        file_name,
        file_path,
        stats_json,
        data_json,
        total_processors,
        meeting_requirements,
        compliance_rate,
      } = analysisData;

      const query = `
        INSERT INTO analyses (
          user_id, name, description, file_name, file_path,
          stats_json, data_json, total_processors, meeting_requirements, compliance_rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        user_id,
        name,
        description || null,
        file_name || null,
        file_path || null,
        stats_json ? JSON.stringify(stats_json) : null,
        data_json ? JSON.stringify(data_json) : null,
        total_processors || 0,
        meeting_requirements || 0,
        compliance_rate || 0,
      ];

      const [result] = await pool.execute(query, values);
      return result.insertId;
    } catch (error) {
      console.error("Error al crear análisis:", error);
      throw error;
    }
  }

  // Obtener un análisis por ID
  static async findById(id, includeData = false) {
    try {
      // Si includeData es false, no recuperamos el campo data_json para optimizar
      const fields = includeData
        ? "*"
        : "id, user_id, name, description, file_name, stats_json, total_processors, meeting_requirements, compliance_rate, created_at";

      const [rows] = await pool.execute(
        `SELECT ${fields} FROM analyses WHERE id = ?`,
        [id]
      );

      if (!rows.length) return null;

      const analysis = rows[0];

      // Convertir campos JSON a objetos JavaScript
      if (analysis.stats_json) {
        analysis.stats_json = JSON.parse(analysis.stats_json);
      }

      if (includeData && analysis.data_json) {
        analysis.data_json = JSON.parse(analysis.data_json);
      }

      return analysis;
    } catch (error) {
      console.error("Error al obtener análisis por ID:", error);
      throw error;
    }
  }

  // Obtener todos los análisis de un usuario
  static async findByUserId(userId) {
    try {
      // No incluir data_json para optimizar la consulta
      const [rows] = await pool.execute(
        `SELECT id, name, description, file_name, total_processors,
         meeting_requirements, compliance_rate, created_at
         FROM analyses WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );

      return rows;
    } catch (error) {
      console.error("Error al obtener análisis por ID de usuario:", error);
      throw error;
    }
  }

  // Actualizar un análisis
  static async update(id, analysisData) {
    try {
      const updateFields = [];
      const values = [];

      // Construir query dinámicamente basada en campos proporcionados
      Object.entries(analysisData).forEach(([key, value]) => {
        // Manejar campos JSON
        if (key === "stats_json" || key === "data_json") {
          if (value !== undefined) {
            updateFields.push(`${key} = ?`);
            values.push(JSON.stringify(value));
          }
        } else if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return false;
      }

      const query = `UPDATE analyses SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      values.push(id);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar análisis:", error);
      throw error;
    }
  }

  // Eliminar un análisis
  static async delete(id) {
    try {
      const [result] = await pool.execute("DELETE FROM analyses WHERE id = ?", [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar análisis:", error);
      throw error;
    }
  }

  // Compartir un análisis con otro usuario
  static async shareWith(
    analysisId,
    sharedBy,
    sharedWith,
    permissions = "read"
  ) {
    try {
      const [result] = await pool.execute(
        "INSERT INTO shared_analyses (analysis_id, shared_by, shared_with, permissions) VALUES (?, ?, ?, ?)",
        [analysisId, sharedBy, sharedWith, permissions]
      );
      return result.insertId;
    } catch (error) {
      console.error("Error al compartir análisis:", error);
      throw error;
    }
  }

  // Obtener análisis compartidos con un usuario
  static async getSharedWith(userId) {
    try {
      const query = `
        SELECT a.id, a.name, a.description, a.total_processors,
               a.meeting_requirements, a.compliance_rate, a.created_at,
               u.username as shared_by_username, sa.permissions, sa.created_at as shared_at
        FROM analyses a
        JOIN shared_analyses sa ON a.id = sa.analysis_id
        JOIN users u ON sa.shared_by = u.id
        WHERE sa.shared_with = ?
        ORDER BY sa.created_at DESC
      `;

      const [rows] = await pool.execute(query, [userId]);
      return rows;
    } catch (error) {
      console.error("Error al obtener análisis compartidos:", error);
      throw error;
    }
  }

  // Buscar análisis por nombre o descripción
  static async search(userId, searchTerm) {
    try {
      const query = `
        SELECT id, name, description, total_processors,
               meeting_requirements, compliance_rate, created_at
        FROM analyses
        WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
        ORDER BY created_at DESC
      `;

      const searchPattern = `%${searchTerm}%`;
      const [rows] = await pool.execute(query, [
        userId,
        searchPattern,
        searchPattern,
      ]);
      return rows;
    } catch (error) {
      console.error("Error al buscar análisis:", error);
      throw error;
    }
  }
}

module.exports = Analysis;
