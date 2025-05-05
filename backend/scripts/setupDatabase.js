// scripts/setupDatabase.js
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Crear conexión a MySQL sin seleccionar base de datos
async function setupDatabase() {
  let connection;

  try {
    // Conectar a MySQL (sin especificar la base de datos)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("Conectado a MySQL correctamente.");

    // Crear la base de datos si no existe
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    console.log(
      `Base de datos '${process.env.DB_NAME}' creada o verificada correctamente.`
    );

    // Seleccionar la base de datos
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`Base de datos '${process.env.DB_NAME}' seleccionada.`);

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, "../database.sql");
    const sqlCommands = fs.readFileSync(sqlFilePath, "utf8");

    // Dividir el archivo en comandos SQL individuales
    const commands = sqlCommands
      .replace(/--.*$/gm, "") // Eliminar comentarios
      .split(";")
      .filter((cmd) => cmd.trim());

    // Ejecutar cada comando SQL
    for (const command of commands) {
      if (command.trim()) {
        await connection.query(command);
        console.log("Comando SQL ejecutado correctamente.");
      }
    }

    console.log("Configuración de la base de datos completada exitosamente.");
  } catch (error) {
    console.error("Error al configurar la base de datos:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("Conexión a MySQL cerrada.");
    }
  }
}

// Ejecutar la configuración
setupDatabase()
  .then(() => {
    console.log("Script de configuración completado.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en script de configuración:", error);
    process.exit(1);
  });
