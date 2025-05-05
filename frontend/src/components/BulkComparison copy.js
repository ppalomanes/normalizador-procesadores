// components/BulkComparison.js
import React, { useState } from "react";
import {
  Upload,
  AlertCircle,
  FilePlus,
  FileCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { processExcelFile } from "../utils/excelProcessor";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

const BulkComparison = () => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Colores para gráficos
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#4CAF50",
    "#e91e63",
  ];

  /**
   * Maneja la carga de un nuevo archivo
   */
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];

    if (!uploadedFile) return;

    // Verificar que sea un archivo Excel
    if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
      setError("Por favor suba archivos Excel (.xlsx o .xls)");
      return;
    }

    // Agregar el archivo a la lista
    setFiles((prevFiles) => [
      ...prevFiles,
      {
        file: uploadedFile,
        id: Date.now(),
        name: uploadedFile.name,
        status: "pending",
      },
    ]);

    // Resetear errores
    setError(null);
  };

  /**
   * Procesa todos los archivos
   */
  const processAllFiles = async () => {
    if (files.length === 0) {
      setError("Por favor agregue archivos para comparar");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const newResults = [];
    const updatedFiles = [...files];

    for (let i = 0; i < files.length; i++) {
      const currentFile = files[i];

      // Actualizar estado para mostrar progreso
      updatedFiles[i] = { ...currentFile, status: "processing" };
      setFiles(updatedFiles);

      try {
        // Leer el archivo
        const fileReader = new FileReader();

        // Usar promesa para manejar la lectura asíncrona
        const fileContent = await new Promise((resolve, reject) => {
          fileReader.onload = (e) => resolve(e.target.result);
          fileReader.onerror = () =>
            reject(new Error("Error al leer el archivo"));
          fileReader.readAsArrayBuffer(currentFile.file);
        });

        // Procesar el archivo
        const { normalizedData, stats } = await processExcelFile(fileContent);

        // Agregar a resultados
        newResults.push({
          fileName: currentFile.name,
          stats,
          timestamp: new Date().toLocaleString(),
        });

        // Actualizar estado del archivo a completado
        updatedFiles[i] = { ...currentFile, status: "completed" };
        setFiles(updatedFiles);
      } catch (error) {
        // Actualizar estado del archivo a error
        updatedFiles[i] = {
          ...currentFile,
          status: "error",
          errorMessage: error.message,
        };
        setFiles(updatedFiles);
        setError(`Error procesando ${currentFile.name}: ${error.message}`);
      }
    }

    // Actualizar resultados
    setResults(newResults);
    setIsProcessing(false);
  };

  /**
   * Elimina un archivo de la lista
   */
  const removeFile = (id) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  };

  /**
   * Prepara datos para el gráfico comparativo de cumplimiento
   */
  const getComplianceChartData = () => {
    if (results.length === 0) return [];

    return results.map((result) => ({
      name:
        result.fileName.length > 15
          ? result.fileName.substring(0, 15) + "..."
          : result.fileName,
      fullName: result.fileName,
      cumplen: result.stats.meetingRequirements,
      noCumplen: result.stats.notMeetingRequirements,
      total: result.stats.totalProcessors,
      porcentaje: result.stats.complianceRate,
    }));
  };

  /**
   * Prepara datos para el gráfico de marcas
   */
  const getBrandChartData = () => {
    if (results.length === 0) return [];

    // Combinar todas las marcas de todos los archivos
    const allBrands = new Set();
    results.forEach((result) => {
      Object.keys(result.stats.brandDistribution).forEach((brand) => {
        allBrands.add(brand);
      });
    });

    // Crear estructura de datos para el gráfico
    return Array.from(allBrands).map((brand) => {
      const dataPoint = { brand };

      results.forEach((result) => {
        const count = result.stats.brandDistribution[brand] || 0;
        const shortName =
          result.fileName.length > 10
            ? result.fileName.substring(0, 10) + "..."
            : result.fileName;

        dataPoint[shortName] = count;
      });

      return dataPoint;
    });
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <FilePlus className="mr-2 text-indigo-600" size={22} />
          Comparación de múltiples archivos
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <>
          <p className="text-gray-600 mb-4">
            Cargue varios archivos Excel para comparar sus estadísticas de
            procesadores en un solo panel.
          </p>

          {/* Área de carga de archivos */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <div className="border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-lg p-4 text-center hover:bg-indigo-100 transition-colors cursor-pointer h-full">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bulk-file-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="bulk-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center h-full"
                >
                  <div className="mb-3 bg-indigo-200 p-3 rounded-full text-indigo-600">
                    <Upload size={22} />
                  </div>
                  <p className="font-medium text-indigo-700 mb-1">
                    Agregar archivo
                  </p>
                  <p className="text-xs text-indigo-600">
                    Haga clic para seleccionar (.xlsx, .xls)
                  </p>
                </label>
              </div>
            </div>

            <div className="col-span-2">
              <div
                className="border rounded-lg h-full bg-gray-50 p-2 overflow-y-auto"
                style={{ maxHeight: "150px" }}
              >
                {files.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    No hay archivos seleccionados
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {files.map((file) => (
                      <li
                        key={file.id}
                        className="py-2 px-2 flex justify-between items-center"
                      >
                        <div className="flex items-center">
                          {file.status === "processing" ? (
                            <Loader2
                              className="mr-2 text-blue-500 animate-spin"
                              size={18}
                            />
                          ) : file.status === "completed" ? (
                            <FileCheck
                              className="mr-2 text-green-500"
                              size={18}
                            />
                          ) : file.status === "error" ? (
                            <AlertCircle
                              className="mr-2 text-red-500"
                              size={18}
                            />
                          ) : (
                            <FilePlus
                              className="mr-2 text-gray-400"
                              size={18}
                            />
                          )}
                          <span className="text-sm truncate max-w-xs">
                            {file.name}
                          </span>
                        </div>
                        {!isProcessing && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={processAllFiles}
              disabled={isProcessing || files.length === 0}
              className={`inline-flex items-center px-4 py-2 rounded-lg ${
                isProcessing || files.length === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              } transition-colors`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Procesando...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2" size={18} />
                  Procesar archivos
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
              <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
              <p>{error}</p>
            </div>
          )}

          {/* Resultados de la comparación */}
          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Resultados comparativos
              </h3>

              {/* Tabla resumen */}
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Archivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cumplen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No Cumplen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Cumplimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha/Hora
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.stats.totalProcessors}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {result.stats.meetingRequirements}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {result.stats.notMeetingRequirements}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{
                                  width: `${result.stats.complianceRate}%`,
                                }}
                              ></div>
                            </div>
                            <span className="ml-2">
                              {result.stats.complianceRate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Gráficos comparativos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                {/* Gráfico de cumplimiento */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4 text-center">
                    Comparativa de cumplimiento
                  </h4>
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getComplianceChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "cumplen" ? "Cumplen" : "No cumplen",
                          ]}
                          labelFormatter={(label, items) => {
                            const item = items[0]?.payload;
                            return item ? item.fullName : label;
                          }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar
                          name="Cumplen"
                          dataKey="cumplen"
                          stackId="a"
                          fill="#4CAF50"
                        />
                        <Bar
                          name="No cumplen"
                          dataKey="noCumplen"
                          stackId="a"
                          fill="#FF5252"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Gráfico comparativo por marca */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-medium mb-4 text-center">
                    Comparativa por marca
                  </h4>
                  <div style={{ height: "300px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getBrandChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <XAxis
                          dataKey="brand"
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        {results.map((result, index) => {
                          const shortName =
                            result.fileName.length > 10
                              ? result.fileName.substring(0, 10) + "..."
                              : result.fileName;

                          return (
                            <Bar
                              key={index}
                              name={shortName}
                              dataKey={shortName}
                              fill={COLORS[index % COLORS.length]}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Conclusiones */}
              <div className="bg-indigo-50 p-4 rounded-lg mt-4">
                <h4 className="text-md font-medium mb-2 text-indigo-700">
                  Conclusiones de la comparación
                </h4>
                <ul className="list-disc list-inside text-sm text-indigo-900">
                  {results.length > 1 && (
                    <>
                      <li>
                        El archivo con mayor tasa de cumplimiento es{" "}
                        <span className="font-medium">
                          {
                            results.reduce(
                              (max, item) =>
                                item.stats.complianceRate >
                                max.stats.complianceRate
                                  ? item
                                  : max,
                              results[0]
                            ).fileName
                          }{" "}
                          (
                          {results
                            .reduce(
                              (max, item) =>
                                item.stats.complianceRate >
                                max.stats.complianceRate
                                  ? item
                                  : max,
                              results[0]
                            )
                            .stats.complianceRate.toFixed(1)}
                          %)
                        </span>
                      </li>
                      <li>
                        El archivo con menor tasa de cumplimiento es{" "}
                        <span className="font-medium">
                          {
                            results.reduce(
                              (min, item) =>
                                item.stats.complianceRate <
                                min.stats.complianceRate
                                  ? item
                                  : min,
                              results[0]
                            ).fileName
                          }{" "}
                          (
                          {results
                            .reduce(
                              (min, item) =>
                                item.stats.complianceRate <
                                min.stats.complianceRate
                                  ? item
                                  : min,
                              results[0]
                            )
                            .stats.complianceRate.toFixed(1)}
                          %)
                        </span>
                      </li>
                      <li>
                        La diferencia entre el mejor y peor archivo es{" "}
                        <span className="font-medium">
                          {(
                            results.reduce(
                              (max, item) =>
                                item.stats.complianceRate >
                                max.stats.complianceRate
                                  ? item
                                  : max,
                              results[0]
                            ).stats.complianceRate -
                            results.reduce(
                              (min, item) =>
                                item.stats.complianceRate <
                                min.stats.complianceRate
                                  ? item
                                  : min,
                              results[0]
                            ).stats.complianceRate
                          ).toFixed(1)}
                          %
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BulkComparison;
