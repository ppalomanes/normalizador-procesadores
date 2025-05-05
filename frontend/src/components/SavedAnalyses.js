// components/SavedAnalyses.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ApiService from "../services/apiService";
import {
  History,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Save,
  Download,
  Upload,
  FileCheck,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";

const SavedAnalyses = ({
  currentStats,
  normalizedData,
  onLoadSavedAnalysis,
  isProcessing,
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar análisis guardados al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      refreshAnalysisList();
    }
  }, [isAuthenticated]);

  // Actualizar la lista de análisis guardados
  const refreshAnalysisList = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await ApiService.getAnalyses();
      setSavedAnalyses(response.analyses || []);
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      showNotification("error", "Error al cargar análisis guardados");
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar análisis actual
  const saveCurrentAnalysis = async () => {
    if (!isAuthenticated) {
      showNotification("error", "Debe iniciar sesión para guardar análisis");
      return;
    }

    if (!currentStats || !normalizedData || normalizedData.length === 0) {
      showNotification("error", "No hay datos para guardar");
      return;
    }

    const name = prompt(
      "Ingrese un nombre para este análisis:",
      `Análisis ${new Date().toLocaleString()}`
    );
    if (!name) return; // Usuario canceló

    setIsLoading(true);
    try {
      await ApiService.createAnalysis({
        name,
        stats: currentStats,
        data: normalizedData,
      });

      refreshAnalysisList();
      showNotification("success", "Análisis guardado correctamente");
    } catch (error) {
      console.error("Error al guardar análisis:", error);
      showNotification("error", "Error al guardar el análisis");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar un análisis guardado
  const loadAnalysis = async (analysis) => {
    setIsLoading(true);
    try {
      const response = await ApiService.getAnalysisById(analysis.id, true);
      const fullAnalysis = response.analysis;

      if (!fullAnalysis) {
        showNotification("error", "No se puede cargar el análisis");
        return;
      }

      if (onLoadSavedAnalysis && typeof onLoadSavedAnalysis === "function") {
        // Convertir el formato de la API al formato esperado por la aplicación
        const analysisData = {
          name: fullAnalysis.name,
          stats: fullAnalysis.stats_json,
          normalizedData: fullAnalysis.data_json || [],
        };

        onLoadSavedAnalysis(analysisData);
        showNotification("success", `Análisis "${fullAnalysis.name}" cargado`);
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      showNotification("error", "Error al cargar el análisis");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar un análisis guardado
  const deleteAnalysis = async (id, e) => {
    e.stopPropagation(); // Evitar activación del onClick del elemento padre

    if (window.confirm("¿Está seguro que desea eliminar este análisis?")) {
      setIsLoading(true);
      try {
        await ApiService.deleteAnalysis(id);
        refreshAnalysisList();
        showNotification("info", "Análisis eliminado");
      } catch (error) {
        console.error("Error al eliminar análisis:", error);
        showNotification("error", "Error al eliminar el análisis");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Exportar análisis a JSON (esta funcionalidad se mantiene en cliente)
  const exportAnalyses = () => {
    try {
      if (savedAnalyses.length === 0) {
        showNotification("error", "No hay análisis para exportar");
        return;
      }

      const dataStr = JSON.stringify(savedAnalyses, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const dataUrl = URL.createObjectURL(dataBlob);

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `analisis_hardware_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showNotification("success", "Análisis exportados correctamente");
    } catch (error) {
      console.error("Error al exportar análisis:", error);
      showNotification("error", "Error al exportar los análisis");
    }
  };

  // Importar análisis desde JSON (funcionalidad cliente)
  const importAnalyses = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        if (!Array.isArray(importedData) || importedData.length === 0) {
          showNotification("error", "Formato de archivo inválido");
          return;
        }

        setIsLoading(true);

        // Para cada análisis importado, crear uno nuevo en el servidor
        for (const analysis of importedData) {
          try {
            await ApiService.createAnalysis({
              name: analysis.name || "Análisis importado",
              description: "Importado desde archivo JSON",
              stats: analysis.stats_json || analysis.stats || analysis.summary,
              data: analysis.data_json || analysis.data || analysis.sampleData,
            });
          } catch (error) {
            console.error("Error al importar análisis:", error);
          }
        }

        refreshAnalysisList();
        showNotification(
          "success",
          `Se importaron ${importedData.length} análisis correctamente`
        );
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
        showNotification("error", "Error al importar análisis");
      } finally {
        setIsLoading(false);

        // Limpiar input para permitir seleccionar el mismo archivo nuevamente
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.readAsText(file);
  };

  // Mostrar notificación temporal
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } mb-8 rounded-lg shadow-md overflow-hidden`}
    >
      {/* Cabecera del panel */}
      <div
        className={`p-4 ${
          isDarkMode ? "bg-dark-bg-tertiary" : "bg-purple-600 text-white"
        } flex justify-between items-center cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="flex items-center text-xl font-semibold">
          <History className="mr-2" size={22} />
          Análisis guardados
        </h2>
        <button className={isDarkMode ? "text-gray-300" : "text-white"}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Contenido expandible */}
      {isOpen && (
        <div className="p-6">
          {/* Notificación */}
          {notification && (
            <div
              className={`mb-4 p-3 rounded-md flex items-center ${
                notification.type === "success"
                  ? isDarkMode
                    ? "bg-green-900 text-green-100"
                    : "bg-green-100 text-green-800"
                  : notification.type === "error"
                  ? isDarkMode
                    ? "bg-red-900 text-red-100"
                    : "bg-red-100 text-red-800"
                  : isDarkMode
                  ? "bg-blue-900 text-blue-100"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="mr-2" size={18} />
              ) : notification.type === "error" ? (
                <XCircle className="mr-2" size={18} />
              ) : (
                <Info className="mr-2" size={18} />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Mensaje de inicio de sesión si no está autenticado */}
          {!isAuthenticated && (
            <div
              className={`mb-4 p-4 rounded-md ${
                isDarkMode
                  ? "bg-amber-900 text-amber-100"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle className="mr-2 mt-0.5" size={18} />
                <div>
                  <p className="font-medium">
                    Inicie sesión para guardar análisis
                  </p>
                  <p className="mt-1 text-sm">
                    Para guardar y acceder a sus análisis desde cualquier
                    dispositivo, inicie sesión o regístrese en la plataforma.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Controles principales */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={saveCurrentAnalysis}
              disabled={!currentStats || isProcessing || !isAuthenticated}
              className={`inline-flex items-center px-3 py-2 text-sm ${
                !currentStats || isProcessing || !isAuthenticated
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-blue-700 hover:bg-blue-800 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
            >
              <Save className="mr-1" size={16} />
              Guardar análisis actual
            </button>

            <button
              onClick={exportAnalyses}
              disabled={savedAnalyses.length === 0}
              className={`inline-flex items-center px-3 py-2 text-sm ${
                savedAnalyses.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors`}
            >
              <Download className="mr-1" size={16} />
              Exportar análisis
            </button>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={importAnalyses}
                className="hidden"
                id="import-analyses"
              />
              <label
                htmlFor="import-analyses"
                className={`inline-flex items-center px-3 py-2 text-sm cursor-pointer ${
                  !isAuthenticated
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : isDarkMode
                    ? "bg-purple-700 hover:bg-purple-800 text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
              >
                <Upload className="mr-1" size={16} />
                Importar análisis
              </label>
            </div>

            <button
              onClick={refreshAnalysisList}
              disabled={!isAuthenticated}
              className={`inline-flex items-center px-3 py-2 text-sm ${
                !isAuthenticated
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-gray-700 hover:bg-gray-800 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
            >
              <RefreshCw
                className={`mr-1 ${isLoading ? "animate-spin" : ""}`}
                size={16}
              />
              Actualizar
            </button>
          </div>

          {/* Lista de análisis guardados */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw
                className="text-blue-500 animate-spin dark:text-blue-400"
                size={32}
              />
              <span className="ml-2">Cargando análisis...</span>
            </div>
          ) : savedAnalyses.length === 0 ? (
            <div
              className={`p-6 text-center ${
                isDarkMode
                  ? "bg-dark-bg-tertiary text-dark-text-secondary"
                  : "bg-gray-50 text-gray-500"
              } rounded-lg`}
            >
              <History className="mx-auto mb-2" size={32} />
              <p>
                {isAuthenticated
                  ? "No hay análisis guardados"
                  : "Inicie sesión para ver sus análisis"}
              </p>
              <p className="mt-2 text-sm">
                {isAuthenticated
                  ? "Los análisis que guarde aparecerán aquí"
                  : "O guarde análisis localmente exportándolos"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  onClick={() => loadAnalysis(analysis)}
                  className={`${
                    isDarkMode
                      ? "bg-dark-bg-tertiary border-dark-border hover:bg-dark-bg-secondary"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  } border rounded-lg p-4 cursor-pointer transition-colors shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="text-lg font-medium truncate"
                      title={analysis.name}
                    >
                      {analysis.name}
                    </h3>
                    <button
                      onClick={(e) => deleteAnalysis(analysis.id, e)}
                      className={`p-1 rounded-full ${
                        isDarkMode
                          ? "text-gray-400 hover:text-red-400 hover:bg-gray-800"
                          : "text-gray-500 hover:text-red-500 hover:bg-gray-100"
                      }`}
                      title="Eliminar análisis"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center mb-3 text-sm">
                    <Clock className="mr-1" size={14} />
                    <span
                      className={
                        isDarkMode
                          ? "text-dark-text-secondary"
                          : "text-gray-500"
                      }
                    >
                      {formatDate(analysis.created_at)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div
                      className={`p-2 text-center rounded ${
                        isDarkMode ? "bg-dark-bg-secondary" : "bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">
                        {analysis.total_processors}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Total
                      </div>
                    </div>

                    <div
                      className={`p-2 text-center rounded ${
                        isDarkMode
                          ? "bg-green-900/30 text-green-300"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      <div className="font-medium">
                        {analysis.meeting_requirements}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Cumplen
                      </div>
                    </div>

                    <div
                      className={`p-2 text-center rounded ${
                        isDarkMode
                          ? "bg-red-900/30 text-red-300"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <div className="font-medium">
                        {analysis.total_processors -
                          analysis.meeting_requirements}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        No cumplen
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div
                      className={`text-sm ${
                        analysis.compliance_rate >= 75
                          ? isDarkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : analysis.compliance_rate >= 50
                          ? isDarkMode
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          : isDarkMode
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    >
                      Tasa de cumplimiento:{" "}
                      {analysis.compliance_rate.toFixed(1)}%
                    </div>

                    <FileCheck
                      size={16}
                      className={`${
                        analysis.compliance_rate >= 75
                          ? isDarkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : analysis.compliance_rate >= 50
                          ? isDarkMode
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          : isDarkMode
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nota de ayuda */}
          <div
            className={`mt-4 p-3 text-sm ${
              isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-secondary"
                : "bg-gray-50 text-gray-500"
            } rounded-lg flex items-start`}
          >
            <AlertTriangle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <p>
                {isAuthenticated
                  ? "Los análisis guardados se almacenan en la nube y están disponibles desde cualquier dispositivo cuando inicia sesión."
                  : "Inicie sesión para guardar sus análisis en la nube y acceder a ellos desde cualquier dispositivo."}
              </p>
              <p className="mt-1">
                También puede exportar e importar sus análisis como archivos
                JSON para compartirlos o guardarlos localmente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAnalyses;
