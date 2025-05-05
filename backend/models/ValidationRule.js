// models/ValidationRule.js
const { pool } = require("../config/database");

class ValidationRule {
  // Crear una nueva regla de validación
  static async create(ruleData) {
    try {
      const { user_id, name, rules_json, is_default } = ruleData;

      const [result] = await pool.execute(
        "INSERT INTO validation_rules (user_id, name, rules_json, is_default) VALUES (?, ?, ?, ?)",
        [user_id, name, JSON.stringify(rules_json), is_default || false]
      );

      // Si se marca como default, actualizar otras reglas del usuario
      if (is_default) {
        await this.resetDefaultForUser(user_id, result.insertId);
      }

      return result.insertId;
    } catch (error) {
      console.error("Error al crear regla de validación:", error);
      throw error;
    }
  }

  // Obtener regla por ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM validation_rules WHERE id = ?",
        [id]
      );

      if (!rows.length) return null;

      const rule = rows[0];
      // Convertir JSON a objeto JavaScript
      rule.rules_json = JSON.parse(rule.rules_json);

      return rule;
    } catch (error) {
      console.error("Error al obtener regla por ID:", error);
      throw error;
    }
  }

  // Obtener todas las reglas de un usuario
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM validation_rules WHERE user_id = ? ORDER BY is_default DESC, name ASC",
        [userId]
      );

      return rows.map((rule) => {
        // Convertir JSON a objeto JavaScript
        rule.rules_json = JSON.parse(rule.rules_json);
        return rule;
      });
    } catch (error) {
      console.error("Error al obtener reglas por usuario:", error);
      throw error;
    }
  }

  // Obtener la regla predeterminada de un usuario
  static async getDefaultForUser(userId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM validation_rules WHERE user_id = ? AND is_default = true",
        [userId]
      );

      if (!rows.length) return null;

      const rule = rows[0];
      // Convertir JSON a objeto JavaScript
      rule.rules_json = JSON.parse(rule.rules_json);

      return rule;
    } catch (error) {
      console.error("Error al obtener regla predeterminada:", error);
      throw error;
    }
  }

  // Actualizar una regla
  static async update(id, ruleData) {
    try {
      const updateFields = [];
      const values = [];

      if (ruleData.name) {
        updateFields.push("name = ?");
        values.push(ruleData.name);
      }

      if (ruleData.rules_json) {
        updateFields.push("rules_json = ?");
        values.push(JSON.stringify(ruleData.rules_json));
      }

      if (ruleData.is_default !== undefined) {
        updateFields.push("is_default = ?");
        values.push(ruleData.is_default);
      }

      if (updateFields.length === 0) {
        return false;
      }

      const query = `UPDATE validation_rules SET ${updateFields.join(
        ", "
      )} WHERE id = ?`;
      values.push(id);

      const [result] = await pool.execute(query, values);

      // Si se marca como default, actualizar otras reglas del usuario
      if (ruleData.is_default) {
        // Primero obtener el usuario_id de esta regla
        const [rows] = await pool.execute(
          "SELECT user_id FROM validation_rules WHERE id = ?",
          [id]
        );

        if (rows.length > 0) {
          await this.resetDefaultForUser(rows[0].user_id, id);
        }
      }

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar regla:", error);
      throw error;
    }
  }

  // Eliminar una regla
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        "DELETE FROM validation_rules WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar regla:", error);
      throw error;
    }
  }

  // Marcar una regla como predeterminada y quitar la marca de las demás reglas del usuario
  static async resetDefaultForUser(userId, exceptRuleId) {
    try {
      await pool.execute(
        "UPDATE validation_rules SET is_default = false WHERE user_id = ? AND id != ?",
        [userId, exceptRuleId]
      );
      return true;
    } catch (error) {
      console.error("Error al resetear reglas predeterminadas:", error);
      throw error;
    }
  }

  // Crear regla predeterminada inicial para un usuario nuevo
  static async createDefaultForNewUser(userId) {
    try {
      // Definir las reglas predeterminadas de validación
      const defaultRules = {
        intelCore: {
          i5: {
            minGeneration: 8,
            minSpeed: 3.0,
            name: "Intel Core i5",
          },
          i7: {
            minGeneration: 7,
            minSpeed: 0,
            name: "Intel Core i7",
          },
          i9: {
            minGeneration: 0,
            minSpeed: 0,
            name: "Intel Core i9",
          },
        },
        amdRyzen: {
          ryzen5: {
            minGeneration: 0,
            minSpeed: 3.7,
            name: "AMD Ryzen 5",
          },
          ryzen7: {
            minGeneration: 0,
            minSpeed: 0,
            name: "AMD Ryzen 7",
          },
          ryzen9: {
            minGeneration: 0,
            minSpeed: 0,
            name: "AMD Ryzen 9",
          },
        },
        otherProcessors: {
          intelXeon: {
            enabled: true,
            minGeneration: 0,
            minSpeed: 0,
            name: "Intel Xeon (E5 v3+, E7 v3+, series Gold/Silver/Bronze)",
          },
          amdEpyc: {
            enabled: true,
            minGeneration: 0,
            minSpeed: 0,
            name: "AMD EPYC",
          },
          intelCeleron: {
            enabled: false,
            minGeneration: 0,
            minSpeed: 0,
            name: "Intel Celeron",
          },
          intelPentium: {
            enabled: false,
            minGeneration: 0,
            minSpeed: 0,
            name: "Intel Pentium",
          },
          amdAthlon: {
            enabled: false,
            minGeneration: 0,
            minSpeed: 0,
            name: "AMD Athlon",
          },
        },
        ram: {
          minCapacity: 8,
          name: "Memoria RAM",
        },
        storage: {
          minCapacity: 256,
          preferSSD: true,
          name: "Almacenamiento",
        },
      };

      // Crear la regla predeterminada
      return await this.create({
        user_id: userId,
        name: "Configuración predeterminada",
        rules_json: defaultRules,
        is_default: true,
      });
    } catch (error) {
      console.error(
        "Error al crear regla predeterminada para nuevo usuario:",
        error
      );
      throw error;
    }
  }
}
