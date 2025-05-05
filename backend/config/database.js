// config/database.js
const mysql = require("mysql2/promise");
require("dotenv").config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para probar la conexión al iniciar la aplicación
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Base de datos conectada correctamente");
    connection.release();
    return true;
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    return false;
  }
}

// Exportar el pool para uso en otros módulos
module.exports = {
  pool,
  testConnection,
};
