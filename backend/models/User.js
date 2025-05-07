// models/User.js
const { pool } = require("../config/database");
const bcrypt = require("bcrypt");

class User {
  // Encontrar usuario por ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, email, company, role, created_at FROM users WHERE id = ?",
        [id]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error al buscar usuario por ID:", error);
      throw error;
    }
  }

  // Encontrar usuario por email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error al buscar usuario por email:", error);
      throw error;
    }
  }

  // Encontrar usuario por nombre de usuario
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM users WHERE username = ?",
        [username]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error("Error al buscar usuario por nombre de usuario:", error);
      throw error;
    }
  }

  // Crear un nuevo usuario
  static async create(userData) {
    try {
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password, company, role) VALUES (?, ?, ?, ?, ?)",
        [
          userData.username,
          userData.email,
          hashedPassword,
          userData.company || null,
          userData.role || "user",
        ]
      );

      const id = result.insertId;
      return { id, ...userData, password: undefined };
    } catch (error) {
      console.error("Error al crear usuario:", error);
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    try {
      let query = "UPDATE users SET ";
      const values = [];
      const updateFields = [];

      // Comprobar qué campos actualizar
      if (userData.username) {
        updateFields.push("username = ?");
        values.push(userData.username);
      }

      if (userData.email) {
        updateFields.push("email = ?");
        values.push(userData.email);
      }

      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        updateFields.push("password = ?");
        values.push(hashedPassword);
      }

      if (userData.company !== undefined) {
        updateFields.push("company = ?");
        values.push(userData.company);
      }

      if (userData.role) {
        updateFields.push("role = ?");
        values.push(userData.role);
      }

      // Si no hay campos para actualizar
      if (updateFields.length === 0) {
        return false;
      }

      query += updateFields.join(", ");
      query += " WHERE id = ?";
      values.push(id);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
        id,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      throw error;
    }
  }

  // Listar todos los usuarios
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        "SELECT id, username, email, company, role, created_at FROM users"
      );
      return rows;
    } catch (error) {
      console.error("Error al listar usuarios:", error);
      throw error;
    }
  }

  // Verificar credenciales
  static async verifyCredentials(username, password) {
    try {
      // Buscar por nombre de usuario o email
      const [rows] = await pool.execute(
        "SELECT * FROM users WHERE username = ? OR email = ?",
        [username, username]
      );

      if (!rows.length) {
        console.log(`Usuario no encontrado: ${username}`);
        return null;
      }

      const user = rows[0];
      console.log(`Comparando contraseña para usuario: ${user.username}`);

      try {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log(`Resultado de comparación: ${isPasswordValid}`);

        if (!isPasswordValid) {
          return null;
        }

        // No devolver la contraseña
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } catch (bcryptError) {
        console.error("Error en bcrypt.compare:", bcryptError);
        return null;
      }
    } catch (error) {
      console.error("Error al verificar credenciales:", error);
      throw error;
    }
  }
}

module.exports = User;
