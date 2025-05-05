// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ValidationRulesProvider } from "./context/ValidationRulesContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Componentes principales
import Header from "./components/Header";
import Footer from "./components/Footer";
import FileUploader from "./components/FileUploader";
import ValidationRulesEditor from "./components/ValidationRulesEditor";
import StatsDisplay from "./components/StatsDisplay";
import DataTable from "./components/DataTable";
import TextProcessor from "./components/TextProcessor";
import RecommendationsPanel from "./components/RecommendationsPanel";
import SavedAnalyses from "./components/SavedAnalyses";

// Componentes de autenticación
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./components/auth/Profile";

// Utilidades
import { processExcelFile } from "./utils/excelProcessor";

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Contenido principal de la aplicación
function AppContent() {
  const { isDarkMode } = React.useContext(ThemeContext);
  const { rules } = React.useContext(ValidationRulesContext);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [normalizedData, setNormalizedData] = useState(null);
  const [stats, setStats] = useState(null);

  // Estados de la tabla
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Efecto para revalidar los datos cuando cambien las reglas
  useEffect(() => {
    // Solo ejecutar si ya hay datos normalizados
    if (normalizedData && file && !isProcessing) {
      // Re-procesar los datos con las nuevas reglas
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const { normalizedData, stats } = await processExcelFile(
            e.target.result,
            rules
          );
          setNormalizedData(normalizedData);
          setStats(stats);
        } catch (error) {
          console.error("Error al reprocesar archivo:", error);
          setError(`Error al reprocesar el archivo: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Error al leer el archivo para reprocesar.");
        setIsProcessing(false);
      };

      if (file instanceof File) {
        reader.readAsArrayBuffer(file);
      } else if (file.buffer) {
        // Para casos de demostración donde puede no ser un File sino un objeto con buffer
        reader.readAsArrayBuffer(file.buffer);
      } else {
        // Intentar recargar los datos de demostración
        loadDemoData();
      }
    }
  }, [rules]); // Añadir rules como dependencia

  // Datos de demostración para pruebas
  const loadDemoData = async () => {
    // ... [código existente para cargar datos demo]
    setIsProcessing(true);
    // Simular los datos que se cargarían de la API
    setTimeout(() => {
      setIsProcessing(false);
      // Aquí iría la función original loadDemoData
    }, 1000);
  };

  // Procesar archivo cuando cambia
  const handleFileUpload = async (uploadedFile) => {
    setFile(uploadedFile);
    setIsProcessing(true);
    setError(null);
    setNormalizedData(null);
    setStats(null);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const { normalizedData, stats } = await processExcelFile(
            e.target.result,
            rules
          );
          setNormalizedData(normalizedData);
          setStats(stats);
        } catch (error) {
          console.error("Error al procesar archivo:", error);
          setError(`Error al procesar el archivo: ${error.message}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setError("Error al leer el archivo.");
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
      console.error("Error en el manejador de archivo:", error);
      setError(`Error al manejar el archivo: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Cargar un análisis guardado
  const handleLoadSavedAnalysis = (analysis) => {
    if (!analysis || !analysis.stats) return;

    // Extraer los datos necesarios del análisis guardado
    setStats(analysis.stats);

    // Si el análisis tiene datos completos, usarlos, de lo contrario usar la muestra
    if (analysis.normalizedData) {
      setNormalizedData(analysis.normalizedData);
    } else if (analysis.sampleData) {
      setNormalizedData(analysis.sampleData);
      // Mostrar advertencia de datos incompletos
      setError(
        "Se cargó solo una muestra de los datos. Los datos completos no están disponibles."
      );
    }

    // Marcar como si se hubiera cargado un archivo
    setFile({ name: analysis.name || "Análisis cargado" });
    setIsProcessing(false);
  };

  const renderMainApp = () => (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkMode
          ? "bg-dark-bg-primary text-dark-text-primary"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <Header />

      <main className="container flex-grow px-4 py-8 mx-auto">
        {/* Mensaje de bienvenida si no hay archivo cargado */}
        {!file && !isProcessing && !normalizedData && (
          <div
            className={`mb-8 p-6 text-center rounded-lg shadow-md ${
              isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
            }`}
          >
            <h1 className="mb-4 text-2xl font-bold">
              Bienvenido al Normalizador de Hardware
            </h1>
            <p className="mb-6">
              Esta herramienta le permite analizar y normalizar información de
              procesadores, memoria RAM y almacenamiento a partir de archivos
              Excel, facilitando auditorías de hardware y comprobando si los
              componentes cumplen con los requisitos mínimos configurados.
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                  }`}
                >
                  <h2 className="mb-2 text-lg font-medium">
                    1. Cargue un archivo
                  </h2>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
                    }`}
                  >
                    Suba un archivo Excel que contenga columnas con información
                    de procesadores, RAM y almacenamiento.
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                  }`}
                >
                  <h2 className="mb-2 text-lg font-medium">
                    2. Revise los resultados
                  </h2>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
                    }`}
                  >
                    La herramienta normalizará la información y verificará si
                    los componentes cumplen con los requisitos configurados.
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                  }`}
                >
                  <h2 className="mb-2 text-lg font-medium">
                    3. Exporte los datos
                  </h2>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
                    }`}
                  >
                    Exporte los resultados normalizados en varios formatos e
                    incluya informes detallados para sus auditorías.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cargador de archivos */}
        <FileUploader
          onFileUpload={handleFileUpload}
          isProcessing={isProcessing}
          file={file}
          error={error}
          onLoadDemo={loadDemoData}
        />

        {/* Editor de reglas de validación */}
        <ValidationRulesEditor />

        {/* Análisis guardados */}
        <SavedAnalyses
          currentStats={stats}
          normalizedData={normalizedData}
          onLoadSavedAnalysis={handleLoadSavedAnalysis}
          isProcessing={isProcessing}
        />

        {/* Procesador de texto rápido */}
        <TextProcessor />

        {/* Estadísticas y gráficos (solo mostrar si hay datos) */}
        {stats && normalizedData && (
          <StatsDisplay stats={stats} normalizedData={normalizedData} />
        )}

        {/* Panel de recomendaciones */}
        {stats && normalizedData && (
          <RecommendationsPanel stats={stats} normalizedData={normalizedData} />
        )}

        {/* Tabla de datos (solo mostrar si hay datos) */}
        {normalizedData && (
          <DataTable
            normalizedData={normalizedData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
          />
        )}
      </main>

      <Footer />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={renderMainApp()} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ValidationRulesProvider>
          <AppContent />
        </ValidationRulesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
