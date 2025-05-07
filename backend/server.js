// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Importar conexión a la base de datos
const { testConnection } = require("./config/database");

// Importar rutas
const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const rulesRoutes = require("./routes/rulesRoutes");

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: "50mb" })); // Para archivos grandes
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configuración de CORS más permisiva para desarrollo
app.use(
  cors({
    origin: true, // Permite solicitudes desde cualquier origen en desarrollo
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Carpeta para archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/rules", rulesRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "API del Normalizador de Hardware funcionando correctamente",
  });
});

// Iniciar el servidor
async function startServer() {
  // Comprobar conexión a la base de datos
  const dbConnected = await testConnection();

  if (dbConnected) {
    app.listen(PORT, () => {
      console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
  } else {
    console.error(
      "No se pudo iniciar el servidor debido a problemas con la base de datos"
    );
  }
}

startServer();
