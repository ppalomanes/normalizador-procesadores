// scripts/create-test-user.js
const bcrypt = require("bcrypt");
const { pool } = require("../config/database");
require("dotenv").config();

async function createTestUser() {
  try {
    // Datos del usuario de prueba
    const userData = {
      username: "admin",
      email: "admin@hardware.com",
      password: "admin123",
      company: "Hardware Normalizer S.A.",
      role: "admin",
    };

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Comprobar si el usuario ya existe
    const [existingUsers] = await pool.execute(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [userData.username, userData.email]
    );

    if (existingUsers.length > 0) {
      console.log("El usuario de prueba ya existe. No se creará uno nuevo.");
      process.exit(0);
    }

    // Insertar el usuario en la base de datos
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, company, role) VALUES (?, ?, ?, ?, ?)",
      [
        userData.username,
        userData.email,
        hashedPassword,
        userData.company,
        userData.role,
      ]
    );

    console.log(`Usuario de prueba creado con ID: ${result.insertId}`);
    console.log("Credenciales:");
    console.log(`- Usuario: ${userData.username}`);
    console.log(`- Contraseña: ${userData.password}`);
    console.log(`- Email: ${userData.email}`);
    console.log(`- Rol: ${userData.role}`);

    // Crear una regla de validación predeterminada para el usuario
    // Definir las reglas predeterminadas
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

    const [ruleResult] = await pool.execute(
      "INSERT INTO validation_rules (user_id, name, rules_json, is_default) VALUES (?, ?, ?, ?)",
      [
        result.insertId,
        "Configuración predeterminada",
        JSON.stringify(defaultRules),
        true,
      ]
    );

    console.log(
      `Regla de validación predeterminada creada con ID: ${ruleResult.insertId}`
    );
  } catch (error) {
    console.error("Error al crear usuario de prueba:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

createTestUser();
