// components/RecommendationsPanel.js
import React, { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../context/ThemeContext";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Terminal,
  Calendar,
  Tag,
  CheckCircle,
  TrendingUp,
  Award,
  DollarSign,
} from "lucide-react";

const RecommendationsPanel = ({ stats, normalizedData }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [upgradeList, setUpgradeList] = useState([]);
  const [timelineVisible, setTimelineVisible] = useState(false);

  // Generar recomendaciones basadas en los datos
  useEffect(() => {
    if (!stats || !normalizedData) return;

    const newRecommendations = [];
    const upgrades = [];

    // Extraer insights de los datos
    const complianceRate = stats.complianceRate;
    const nonCompliantCount = stats.notMeetingRequirements;

    // Procesadores que no cumplen por marca/modelo
    const nonCompliantByModel = {};
    normalizedData
      .filter((row) => row["Cumple Requisitos"] === "No")
      .forEach((row) => {
        const key = `${row["Marca Procesador"]} ${row["Modelo Procesador"]}`;
        nonCompliantByModel[key] = (nonCompliantByModel[key] || 0) + 1;
      });

    // Convertir a array y ordenar por cantidad (descendente)
    const sortedNonCompliantModels = Object.entries(nonCompliantByModel)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count);

    // Recomendaciones generales basadas en la tasa de cumplimiento
    if (complianceRate < 50) {
      newRecommendations.push({
        title: "Renovación prioritaria del parque informático",
        description: `Con solo ${complianceRate.toFixed(
          1
        )}% de equipos que cumplen los requisitos, se recomienda un plan de actualización agresivo, priorizando la adquisición de nuevos equipos.`,
        type: "critical",
        icon: <AlertCircle size={20} />,
      });
    } else if (complianceRate < 75) {
      newRecommendations.push({
        title: "Plan de actualización gradual",
        description: `Con ${complianceRate.toFixed(
          1
        )}% de equipos que cumplen los requisitos, se recomienda un plan de actualización por fases, comenzando por los equipos más críticos.`,
        type: "warning",
        icon: <TrendingUp size={20} />,
      });
    } else {
      newRecommendations.push({
        title: "Mantenimiento del parque informático",
        description: `Con ${complianceRate.toFixed(
          1
        )}% de equipos que cumplen los requisitos, se recomienda mantener el plan actual de renovación periódica.`,
        type: "success",
        icon: <CheckCircle size={20} />,
      });
    }

    // Recomendaciones específicas basadas en los modelos que más fallan
    if (sortedNonCompliantModels.length > 0) {
      const topModel = sortedNonCompliantModels[0];
      newRecommendations.push({
        title: `Priorizar reemplazo de ${topModel.model}`,
        description: `${topModel.count} equipos con ${topModel.model} no cumplen con los requisitos. Se recomienda priorizar su reemplazo.`,
        type: "info",
        icon: <Terminal size={20} />,
      });

      // Generar lista de recomendaciones de reemplazo específicas
      sortedNonCompliantModels.forEach(({ model, count }) => {
        let replacementSuggestion;

        if (
          model.includes("Intel Core i3") ||
          model.includes("Intel Celeron") ||
          model.includes("Intel Pentium")
        ) {
          replacementSuggestion = "Intel Core i5 de 11ª generación o superior";
        } else if (
          model.includes("Intel Core i5") &&
          !model.includes("de 8ª")
        ) {
          replacementSuggestion = "Intel Core i5 de 11ª/12ª generación";
        } else if (
          model.includes("AMD Ryzen 3") ||
          model.includes("AMD Athlon")
        ) {
          replacementSuggestion = "AMD Ryzen 5 5600X o superior";
        } else if (model.includes("AMD Ryzen 5") && model.includes("2")) {
          replacementSuggestion = "AMD Ryzen 5 5600X o superior";
        } else {
          replacementSuggestion =
            "Procesador de última generación (Intel Core i5/i7 11ª gen+ o AMD Ryzen 5/7 5000+)";
        }

        // Estimar costo aproximado de actualización
        const costPerUnit = model.includes("Core i")
          ? 350
          : model.includes("Ryzen")
          ? 320
          : 300;
        const totalCost = costPerUnit * count;

        upgrades.push({
          currentModel: model,
          count,
          replacement: replacementSuggestion,
          estimatedCost: totalCost,
          priority: count > 10 ? "Alta" : count > 5 ? "Media" : "Baja",
        });
      });
    }

    // Recomendación sobre capacitación si hay más de 20 equipos que no cumplen
    if (nonCompliantCount > 20) {
      newRecommendations.push({
        title: "Desarrollar plan de gestión de cambio",
        description: `Con ${nonCompliantCount} equipos por actualizar, se recomienda desarrollar un plan de gestión del cambio para minimizar el impacto en la productividad.`,
        type: "info",
        icon: <Calendar size={20} />,
      });
    }

    // Recomendación sobre presupuesto
    const totalEstimatedCost = upgrades.reduce(
      (sum, item) => sum + item.estimatedCost,
      0
    );
    if (totalEstimatedCost > 0) {
      newRecommendations.push({
        title: "Planificación presupuestaria",
        description: `Se estima un presupuesto aproximado de $${totalEstimatedCost.toLocaleString()} para actualizar todos los equipos que no cumplen con los requisitos.`,
        type: "warning",
        icon: <DollarSign size={20} />,
      });
    }

    // Recomendación sobre estandarización
    if (Object.keys(stats.modelDistribution).length > 5) {
      newRecommendations.push({
        title: "Estandarización de hardware",
        description:
          "Se detectaron más de 5 modelos diferentes de procesadores. Se recomienda estandarizar el hardware para facilitar el soporte y mantenimiento.",
        type: "info",
        icon: <Tag size={20} />,
      });
    }

    // Actualizar el estado
    setRecommendations(newRecommendations);
    setUpgradeList(upgrades);
  }, [stats, normalizedData]);

  // Renderizar recomendaciones
  const renderRecommendation = (rec, index) => {
    const getTypeStyles = () => {
      switch (rec.type) {
        case "critical":
          return isDarkMode
            ? "bg-red-900 border-red-700 text-red-200"
            : "bg-red-50 border-red-200 text-red-800";
        case "warning":
          return isDarkMode
            ? "bg-amber-900 border-amber-700 text-amber-200"
            : "bg-amber-50 border-amber-200 text-amber-800";
        case "success":
          return isDarkMode
            ? "bg-green-900 border-green-700 text-green-200"
            : "bg-green-50 border-green-200 text-green-800";
        case "info":
        default:
          return isDarkMode
            ? "bg-blue-900 border-blue-700 text-blue-200"
            : "bg-blue-50 border-blue-200 text-blue-800";
      }
    };

    return (
      <div
        key={index}
        className={`mb-3 p-4 rounded-lg border ${getTypeStyles()}`}
      >
        <div className="flex items-center mb-2">
          <div className="mr-2">{rec.icon}</div>
          <h3 className="font-medium">{rec.title}</h3>
        </div>
        <p className="ml-7">{rec.description}</p>
      </div>
    );
  };

  // Si no hay datos, no mostrar el componente
  if (!stats || !normalizedData || recommendations.length === 0) {
    return null;
  }

  return (
    <div
      className={`mb-8 ${
        isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
      } rounded-lg shadow-md overflow-hidden`}
    >
      {/* Cabecera */}
      <div
        className={`p-4 ${
          isDarkMode ? "bg-dark-bg-tertiary" : "bg-yellow-600 text-white"
        } flex justify-between items-center cursor-pointer`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold flex items-center">
          <Lightbulb className="mr-2" size={22} />
          Recomendaciones
        </h2>
        <button className={isDarkMode ? "text-gray-300" : "text-white"}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Contenido expandible */}
      {isOpen && (
        <div className="p-6">
          <div className="mb-6">
            <p
              className={`mb-4 ${
                isDarkMode ? "text-dark-text-secondary" : "text-gray-600"
              }`}
            >
              Basado en el análisis de {stats.totalProcessors} equipos, se
              presentan las siguientes recomendaciones para optimizar el parque
              informático:
            </p>

            {/* Lista de recomendaciones */}
            <div className="space-y-3">
              {recommendations.map((rec, index) =>
                renderRecommendation(rec, index)
              )}
            </div>
          </div>

          {/* Tabla de recomendaciones de actualización */}
          {upgradeList.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Award className="mr-2" size={20} />
                Plan de actualización recomendado
              </h3>

              <div className="overflow-x-auto">
                <table
                  className={`min-w-full ${
                    isDarkMode
                      ? "bg-dark-bg-tertiary text-dark-text-primary"
                      : "bg-white"
                  } border ${
                    isDarkMode ? "border-dark-border" : "border-gray-200"
                  } rounded-lg`}
                >
                  <thead
                    className={
                      isDarkMode ? "bg-dark-bg-secondary" : "bg-gray-50"
                    }
                  >
                    <tr>
                      <th className="px-4 py-2 text-left">Modelo actual</th>
                      <th className="px-4 py-2 text-left">Cantidad</th>
                      <th className="px-4 py-2 text-left">Recomendación</th>
                      <th className="px-4 py-2 text-left">Costo estimado</th>
                      <th className="px-4 py-2 text-left">Prioridad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {upgradeList.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          isDarkMode
                            ? "hover:bg-dark-bg-secondary"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-4 py-2">{item.currentModel}</td>
                        <td className="px-4 py-2">{item.count}</td>
                        <td className="px-4 py-2">{item.replacement}</td>
                        <td className="px-4 py-2">
                          ${item.estimatedCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.priority === "Alta"
                                ? isDarkMode
                                  ? "bg-red-900 text-red-200"
                                  : "bg-red-100 text-red-800"
                                : item.priority === "Media"
                                ? isDarkMode
                                  ? "bg-yellow-900 text-yellow-200"
                                  : "bg-yellow-100 text-yellow-800"
                                : isDarkMode
                                ? "bg-blue-900 text-blue-200"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot
                    className={
                      isDarkMode
                        ? "bg-dark-bg-secondary font-medium"
                        : "bg-gray-50 font-medium"
                    }
                  >
                    <tr>
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2">
                        {upgradeList.reduce((sum, item) => sum + item.count, 0)}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2">
                        $
                        {upgradeList
                          .reduce((sum, item) => sum + item.estimatedCost, 0)
                          .toLocaleString()}
                      </td>
                      <td className="px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Timeline button */}
              <div className="mt-4">
                <button
                  onClick={() => setTimelineVisible(!timelineVisible)}
                  className={`inline-flex items-center px-4 py-2 text-sm ${
                    isDarkMode
                      ? "bg-indigo-700 hover:bg-indigo-800 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  } rounded focus:outline-none transition-colors`}
                >
                  <Calendar className="mr-2" size={16} />
                  {timelineVisible
                    ? "Ocultar cronograma"
                    : "Ver cronograma sugerido"}
                </button>
              </div>

              {/* Timeline */}
              {timelineVisible && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  }`}
                >
                  <h3 className="text-lg font-medium mb-3">
                    Cronograma de implementación sugerido
                  </h3>

                  <div className="relative">
                    {/* Línea vertical */}
                    <div
                      className={`absolute left-3 top-2 bottom-0 w-0.5 ${
                        isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    ></div>

                    {/* Etapas */}
                    <div className="ml-10 space-y-8">
                      <div className="relative">
                        <div
                          className={`absolute -left-10 p-1 rounded-full ${
                            isDarkMode ? "bg-blue-700" : "bg-blue-500"
                          }`}
                        >
                          <span className="block h-5 w-5 rounded-full bg-white text-center leading-5 text-xs font-bold text-blue-500">
                            1
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Fase 1 - Evaluación (1 mes)
                          </h4>
                          <p
                            className={`mt-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Realizar un inventario detallado, definir
                            presupuesto y establecer prioridades basadas en
                            roles críticos.
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <div
                          className={`absolute -left-10 p-1 rounded-full ${
                            isDarkMode ? "bg-green-700" : "bg-green-500"
                          }`}
                        >
                          <span className="block h-5 w-5 rounded-full bg-white text-center leading-5 text-xs font-bold text-green-500">
                            2
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Fase 2 - Adquisición prioridad alta (2-3 meses)
                          </h4>
                          <p
                            className={`mt-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Compra e implementación de equipos para reemplazar
                            modelos de prioridad alta (
                            {upgradeList
                              .filter((i) => i.priority === "Alta")
                              .reduce((sum, i) => sum + i.count, 0)}{" "}
                            equipos).
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <div
                          className={`absolute -left-10 p-1 rounded-full ${
                            isDarkMode ? "bg-yellow-700" : "bg-yellow-500"
                          }`}
                        >
                          <span className="block h-5 w-5 rounded-full bg-white text-center leading-5 text-xs font-bold text-yellow-500">
                            3
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Fase 3 - Adquisición prioridad media (3-6 meses)
                          </h4>
                          <p
                            className={`mt-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Compra e implementación de equipos para reemplazar
                            modelos de prioridad media (
                            {upgradeList
                              .filter((i) => i.priority === "Media")
                              .reduce((sum, i) => sum + i.count, 0)}{" "}
                            equipos).
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <div
                          className={`absolute -left-10 p-1 rounded-full ${
                            isDarkMode ? "bg-purple-700" : "bg-purple-500"
                          }`}
                        >
                          <span className="block h-5 w-5 rounded-full bg-white text-center leading-5 text-xs font-bold text-purple-500">
                            4
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Fase 4 - Adquisición prioridad baja (6-12 meses)
                          </h4>
                          <p
                            className={`mt-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Compra e implementación de equipos restantes (
                            {upgradeList
                              .filter((i) => i.priority === "Baja")
                              .reduce((sum, i) => sum + i.count, 0)}{" "}
                            equipos).
                          </p>
                        </div>
                      </div>

                      <div className="relative">
                        <div
                          className={`absolute -left-10 p-1 rounded-full ${
                            isDarkMode ? "bg-red-700" : "bg-red-500"
                          }`}
                        >
                          <span className="block h-5 w-5 rounded-full bg-white text-center leading-5 text-xs font-bold text-red-500">
                            5
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Fase 5 - Evaluación y planificación futura (12+
                            meses)
                          </h4>
                          <p
                            className={`mt-1 ${
                              isDarkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Establecer un ciclo de renovación periódica (cada
                            3-4 años) para mantener un parque informático
                            actualizado.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nota aclaratoria */}
          <div
            className={`mt-6 p-3 text-sm rounded-lg ${
              isDarkMode
                ? "bg-dark-bg-tertiary text-dark-text-secondary"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            <div className="flex items-start">
              <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p>
                  Estas recomendaciones son orientativas y se basan únicamente
                  en el análisis de procesadores. Un plan completo debería
                  considerar otros factores como RAM, almacenamiento, antigüedad
                  de los equipos y necesidades específicas de cada área.
                </p>
                <p className="mt-1">
                  Los costos estimados son aproximados y pueden variar según el
                  mercado y las especificaciones completas de los equipos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;
