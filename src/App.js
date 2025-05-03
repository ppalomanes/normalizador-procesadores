// App.js
import React, { useState, useEffect, useContext } from "react";
import { ThemeContext, ThemeProvider } from "./context/ThemeContext";
import {
  ValidationRulesContext,
  ValidationRulesProvider,
} from "./context/ValidationRulesContext";
import { processExcelFile } from "./utils/excelProcessor";
import * as XLSX from "xlsx";

// Componentes
import Header from "./components/Header";
import Footer from "./components/Footer";
import FileUploader from "./components/FileUploader";
import ValidationRulesEditor from "./components/ValidationRulesEditor";
import StatsDisplay from "./components/StatsDisplay";
import DataTable from "./components/DataTable";
import TextProcessor from "./components/TextProcessor";
import RecommendationsPanel from "./components/RecommendationsPanel";
import SavedAnalyses from "./components/SavedAnalyses";

function AppContent() {
  const { isDarkMode } = useContext(ThemeContext);
  const { rules } = useContext(ValidationRulesContext);
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
    setIsProcessing(true);
    setError(null);

    try {
      // Crear datos de demostración
      const demoData = [];

      // Generar algunos registros de prueba
      const demoProcessors = [
        "Intel(R) Core(TM) i7-8700 CPU @ 3.20GHz",
        "Intel(R) Core(TM) i5-9400F CPU @ 2.90GHz",
        "Intel(R) Core(TM) i3-7100 CPU @ 3.90GHz",
        "AMD Ryzen 7 5800X",
        "AMD Ryzen 5 3600 6-Core Processor",
        "Intel(R) Core(TM) i5-3470 CPU @ 3.20GHz",
        "Intel(R) Core(TM) i5-10400F CPU @ 2.90GHz",
        "AMD Ryzen 9 5900X 12-Core Processor",
        "Intel(R) Core(TM) i9-10900K CPU @ 3.70GHz",
        "Intel(R) Xeon(R) CPU E5-2680 v3 @ 2.50GHz",
        "Intel(R) Pentium(R) CPU G4560 @ 3.50GHz",
        "AMD Ryzen 5 2600",
        "Intel(R) Core(TM) i5-7400 CPU @ 3.00GHz",
        "AMD Ryzen 7 3700X 8-Core Processor",
        "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
        "Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz",
        "AMD Ryzen 5 5600X 6-Core Processor",
        "Intel(R) Core(TM) i5-8600K CPU @ 3.60GHz",
        "Intel(R) Core(TM) i3-10100 CPU @ 3.60GHz",
        "AMD Ryzen 7 2700X Eight-Core Processor",
      ];

      // Generar datos de memoria RAM
      const ramOptions = [
        "8 GB DDR4",
        "16 GB DDR4",
        "32 GB DDR4",
        "4 GB DDR3",
        "12 GB DDR4",
        "64 GB DDR4",
      ];

      // Generar datos de almacenamiento
      const storageOptions = [
        "256 GB SSD",
        "512 GB SSD",
        "1 TB HDD",
        "2 TB HDD",
        "120 GB SSD",
        "480 GB SSD",
        "1 TB SSD",
      ];

      // Generar 50 registros con nombres de host aleatorios
      for (let i = 1; i <= 50; i++) {
        const hostname = `host-${Math.floor(Math.random() * 1000) + 1}`;
        const processorIndex = Math.floor(
          Math.random() * demoProcessors.length
        );
        const ramIndex = Math.floor(Math.random() * ramOptions.length);
        const storageIndex = Math.floor(Math.random() * storageOptions.length);

        demoData.push({
          Hostname: hostname,
          "Procesador (marca, modelo y velocidad)":
            demoProcessors[processorIndex],
          RAM: ramOptions[ramIndex],
          Almacenamiento: storageOptions[storageIndex],
        });
      }

      // Procesar los datos de demostración
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(demoData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Demo");

      // Convertir a array buffer para el procesamiento
      const excelBuffer = XLSX.write(workbook, {
        type: "array",
        bookType: "xlsx",
      });

      // Procesar los datos como si fuera un archivo real
      const { normalizedData, stats } = await processExcelFile(
        excelBuffer,
        rules
      );

      setNormalizedData(normalizedData);
      setStats(stats);
      setFile({ name: "datos_demo.xlsx", buffer: excelBuffer });
    } catch (error) {
      console.error("Error al cargar datos de demostración:", error);
      setError(`Error al cargar datos de demostración: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDarkMode
          ? "bg-dark-bg-primary text-dark-text-primary"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Mensaje de bienvenida si no hay archivo cargado */}
        {!file && !isProcessing && !normalizedData && (
          <div
            className={`mb-8 p-6 text-center rounded-lg shadow-md ${
              isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
            }`}
          >
            <h1 className="text-2xl font-bold mb-4">
              Bienvenido al Normalizador de Hardware
            </h1>
            <p className="mb-6">
              Esta herramienta le permite analizar y normalizar información de
              procesadores, memoria RAM y almacenamiento a partir de archivos
              Excel, facilitando auditorías de hardware y comprobando si los
              componentes cumplen con los requisitos mínimos configurados.
            </p>
            <div className="max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  className={`p-4 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                  }`}
                >
                  <h2 className="font-medium text-lg mb-2">
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
                  <h2 className="font-medium text-lg mb-2">
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
                  <h2 className="font-medium text-lg mb-2">
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
}

function App() {
  return (
    <ThemeProvider>
      <ValidationRulesProvider>
        <AppContent />
      </ValidationRulesProvider>
    </ThemeProvider>
  );
}

export default App;
