// components/StatsDisplay.js
import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Info, FileDown, Download, File, FileText } from "lucide-react";
import { exportToExcel } from "../utils/excelProcessor";
import { exportToPDF, exportDetailedReport } from "../utils/pdfExporter";
import StatsCharts from "./StatsCharts";

const StatsDisplay = ({ stats, normalizedData }) => {
  const { isDarkMode } = useContext(ThemeContext);

  // Función para descargar el Excel normalizado
  const downloadNormalizedExcel = () => {
    if (!normalizedData) return;
    exportToExcel(normalizedData, "Hardware_Normalizado.xlsx");
  };

  // Función para descargar un reporte de estadísticas
  const downloadStatsReport = () => {
    if (!stats) return;

    // Crear datos para el reporte de estadísticas
    const reportData = [
      {
        Estadística: "Total de equipos analizados",
        Valor: stats.totalProcessors,
      },
      {
        Estadística: "Equipos que cumplen requisitos",
        Valor: stats.meetingRequirements,
        Porcentaje: `${stats.complianceRate.toFixed(2)}%`,
      },
      {
        Estadística: "Equipos que NO cumplen requisitos",
        Valor: stats.notMeetingRequirements,
        Porcentaje: `${(100 - stats.complianceRate).toFixed(2)}%`,
      },
    ];

    // Agregar distribución por marca
    Object.entries(stats.brandDistribution).forEach(([brand, count]) => {
      reportData.push({
        Estadística: `Marca: ${brand}`,
        Valor: count,
        Porcentaje: `${((count / stats.totalProcessors) * 100).toFixed(1)}%`,
      });
    });

    // Agregar principales motivos de incumplimiento
    Object.entries(stats.failureReasons)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([reason, count]) => {
        reportData.push({
          Estadística: `Motivo: ${reason}`,
          Valor: count,
          Porcentaje: `${((count / stats.notMeetingRequirements) * 100).toFixed(
            1
          )}%`,
        });
      });

    exportToExcel(reportData, "Estadisticas_Hardware.xlsx");
  };

  // Función para manejar errores y generar reportes PDF
  const handleExportToPDF = () => {
    try {
      if (!normalizedData) {
        console.error("No hay datos para exportar");
        return;
      }
      exportToPDF(normalizedData, stats, "Hardware_Normalizado.pdf");
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      // Intentar con método alternativo
      try {
        exportToPDF(normalizedData, "Hardware_Normalizado.pdf");
      } catch (fallbackError) {
        console.error("Error en el método alternativo:", fallbackError);
        alert(
          "No se pudo generar el PDF. Verifique la consola para más detalles."
        );
      }
    }
  };

  // Función para manejar errores y generar informes detallados
  const handleDetailedReport = () => {
    try {
      if (!normalizedData || !stats) {
        console.error("No hay datos suficientes para el informe");
        return;
      }

      // Usar el nuevo formato de parámetros
      exportDetailedReport({ normalizedData, stats }, "Informe_Ejecutivo.pdf");
    } catch (error) {
      console.error("Error al generar informe detallado:", error);

      // Intentar con método alternativo
      try {
        exportDetailedReport(normalizedData, stats, "Informe_Ejecutivo.pdf");
      } catch (fallbackError) {
        console.error("Error en el método alternativo:", fallbackError);
        alert(
          "No se pudo generar el informe. Verifique la consola para más detalles."
        );
      }
    }
  };

  return (
    <>
      <div
        className={`mb-8 ${
          isDarkMode ? "bg-dark-bg-secondary" : "bg-white"
        } p-6 rounded-lg shadow-md`}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Info className="mr-2 text-blue-600 dark:text-blue-400" size={22} />
          Resumen del análisis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`${
              isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
            } p-4 rounded-lg`}
          >
            <p
              className={`text-sm ${
                isDarkMode ? "text-blue-300" : "text-blue-700"
              } mb-1`}
            >
              Total de equipos
            </p>
            <p className="text-2xl font-bold">{stats.totalProcessors}</p>
          </div>

          <div
            className={`${
              isDarkMode ? "bg-green-900" : "bg-green-50"
            } p-4 rounded-lg`}
          >
            <p
              className={`text-sm ${
                isDarkMode ? "text-green-300" : "text-green-700"
              } mb-1`}
            >
              Cumplen requisitos
            </p>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-green-200" : "text-green-800"
              }`}
            >
              {stats.meetingRequirements}
              <span className="text-sm font-normal ml-2">
                ({stats.complianceRate.toFixed(2)}%)
              </span>
            </p>
          </div>

          <div
            className={`${
              isDarkMode ? "bg-red-900" : "bg-red-50"
            } p-4 rounded-lg`}
          >
            <p
              className={`text-sm ${
                isDarkMode ? "text-red-300" : "text-red-700"
              } mb-1`}
            >
              No cumplen requisitos
            </p>
            <p
              className={`text-2xl font-bold ${
                isDarkMode ? "text-red-200" : "text-red-800"
              }`}
            >
              {stats.notMeetingRequirements}
              <span className="text-sm font-normal ml-2">
                ({(100 - stats.complianceRate).toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Distribución por marca</h3>
            <div
              className={`${
                isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              {Object.entries(stats.brandDistribution).map(([brand, count]) => (
                <div
                  key={brand}
                  className={`flex justify-between py-1 border-b ${
                    isDarkMode ? "border-dark-border" : "border-gray-200"
                  } last:border-0`}
                >
                  <span className="font-medium">{brand}</span>
                  <span>
                    {count} (
                    {((count / stats.totalProcessors) * 100).toFixed(1)}
                    %)
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Principales motivos de incumplimiento
            </h3>
            <div
              className={`${
                isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
              } p-4 rounded-lg max-h-60 overflow-y-auto`}
            >
              {Object.entries(stats.failureReasons)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([reason, count]) => (
                  <div
                    key={reason}
                    className={`flex justify-between py-1 border-b ${
                      isDarkMode ? "border-dark-border" : "border-gray-200"
                    } last:border-0`}
                  >
                    <span className="text-sm">{reason}</span>
                    <span className="text-sm font-medium">
                      {count} (
                      {((count / stats.notMeetingRequirements) * 100).toFixed(
                        1
                      )}
                      %)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Estadísticas de RAM */}
        {stats.ram && stats.ram.total > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">
              Estadísticas de Memoria RAM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Equipos con RAM analizada
                </p>
                <p className="text-2xl font-bold">{stats.ram.total}</p>
              </div>

              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Promedio de RAM
                </p>
                <p className="text-2xl font-bold">
                  {stats.ram.avg.toFixed(1)} GB
                </p>
              </div>

              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Cantidad más común
                </p>
                <p className="text-2xl font-bold">
                  {Object.entries(stats.ram.distribution).sort(
                    (a, b) => b[1] - a[1]
                  )[0]?.[0] || "N/A"}{" "}
                  GB
                </p>
              </div>
            </div>

            <div
              className={`${
                isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
              } p-4 rounded-lg`}
            >
              <h4 className="font-medium mb-2">Distribución por capacidad</h4>
              {Object.entries(stats.ram.distribution)
                .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
                .map(([size, count]) => (
                  <div
                    key={`ram-${size}`}
                    className={`flex justify-between py-1 border-b ${
                      isDarkMode ? "border-dark-border" : "border-gray-200"
                    } last:border-0`}
                  >
                    <span className="font-medium">{size} GB</span>
                    <span>
                      {count} ({((count / stats.ram.total) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Estadísticas de Almacenamiento */}
        {stats.storage && stats.storage.total > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">
              Estadísticas de Almacenamiento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Equipos con almacenamiento analizado
                </p>
                <p className="text-2xl font-bold">{stats.storage.total}</p>
              </div>

              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Promedio de capacidad
                </p>
                <p className="text-2xl font-bold">
                  {stats.storage.avgCapacity >= 1000
                    ? `${(stats.storage.avgCapacity / 1000).toFixed(1)} TB`
                    : `${stats.storage.avgCapacity.toFixed(0)} GB`}
                </p>
              </div>

              <div
                className={`${
                  isDarkMode ? "bg-dark-bg-tertiary" : "bg-blue-50"
                } p-4 rounded-lg`}
              >
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-blue-300" : "text-blue-700"
                  } mb-1`}
                >
                  Tipo más común
                </p>
                <p className="text-2xl font-bold">
                  {Object.entries(stats.storage.byType).sort(
                    (a, b) => b[1] - a[1]
                  )[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Distribución por tipo</h4>
                <div
                  className={`${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  } p-4 rounded-lg`}
                >
                  {Object.entries(stats.storage.byType).map(([type, count]) => (
                    <div
                      key={`storage-type-${type}`}
                      className={`flex justify-between py-1 border-b ${
                        isDarkMode ? "border-dark-border" : "border-gray-200"
                      } last:border-0`}
                    >
                      <span className="font-medium">{type}</span>
                      <span>
                        {count} (
                        {((count / stats.storage.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Principales capacidades</h4>
                <div
                  className={`${
                    isDarkMode ? "bg-dark-bg-tertiary" : "bg-gray-50"
                  } p-4 rounded-lg`}
                >
                  {Object.entries(stats.storage.byCapacity)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([capacity, count]) => (
                      <div
                        key={`storage-cap-${capacity}`}
                        className={`flex justify-between py-1 border-b ${
                          isDarkMode ? "border-dark-border" : "border-gray-200"
                        } last:border-0`}
                      >
                        <span className="font-medium">
                          {capacity >= 1000
                            ? `${capacity / 1000} TB`
                            : `${capacity} GB`}
                        </span>
                        <span>
                          {count} (
                          {((count / stats.storage.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={downloadNormalizedExcel}
            className={`inline-flex items-center px-4 py-2 ${
              isDarkMode
                ? "bg-green-700 hover:bg-green-800"
                : "bg-green-600 hover:bg-green-700"
            } text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors`}
          >
            <FileDown className="mr-2" size={18} />
            Descargar Excel Normalizado
          </button>

          <button
            onClick={downloadStatsReport}
            className={`inline-flex items-center px-4 py-2 ${
              isDarkMode
                ? "bg-blue-700 hover:bg-blue-800"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors`}
          >
            <Download className="mr-2" size={18} />
            Descargar Reporte de Estadísticas
          </button>

          <button
            onClick={handleExportToPDF}
            className={`inline-flex items-center px-4 py-2 ${
              isDarkMode
                ? "bg-purple-700 hover:bg-purple-800"
                : "bg-purple-600 hover:bg-purple-700"
            } text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors`}
          >
            <File className="mr-2" size={18} />
            Exportar PDF Básico
          </button>

          <button
            onClick={handleDetailedReport}
            className={`inline-flex items-center px-4 py-2 ${
              isDarkMode
                ? "bg-indigo-700 hover:bg-indigo-800"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors`}
          >
            <FileText className="mr-2" size={18} />
            Informe Ejecutivo PDF
          </button>
        </div>
      </div>

      {/* Gráficos de estadísticas */}
      <StatsCharts stats={stats} normalizedData={normalizedData} />
    </>
  );
};

export default StatsDisplay;
