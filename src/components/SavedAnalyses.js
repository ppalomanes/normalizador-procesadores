// components/SavedAnalyses.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { analysisStorage } from "../utils/analysisStorage";
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
  const [isOpen, setIsOpen] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar análisis guardados al montar el componente
  useEffect(() => {
    refreshAnalysisList();
  }, []);

  // Actualizar la lista de análisis guardados
  const refreshAnalysisList = () => {
    const analyses = analysisStorage.getAnalysisList();
    setSavedAnalyses(analyses);
  };

  // Guardar análisis actual
  const saveCurrentAnalysis = () => {
    if (!currentStats || !normalizedData || normalizedData.length === 0) {
      showNotification("error", "No hay datos para guardar");
      return;
    }

    const name = prompt(
      "Ingrese un nombre para este análisis:",
      `Análisis ${new Date().toLocaleString()}`
    );
    if (!name) return; // Usuario canceló

    const saved = analysisStorage.saveAnalysis({
      name: name,
      stats: currentStats,
      data: normalizedData,
    });

    if (saved) {
      refreshAnalysisList();
      showNotification("success", "Análisis guardado correctamente");
    } else {
      showNotification("error", "Error al guardar el análisis");
    }
  };

  // Cargar un análisis guardado
  const loadAnalysis = (analysis) => {
    if (!analysis || !analysis.stats) {
      showNotification("error", "No se puede cargar el análisis");
      return;
    }

    if (onLoadSavedAnalysis && typeof onLoadSavedAnalysis === "function") {
      onLoadSavedAnalysis(analysis);
      showNotification("success", `Análisis "${analysis.name}" cargado`);
    }
  };

  // Eliminar un análisis guardado
  const deleteAnalysis = (id, e) => {
    e.stopPropagation(); // Evitar activación del onClick del elemento padre

    if (window.confirm("¿Está seguro que desea eliminar este análisis?")) {
      const deleted = analysisStorage.deleteAnalysis(id);
      if (deleted) {
        refreshAnalysisList();
        showNotification("info", "Análisis eliminado");
      } else {
        showNotification("error", "Error al eliminar el análisis");
      }
    }
  };

  // Eliminar todos los análisis
  const deleteAllAnalyses = () => {
    if (
      window.confirm(
        "¿Está seguro que desea eliminar TODOS los análisis guardados? Esta acción no se puede deshacer."
      )
    ) {
      const cleared = analysisStorage.clearAllAnalyses();
      if (cleared) {
        refreshAnalysisList();
        showNotification("info", "Todos los análisis han sido eliminados");
      } else {
        showNotification("error", "Error al eliminar los análisis");
      }
    }
  };

  // Exportar análisis
  const exportAnalyses = () => {
    const exported = analysisStorage.exportAllAnalyses();
    if (exported) {
      showNotification("success", "Análisis exportados correctamente");
    } else {
      showNotification("error", "Error al exportar los análisis");
    }
  };

  // Importar análisis
  const importAnalyses = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    analysisStorage
      .importAnalyses(file)
      .then((result) => {
        if (result.success) {
          refreshAnalysisList();
          showNotification("success", result.message);
        } else {
          showNotification("error", result.message);
        }
      })
      .catch((error) => {
        showNotification(
          "error",
          error.message || "Error al importar análisis"
        );
      });

    // Limpiar input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
        <h2 className="text-xl font-semibold flex items-center">
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

          {/* Controles principales */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={saveCurrentAnalysis}
              disabled={!currentStats || isProcessing}
              className={`inline-flex items-center px-3 py-2 text-sm ${
                !currentStats || isProcessing
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
                  isDarkMode
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
              className={`inline-flex items-center px-3 py-2 text-sm ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-800 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors`}
            >
              <RefreshCw className="mr-1" size={16} />
              Actualizar
            </button>

            {savedAnalyses.length > 0 && (
              <button
                onClick={deleteAllAnalyses}
                className={`inline-flex items-center px-3 py-2 text-sm ${
                  isDarkMode
                    ? "bg-red-700 hover:bg-red-800 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors`}
              >
                <Trash2 className="mr-1" size={16} />
                Eliminar todo
              </button>
            )}
          </div>

          {/* Lista de análisis guardados */}
          {savedAnalyses.length === 0 ? (
            <div
              className={`p-6 text-center ${
                isDarkMode
                  ? "bg-dark-bg-tertiary text-dark-text-secondary"
                  : "bg-gray-50 text-gray-500"
              } rounded-lg`}
            >
              <History className="mx-auto mb-2" size={32} />
              <p>No hay análisis guardados</p>
              <p className="text-sm mt-2">
                Los análisis que guarde aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-lg truncate"
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

                  <div className="flex items-center text-sm mb-3">
                    <Clock className="mr-1" size={14} />
                    <span
                      className={
                        isDarkMode
                          ? "text-dark-text-secondary"
                          : "text-gray-500"
                      }
                    >
                      {formatDate(analysis.timestamp)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div
                      className={`p-2 text-center rounded ${
                        isDarkMode ? "bg-dark-bg-secondary" : "bg-gray-50"
                      }`}
                    >
                      <div className="font-medium">
                        {analysis.summary.totalProcessors}
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
                        {analysis.summary.meetingRequirements}
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
                        {analysis.summary.totalProcessors -
                          analysis.summary.meetingRequirements}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400">
                        No cumplen
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div
                      className={`text-sm ${
                        analysis.summary.complianceRate >= 75
                          ? isDarkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : analysis.summary.complianceRate >= 50
                          ? isDarkMode
                            ? "text-yellow-400"
                            : "text-yellow-600"
                          : isDarkMode
                          ? "text-red-400"
                          : "text-red-600"
                      }`}
                    >
                      Tasa de cumplimiento:{" "}
                      {analysis.summary.complianceRate.toFixed(1)}%
                    </div>

                    <FileCheck
                      size={16}
                      className={`${
                        analysis.summary.complianceRate >= 75
                          ? isDarkMode
                            ? "text-green-400"
                            : "text-green-600"
                          : analysis.summary.complianceRate >= 50
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
                Los análisis guardados se almacenan en el navegador. Si limpia
                el almacenamiento del navegador, estos análisis se perderán.
                Utilice las opciones de exportación e importación para conservar
                sus datos.
              </p>
              <p className="mt-1">
                Se guardan hasta 10 análisis. Los más antiguos se eliminarán
                automáticamente al guardar nuevos análisis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAnalyses;
