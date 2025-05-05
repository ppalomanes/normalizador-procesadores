import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  Table,
  AlertCircle,
  Check,
  FileDown,
  Upload,
  Info,
  Loader2,
} from "lucide-react";

export default function NormalizadorProcesadores() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [normalizedData, setNormalizedData] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("cumple");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Función para normalizar procesadores
  const normalizeProcessor = (processor) => {
    if (!processor || typeof processor !== "string") {
      return {
        original: processor || "",
        brand: "Desconocido",
        model: "Desconocido",
        generation: null,
        speed: null,
        normalized: "Desconocido",
        meetsRequirements: false,
        reason: "Datos de procesador no válidos",
      };
    }

    // Eliminar caracteres y palabras innecesarias
    let cleaned = processor.replace(/\[.*?\]/g, "").trim();

    // Variables para almacenar información extraída
    let brand = null;
    let model = null;
    let generation = null;
    let speed = null;
    let modelNumber = null;

    // Extraer marca
    if (cleaned.includes("Intel")) {
      brand = "Intel";
    } else if (cleaned.includes("AMD")) {
      brand = "AMD";
    } else {
      brand = "Otro";
    }

    // Extraer modelo
    if (brand === "Intel") {
      // Patrones para Intel Core
      if (cleaned.includes("Core")) {
        if (cleaned.includes("i3")) {
          model = "Core i3";
        } else if (cleaned.includes("i5")) {
          model = "Core i5";
        } else if (cleaned.includes("i7")) {
          model = "Core i7";
        } else if (cleaned.includes("i9")) {
          model = "Core i9";
        } else {
          model = "Core (otro)";
        }

        // Intentar extraer número de modelo
        const modelMatch = cleaned.match(/i[3579]-(\d{4})/);
        if (modelMatch) {
          modelNumber = modelMatch[1];
          // Extraer generación del número de modelo
          const genNumber = modelNumber.charAt(0);
          generation = `${genNumber}th Gen`;
        }
      } else if (cleaned.includes("Celeron")) {
        model = "Celeron";
      } else if (cleaned.includes("Pentium")) {
        model = "Pentium";
      } else if (cleaned.includes("Atom")) {
        model = "Atom";
      } else {
        model = "Otro Intel";
      }
    } else if (brand === "AMD") {
      if (cleaned.includes("Ryzen 3")) {
        model = "Ryzen 3";
      } else if (cleaned.includes("Ryzen 5")) {
        model = "Ryzen 5";

        // Intentar extraer modelo específico para Ryzen 5
        const ryzenModelMatch = cleaned.match(/Ryzen 5 (\d{4})/);
        if (ryzenModelMatch) {
          modelNumber = ryzenModelMatch[1];
        }
      } else if (cleaned.includes("Ryzen 7")) {
        model = "Ryzen 7";
      } else if (cleaned.includes("Ryzen 9")) {
        model = "Ryzen 9";
      } else if (cleaned.includes("Athlon")) {
        model = "Athlon";
      } else if (cleaned.includes("A4")) {
        model = "A4";
      } else if (cleaned.includes("A6")) {
        model = "A6";
      } else if (cleaned.includes("A8")) {
        model = "A8";
      } else if (cleaned.includes("A10")) {
        model = "A10";
      } else if (cleaned.includes("FX")) {
        model = "FX";
      } else if (cleaned.includes("Ryzen")) {
        model = "Ryzen (otro)";
      } else {
        model = "Otro AMD";
      }
    }

    // Buscar generación explícitamente mencionada
    if (!generation) {
      if (cleaned.includes("13th Gen") || cleaned.includes("13.0th Gen")) {
        generation = "13th Gen";
      } else if (cleaned.includes("12th Gen")) {
        generation = "12th Gen";
      } else if (cleaned.includes("11th Gen")) {
        generation = "11th Gen";
      } else if (cleaned.includes("10th Gen")) {
        generation = "10th Gen";
      } else if (cleaned.includes("8th Gen") || cleaned.includes("8va Gen")) {
        generation = "8th Gen";
      } else if (cleaned.includes("9th Gen")) {
        generation = "9th Gen";
      } else if (cleaned.includes("7th Gen")) {
        generation = "7th Gen";
      } else if (cleaned.includes("6th Gen")) {
        generation = "6th Gen";
      }
    }

    // Extraer velocidad - mejorando la expresión regular para capturar más formatos
    const speedRegex = /(\d+[\.,]\d+)\s*(?:Ghz|GHz|gh|Mhz|G)/i;
    const speedMatch = cleaned.match(speedRegex);
    if (speedMatch) {
      // Normalizar formatos de decimales
      speed = parseFloat(speedMatch[1].replace(",", ".")) + " GHz";
    }

    // Si no encontramos velocidad con el primer regex, probar con otro patrón
    if (!speed) {
      const altSpeedRegex = /@ (\d+[\.,]\d+)/i;
      const altSpeedMatch = cleaned.match(altSpeedRegex);
      if (altSpeedMatch) {
        speed = parseFloat(altSpeedMatch[1].replace(",", ".")) + " GHz";
      }
    }

    // Si aún no encontramos velocidad, buscar números aislados que puedan ser GHz
    if (!speed && model) {
      const numericRegex = /\b(\d+[\.,]\d+)\b/g;
      const numericMatches = [...cleaned.matchAll(numericRegex)];

      // Filtrar para eliminar números que probablemente no sean velocidades
      const possibleSpeeds = numericMatches
        .map((m) => parseFloat(m[1].replace(",", ".")))
        .filter((n) => n >= 1.0 && n <= 5.5); // Rango típico de velocidades de CPU

      if (possibleSpeeds.length > 0) {
        // Tomar el valor más alto como la velocidad probable
        speed = Math.max(...possibleSpeeds) + " GHz";
      }
    }

    // Construir cadena normalizada
    let normalized = `${brand} ${model}`;
    if (modelNumber) {
      normalized += ` ${modelNumber}`;
    }
    if (generation) {
      normalized += ` ${generation}`;
    }
    if (speed) {
      normalized += ` @ ${speed}`;
    }

    // Verificar si cumple con los requisitos
    let meetsRequirements = false;
    let reason = "";

    // Extraer velocidad numérica para comparación
    let speedValue = speed ? parseFloat(speed) : 0;

    // Verificar Intel Core i5
    if (brand === "Intel" && model === "Core i5") {
      let genNumber = 0;

      if (generation) {
        const genMatch = generation.match(/(\d+)/);
        if (genMatch) {
          genNumber = parseInt(genMatch[1]);
        }
      }

      if (genNumber >= 8) {
        if (speedValue >= 3.0) {
          meetsRequirements = true;
        } else {
          reason = `Velocidad insuficiente: ${speedValue} GHz (requiere 3.0 GHz o superior)`;
        }
      } else {
        reason = `Generación insuficiente: ${
          generation || "Desconocida"
        } (requiere 8va gen o superior)`;
      }
    }
    // Verificar AMD Ryzen 5
    else if (brand === "AMD" && model === "Ryzen 5") {
      if (speedValue >= 3.7) {
        meetsRequirements = true;
      } else {
        reason = `Velocidad insuficiente: ${speedValue} GHz (requiere 3.7 GHz o superior)`;
      }
    } else {
      reason = `No cumple requisitos de marca/modelo: ${brand} ${model}`;
    }

    return {
      original: processor,
      brand,
      model,
      modelNumber,
      generation,
      speed,
      speedValue,
      normalized,
      meetsRequirements,
      reason,
    };
  };

  // Función para procesar el archivo Excel
  const processExcelFile = async (excelBuffer) => {
    try {
      // Leer el excel
      const workbook = XLSX.read(excelBuffer, {
        type: "array",
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true,
      });

      // Tomar la primera hoja
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      // Convertir a JSON manteniendo los encabezados
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });

      // Normalizar los procesadores
      const normalizedData = jsonData.map((row) => {
        // Encontrar la columna del procesador
        const processorKey = Object.keys(row).find(
          (key) =>
            key &&
            typeof key === "string" &&
            key.toLowerCase().includes("procesador")
        );

        if (processorKey && row[processorKey]) {
          const normalizedProcessor = normalizeProcessor(row[processorKey]);

          // Añadir columnas con información normalizada
          return {
            ...row,
            "Procesador Normalizado": normalizedProcessor.normalized,
            "Marca Procesador": normalizedProcessor.brand,
            "Modelo Procesador": normalizedProcessor.model,
            Generación: normalizedProcessor.generation || "N/A",
            Velocidad: normalizedProcessor.speed || "N/A",
            "Cumple Requisitos": normalizedProcessor.meetsRequirements
              ? "Sí"
              : "No",
            "Motivo Incumplimiento": normalizedProcessor.meetsRequirements
              ? ""
              : normalizedProcessor.reason,
          };
        }

        return row;
      });

      // Generar estadísticas
      const totalRows = normalizedData.length;
      const meetingReqs = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "Sí"
      ).length;
      const notMeetingReqs = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "No"
      ).length;

      // Contar por marca
      const brandCount = {};
      normalizedData.forEach((row) => {
        const brand = row["Marca Procesador"];
        if (brand) {
          brandCount[brand] = (brandCount[brand] || 0) + 1;
        }
      });

      // Contar por modelo
      const modelCount = {};
      normalizedData.forEach((row) => {
        const model = row["Modelo Procesador"];
        if (model) {
          modelCount[model] = (modelCount[model] || 0) + 1;
        }
      });

      // Contar por motivo de incumplimiento
      const failureReasons = {};
      normalizedData.forEach((row) => {
        const reason = row["Motivo Incumplimiento"];
        if (reason) {
          failureReasons[reason] = (failureReasons[reason] || 0) + 1;
        }
      });

      // Preparar estadísticas
      const stats = {
        totalProcessors: totalRows,
        meetingRequirements: meetingReqs,
        notMeetingRequirements: notMeetingReqs,
        complianceRate: (meetingReqs / totalRows) * 100,
        brandDistribution: brandCount,
        modelDistribution: modelCount,
        failureReasons: failureReasons,
      };

      return { normalizedData, stats };
    } catch (error) {
      console.error("Error procesando el archivo:", error);
      throw new Error(
        "Error al procesar el archivo Excel. Verifique el formato."
      );
    }
  };

  // Manejar la carga del archivo
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    // Verificar que sea un archivo Excel
    if (!uploadedFile.name.match(/\.(xlsx|xls)$/)) {
      setError("Por favor suba un archivo Excel (.xlsx o .xls)");
      return;
    }

    setFile(uploadedFile);
    setError(null);
    setIsProcessing(true);

    try {
      // Leer el archivo como ArrayBuffer
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const { normalizedData, stats } = await processExcelFile(
            e.target.result
          );
          setNormalizedData(normalizedData);
          setStats(stats);
          setIsProcessing(false);
        } catch (error) {
          setError(error.message);
          setIsProcessing(false);
        }
      };

      fileReader.onerror = () => {
        setError("Error al leer el archivo");
        setIsProcessing(false);
      };

      fileReader.readAsArrayBuffer(uploadedFile);
    } catch (error) {
      setError("Error al procesar el archivo: " + error.message);
      setIsProcessing(false);
    }
  };

  // Función para descargar el Excel normalizado
  const downloadNormalizedExcel = () => {
    if (!normalizedData) return;

    // Crear libro y hoja
    const worksheet = XLSX.utils.json_to_sheet(normalizedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Normalizados");

    // Guardar archivo
    XLSX.writeFile(workbook, "Procesadores_Normalizados.xlsx");
  };

  // Función para ordenar datos
  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Datos filtrados y ordenados para la tabla
  const getFilteredSortedData = () => {
    if (!normalizedData) return [];

    // Filtrar por pestaña activa
    let filteredData = normalizedData;
    if (activeTab === "cumple") {
      filteredData = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "Sí"
      );
    } else if (activeTab === "noCumple") {
      filteredData = normalizedData.filter(
        (row) => row["Cumple Requisitos"] === "No"
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filteredData = filteredData.filter((row) => {
        return Object.values(row).some(
          (value) =>
            value &&
            typeof value === "string" &&
            value.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Ordenar datos
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  };

  // Columnas a mostrar en la tabla
  const getTableColumns = () => {
    if (!normalizedData || normalizedData.length === 0) return [];

    // Columnas clave que queremos mostrar en este orden
    const keyColumns = [
      "Hostname",
      "Procesador (marca, modelo y velocidad)",
      "Procesador Normalizado",
      "Marca Procesador",
      "Modelo Procesador",
      "Generación",
      "Velocidad",
      "Cumple Requisitos",
      "Motivo Incumplimiento",
    ];

    // Filtrar columnas que existen en los datos
    return keyColumns.filter((col) => normalizedData[0].hasOwnProperty(col));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Cabecera */}
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold flex items-center">
            <Table className="mr-2" />
            Normalizador de Procesadores para Auditoría
          </h1>
          <p className="text-blue-100 mt-1">
            Validación según requisitos: Intel Core i5 3.0 GHz 8va Gen+ / AMD
            Ryzen 5 3.7 GHz+
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 flex-grow">
        {/* Área de carga de archivos */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Upload className="mr-2 text-blue-600" size={22} />
            Subir archivo Excel
          </h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-2" />
                  <p className="text-gray-700">Procesando archivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-4 bg-blue-100 p-3 rounded-full text-blue-600">
                    <Upload size={24} />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">
                    {file ? file.name : "Haga clic para seleccionar un archivo"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Formatos soportados: .xlsx, .xls
                  </p>
                </div>
              )}
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
              <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={18} />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Estadísticas y resultados */}
        {stats && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Info className="mr-2 text-blue-600" size={22} />
              Resumen del análisis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">Total de equipos</p>
                <p className="text-2xl font-bold">{stats.totalProcessors}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 mb-1">
                  Cumplen requisitos
                </p>
                <p className="text-2xl font-bold">
                  {stats.meetingRequirements}
                  <span className="text-sm font-normal ml-2">
                    ({stats.complianceRate.toFixed(2)}%)
                  </span>
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700 mb-1">
                  No cumplen requisitos
                </p>
                <p className="text-2xl font-bold">
                  {stats.notMeetingRequirements}
                  <span className="text-sm font-normal ml-2">
                    ({(100 - stats.complianceRate).toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Distribución por marca
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {Object.entries(stats.brandDistribution).map(
                    ([brand, count]) => (
                      <div
                        key={brand}
                        className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                      >
                        <span className="font-medium">{brand}</span>
                        <span>
                          {count} (
                          {((count / stats.totalProcessors) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">
                  Principales motivos de incumplimiento
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                  {Object.entries(stats.failureReasons)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([reason, count]) => (
                      <div
                        key={reason}
                        className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                      >
                        <span className="text-sm">{reason}</span>
                        <span className="text-sm font-medium">
                          {count} (
                          {(
                            (count / stats.notMeetingRequirements) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={downloadNormalizedExcel}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <FileDown className="mr-2" size={18} />
                Descargar Excel Normalizado
              </button>
            </div>
          </div>
        )}

        {/* DataTable con resultados */}
        {normalizedData && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Table className="mr-2 text-blue-600" size={22} />
              Datos normalizados
            </h2>

            {/* Controles de tabla */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-4">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("todos")}
                  className={`px-4 py-2 rounded-l-lg border ${
                    activeTab === "todos"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setActiveTab("cumple")}
                  className={`px-4 py-2 border-t border-b ${
                    activeTab === "cumple"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center">
                    <Check size={16} className="mr-1" />
                    Cumplen
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("noCumple")}
                  className={`px-4 py-2 rounded-r-lg border ${
                    activeTab === "noCumple"
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    No cumplen
                  </span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* DataTable */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {getTableColumns().map((column) => (
                      <th
                        key={column}
                        onClick={() => requestSort(column)}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100`}
                      >
                        <div className="flex items-center">
                          {column}
                          {sortConfig.key === column && (
                            <span className="ml-1">
                              {sortConfig.direction === "ascending" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredSortedData()
                    .slice(0, 100)
                    .map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={
                          row["Cumple Requisitos"] === "Sí"
                            ? "hover:bg-green-50"
                            : "hover:bg-red-50"
                        }
                      >
                        {getTableColumns().map((column) => (
                          <td
                            key={`${rowIndex}-${column}`}
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              column === "Cumple Requisitos"
                                ? row[column] === "Sí"
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            {row[column] || ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Paginación simplificada */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando primeras 100 filas de{" "}
                    {getFilteredSortedData().length} resultados
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-100 text-gray-600 py-4 border-t">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>
            Normalizador de Procesadores para Auditoría - Modelo de Validación
            para el Parque Informático
          </p>
        </div>
      </footer>
    </div>
  );
}
