// components/ValidationRulesEditor.js
import React, { useState, useContext, useRef } from "react";
import { ValidationRulesContext } from "../context/ValidationRulesContext";
import { ThemeContext } from "../context/ThemeContext";
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
  const { rules, updateRules, resetRules, exportRules, importRules } =
    useContext(ValidationRulesContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [editedRules, setEditedRules] = useState(rules);
  const [activeSection, setActiveSection] = useState("intelCore");
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

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
  const saveChanges = () => {
    updateRules(editedRules);
    showNotification("success", "Reglas guardadas correctamente");
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

  // Importar reglas
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const result = importRules(file);
      if (result && result.success) {
        setEditedRules(rules);
        showNotification("success", result.message);
      } else {
        showNotification("error", result.message);
      }
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
        <h4 className="font-medium mb-3">{processor.name}</h4>

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
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-sm">Considerar como válido</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
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
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
              0 = cualquiera
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
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
            <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
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
        <h2 className="text-xl font-semibold flex items-center">
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
          <div className="flex border-b mb-4 flex-wrap">
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
                <h3 className="text-lg font-medium mb-3">
                  Procesadores Intel Core
                </h3>
                {Object.keys(editedRules.intelCore).map((processorKey) =>
                  renderProcessorFields("intelCore", processorKey)
                )}
              </>
            )}

            {activeSection === "amdRyzen" && (
              <>
                <h3 className="text-lg font-medium mb-3">
                  Procesadores AMD Ryzen
                </h3>
                {Object.keys(editedRules.amdRyzen).map((processorKey) =>
                  renderProcessorFields("amdRyzen", processorKey)
                )}
              </>
            )}

            {activeSection === "otherProcessors" && (
              <>
                <h3 className="text-lg font-medium mb-3">Otros procesadores</h3>
                {Object.keys(editedRules.otherProcessors).map((processorKey) =>
                  renderProcessorFields("otherProcessors", processorKey)
                )}
              </>
            )}

            {activeSection === "ram" && (
              <>
                <h3 className="text-lg font-medium mb-3">Memoria RAM</h3>
                <div
                  className={`p-4 mb-2 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  }`}
                >
                  <h4 className="font-medium mb-3">
                    Configuración de Memoria RAM
                  </h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
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
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      Capacidad mínima requerida en GB
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeSection === "storage" && (
              <>
                <h3 className="text-lg font-medium mb-3">Almacenamiento</h3>
                <div
                  className={`p-4 mb-2 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  }`}
                >
                  <h4 className="font-medium mb-3">
                    Configuración de Almacenamiento
                  </h4>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
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
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
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
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm">Preferir SSD</span>
                    </label>
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      Si está marcado, solo se considerarán válidos los SSD
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Controles */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={saveChanges}
              className={`inline-flex items-center px-4 py-2 ${
                isDarkMode
                  ? "bg-blue-700 hover:bg-blue-800"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
            >
              <Save className="mr-2" size={18} />
              Guardar cambios
            </button>

            <button
              onClick={handleReset}
              className={`inline-flex items-center px-4 py-2 ${
                isDarkMode
                  ? "bg-amber-700 hover:bg-amber-800"
                  : "bg-amber-600 hover:bg-amber-700"
              } text-white rounded-lg focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors`}
            >
              <RefreshCw className="mr-2" size={18} />
              Restablecer predeterminados
            </button>

            <button
              onClick={exportRules}
              className={`inline-flex items-center px-4 py-2 ${
                isDarkMode
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
                onChange={handleImport}
                className="hidden"
                id="import-rules"
              />
              <label
                htmlFor="import-rules"
                className={`inline-flex items-center px-4 py-2 cursor-pointer ${
                  isDarkMode
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
        </div>
      )}
    </div>
  );
};

export default ValidationRulesEditor;
