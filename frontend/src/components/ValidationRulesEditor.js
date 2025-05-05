// components/ValidationRulesEditor.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { ValidationRulesContext } from "../context/ValidationRulesContext";
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import ApiService from "../services/apiService";
import {
  Settings,
  Save,
  RefreshCw,
  FileDown,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";

const ValidationRulesEditor = () => {
  const { rules, updateRules, resetRules } = useContext(ValidationRulesContext);
  const { isDarkMode } = useContext(ThemeContext);
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editedRules, setEditedRules] = useState(rules);
  const [activeSection, setActiveSection] = useState("intelCore");
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedRules, setSavedRules] = useState([]);
  const fileInputRef = useRef(null);

  // Cargar reglas cuando cambie el contexto
  useEffect(() => {
    setEditedRules(rules);
  }, [rules]);

  // Cargar reglas del servidor si está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      loadRulesFromServer();
    }
  }, [isAuthenticated]);

  // Función para cargar reglas desde el servidor
  const loadRulesFromServer = async () => {
    setIsLoading(true);
    try {
      // Primero intentar cargar la regla predeterminada
      const response = await ApiService.getDefaultRule();
      if (response.success && response.rule) {
        updateRules(response.rule.rules_json);
        setEditedRules(response.rule.rules_json);
      }

      // Cargar la lista de todas las reglas guardadas
      const allRulesResponse = await ApiService.getRules();
      if (allRulesResponse.success) {
        setSavedRules(allRulesResponse.rules);
      }
    } catch (error) {
      console.error("Error al cargar reglas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambios en los inputs
  const handleChange = (category, processor, field, value) => {
    // Si es para procesadores
    if (
      category === "intelCore" ||
      category === "amdRyzen" ||
      category === "otherProcessors"
    ) {
      // Convertir a número si es numérico
      if (field === "minGeneration" || field === "minSpeed") {
        value = parseFloat(value);
      }

      // Manejar checkbox
      if (field === "enabled") {
        value = value === true;
      }

      setEditedRules((prevRules) => ({
        ...prevRules,
        [category]: {
          ...prevRules[category],
          [processor]: {
            ...prevRules[category][processor],
            [field]: value,
          },
        },
      }));
    }
    // Para las nuevas secciones de RAM y almacenamiento
    else if (category === "ram" || category === "storage") {
      // Para los campos numéricos
      if (field === "minCapacity") {
        value = parseFloat(value);
      }

      // Para los campos booleanos
      if (field === "preferSSD") {
        value = value === true;
      }

      setEditedRules((prevRules) => ({
        ...prevRules,
        [category]: {
          ...(prevRules[category] || {}),
          [field]: value,
        },
      }));
    }
  };

  // Guardar cambios
  const saveChanges = async () => {
    // Actualizar en el contexto local
    updateRules(editedRules);

    // Si está autenticado, guardar en el servidor
    if (isAuthenticated) {
      setIsLoading(true);
      try {
        // Verificar si hay una regla predeterminada para actualizar
        let defaultRule = savedRules.find((rule) => rule.is_default);

        if (defaultRule) {
          // Actualizar la regla existente
          await ApiService.updateRule(defaultRule.id, {
            rules_json: editedRules,
            is_default: true,
          });
        } else {
          // Crear una nueva regla predeterminada
          await ApiService.createRule({
            name: "Configuración predeterminada",
            rules_json: editedRules,
            is_default: true,
          });

          // Recargar la lista de reglas
          loadRulesFromServer();
        }

        showNotification("success", "Reglas guardadas correctamente");
      } catch (error) {
        console.error("Error al guardar reglas:", error);
        showNotification("error", "Error al guardar las reglas");
      } finally {
        setIsLoading(false);
      }
    } else {
      showNotification("success", "Reglas guardadas en localStorage");
    }
  };

  // Restablecer reglas
  const handleReset = () => {
    if (
      window.confirm(
        "¿Está seguro que desea restablecer las reglas predeterminadas? Se perderán todas las personalizaciones."
      )
    ) {
      resetRules();
      setEditedRules(rules);
      showNotification(
        "info",
        "Reglas restablecidas a valores predeterminados"
      );
    }
  };

  // Mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Exportar reglas
  const handleExportRules = () => {
    const dataStr = JSON.stringify(editedRules, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const dataUrl = URL.createObjectURL(dataBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = dataUrl;
    downloadLink.download = "reglas_validacion.json";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    showNotification("success", "Reglas exportadas correctamente");
  };

  // Importar reglas
  const handleImportRules = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedRules = JSON.parse(e.target.result);

          // Validar estructura básica
          if (
            importedRules.intelCore &&
            importedRules.amdRyzen &&
            importedRules.otherProcessors
          ) {
            setEditedRules(importedRules);
            saveChanges(); // Guardar las reglas importadas
            showNotification("success", "Reglas importadas correctamente");
          } else {
            showNotification(
              "error",
              "El archivo no contiene un formato válido de reglas"
            );
          }
        } catch (error) {
          showNotification("error", "Error al importar: " + error.message);
        }
      };
      reader.readAsText(file);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Estructura de UI para cada tipo de procesador
  const renderProcessorFields = (category, processorKey) => {
    const processor = editedRules[category][processorKey];

    return (
      <div
        key={`${category}-${processorKey}`}
        className={`p-4 mb-2 rounded-lg ${
          isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
        }`}
      >
        <h4 className="mb-3 font-medium">{processor.name}</h4>

        {category === "otherProcessors" && (
          <div className="mb-3">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={processor.enabled}
                onChange={(e) =>
                  handleChange(
                    category,
                    processorKey,
                    "enabled",
                    e.target.checked
                  )
                }
                className="w-4 h-4 text-blue-600 form-checkbox"
              />
              <span className="ml-2 text-sm">Considerar como válido</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Generación mínima
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={processor.minGeneration}
              onChange={(e) =>
                handleChange(
                  category,
                  processorKey,
                  "minGeneration",
                  e.target.value
                )
              }
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                isDarkMode
                  ? "bg-dark-bg-secondary border-dark-border text-dark-text-primary"
                  : "bg-white border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              0 = cualquiera
            </p>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">
              Velocidad mínima (GHz)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={processor.minSpeed}
              onChange={(e) =>
                handleChange(category, processorKey, "minSpeed", e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                isDarkMode
                  ? "bg-dark-bg-secondary border-dark-border text-dark-text-primary"
                  : "bg-white border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              0 = cualquiera
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } mb-8 rounded-lg shadow-md overflow-hidden`}
    >
      {/* Cabecera siempre visible */}
      <div
        className={`p-4 ${
          isDarkMode ? "bg-dark-bg-tertiary" : "bg-indigo-600 text-white"
        } flex justify-between items-center cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="flex items-center text-xl font-semibold">
          <Settings className="mr-2" size={22} />
          Configuración de reglas de validación
        </h2>
        <button className="text-white">
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
              <AlertTriangle className="mr-2" size={18} />
              <span>{notification.message}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center p-3 mb-4 text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900 dark:text-blue-100">
              <RefreshCw className="mr-2 animate-spin" size={18} />
              <span>Cargando reglas...</span>
            </div>
          )}

          {/* Descripción */}
          <p
            className={`mb-4 ${
              isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
            }`}
          >
            Personalice los requisitos mínimos que deben cumplir los componentes
            para ser considerados válidos en la auditoría.
          </p>

          {/* Navegación entre secciones */}
          <div className="flex flex-wrap mb-4 border-b">
            <button
              className={`py-2 px-4 font-medium ${
                activeSection === "intelCore"
                  ? isDarkMode
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-dark-text-secondary"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection("intelCore")}
            >
              Intel Core
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeSection === "amdRyzen"
                  ? isDarkMode
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-dark-text-secondary"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection("amdRyzen")}
            >
              AMD Ryzen
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeSection === "otherProcessors"
                  ? isDarkMode
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-dark-text-secondary"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection("otherProcessors")}
            >
              Otros procesadores
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeSection === "ram"
                  ? isDarkMode
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-dark-text-secondary"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection("ram")}
            >
              Memoria RAM
            </button>
            <button
              className={`py-2 px-4 font-medium ${
                activeSection === "storage"
                  ? isDarkMode
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-dark-text-secondary"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveSection("storage")}
            >
              Almacenamiento
            </button>
          </div>

          {/* Formulario según sección activa */}
          <div className="mt-4">
            {activeSection === "intelCore" && (
              <>
                <h3 className="mb-3 text-lg font-medium">
                  Procesadores Intel Core
                </h3>
                {Object.keys(editedRules.intelCore).map((processorKey) =>
                  renderProcessorFields("intelCore", processorKey)
                )}
              </>
            )}

            {activeSection === "amdRyzen" && (
              <>
                <h3 className="mb-3 text-lg font-medium">
                  Procesadores AMD Ryzen
                </h3>
                {Object.keys(editedRules.amdRyzen).map((processorKey) =>
                  renderProcessorFields("amdRyzen", processorKey)
                )}
              </>
            )}

            {activeSection === "otherProcessors" && (
              <>
                <h3 className="mb-3 text-lg font-medium">Otros procesadores</h3>
                {Object.keys(editedRules.otherProcessors).map((processorKey) =>
                  renderProcessorFields("otherProcessors", processorKey)
                )}
              </>
            )}

            {activeSection === "ram" && (
              <>
                <h3 className="mb-3 text-lg font-medium">Memoria RAM</h3>
                <div
                  className={`p-4 mb-2 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  }`}
                >
                  <h4 className="mb-3 font-medium">
                    Configuración de Memoria RAM
                  </h4>
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">
                      Capacidad mínima (GB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editedRules.ram?.minCapacity || 8}
                      onChange={(e) =>
                        handleChange("ram", null, "minCapacity", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        isDarkMode
                          ? "bg-dark-bg-secondary border-dark-border text-dark-text-primary"
                          : "bg-white border-gray-300"
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Capacidad mínima requerida en GB
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeSection === "storage" && (
              <>
                <h3 className="mb-3 text-lg font-medium">Almacenamiento</h3>
                <div
                  className={`p-4 mb-2 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  }`}
                >
                  <h4 className="mb-3 font-medium">
                    Configuración de Almacenamiento
                  </h4>
                  <div className="mb-4">
                    <label className="block mb-1 text-sm font-medium">
                      Capacidad mínima (GB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editedRules.storage?.minCapacity || 256}
                      onChange={(e) =>
                        handleChange(
                          "storage",
                          null,
                          "minCapacity",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md text-sm ${
                        isDarkMode
                          ? "bg-dark-bg-secondary border-dark-border text-dark-text-primary"
                          : "bg-white border-gray-300"
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Capacidad mínima requerida en GB
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={editedRules.storage?.preferSSD || false}
                        onChange={(e) =>
                          handleChange(
                            "storage",
                            null,
                            "preferSSD",
                            e.target.checked
                          )
                        }
                        className="w-4 h-4 text-blue-600 form-checkbox"
                      />
                      <span className="ml-2 text-sm">Preferir SSD</span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Si está marcado, solo se considerarán válidos los SSD
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controles */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={saveChanges}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-blue-700 hover:bg-blue-800"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
            >
              <Save className="mr-2" size={18} />
              Guardar cambios
            </button>

            <button
              onClick={handleReset}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-amber-700 hover:bg-amber-800"
                  : "bg-amber-600 hover:bg-amber-700"
              } text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors`}
            >
              <RefreshCw className="mr-2" size={18} />
              Restablecer predeterminados
            </button>

            <button
              onClick={handleExportRules}
              disabled={isLoading}
              className={`inline-flex items-center px-4 py-2 ${
                isLoading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                  : isDarkMode
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-green-600 hover:bg-green-700"
              } text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors`}
            >
              <FileDown className="mr-2" size={18} />
              Exportar reglas
            </button>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportRules}
                className="hidden"
                id="import-rules"
              />
              <label
                htmlFor="import-rules"
                className={`inline-flex items-center px-4 py-2 cursor-pointer ${
                  isLoading
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                    : isDarkMode
                    ? "bg-purple-700 hover:bg-purple-800"
                    : "bg-purple-600 hover:bg-purple-700"
                } text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors`}
              >
                <Upload className="mr-2" size={18} />
                Importar reglas
              </label>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={`inline-flex items-center px-4 py-2 ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-800"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white rounded-lg focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors`}
            >
              <X className="mr-2" size={18} />
              Cerrar
            </button>
          </div>

          {/* Nota informativa */}
          <div
            className={`mt-6 p-3 rounded-md text-sm ${
              isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-secondary"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <div className="flex items-start">
              <AlertTriangle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p>
                  {isAuthenticated
                    ? "Las reglas se guardan en la nube y están disponibles desde cualquier dispositivo cuando inicia sesión."
                    : "Actualmente las reglas se guardan solo en este navegador. Inicie sesión para guardarlas en la nube."}
                </p>
                <p className="mt-1">
                  También puede exportar e importar sus reglas como archivos
                  JSON para compartirlas o guardarlas localmente.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationRulesEditor;
