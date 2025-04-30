// utils/excelProcessor.js
import * as XLSX from "xlsx";
import { normalizeProcessor } from "./processorNormalizer";

/**
 * Procesa un archivo Excel con información de procesadores
 * @param {ArrayBuffer} excelBuffer - Buffer del archivo Excel
 * @param {Object} rules - Reglas personalizadas (opcional)
 * @returns {Object} Objecto con datos normalizados y estadísticas
 */
export const processExcelFile = async (excelBuffer, rules = null) => {
  try {
    // Cargar reglas personalizadas si existen
    if (!rules) {
      try {
        const storedRules = localStorage.getItem("validationRules");
        if (storedRules) {
          rules = JSON.parse(storedRules);
        }
      } catch (error) {
        console.error("Error cargando reglas de validación:", error);
      }
    }

    // Leer el excel con opciones completas
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

    if (!jsonData || jsonData.length === 0) {
      throw new Error(
        "El archivo no contiene datos o tiene un formato incorrecto."
      );
    }

    // Buscar la columna del procesador
    const findProcessorColumn = (row) => {
      const possibleNames = [
        "procesador",
        "processor",
        "cpu",
        "micro",
        "microprocesador",
      ];

      // Buscar columnas que contengan palabras clave
      const processorKey = Object.keys(row).find((key) => {
        if (!key || typeof key !== "string") return false;
        const lowerKey = key.toLowerCase();
        return possibleNames.some((name) => lowerKey.includes(name));
      });

      return processorKey;
    };

    // Determinar la columna de procesador basado en la primera fila
    const processorColumn = findProcessorColumn(jsonData[0]);

    if (!processorColumn) {
      throw new Error(
        "No se pudo identificar una columna de procesador en el archivo. " +
          "Asegúrese de que exista una columna con un nombre que contenga 'procesador', 'processor' o 'cpu'."
      );
    }

    // Normalizar los procesadores con manejo de errores y progreso
    const normalizedData = jsonData.map((row) => {
      if (processorColumn && row[processorColumn]) {
        try {
          const normalizedProcessor = normalizeProcessor(
            row[processorColumn],
            rules
          );

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
        } catch (error) {
          console.error(
            `Error normalizando procesador: ${row[processorColumn]}`,
            error
          );

          // En caso de error, mantener la fila original pero marcarla como no procesada
          return {
            ...row,
            "Procesador Normalizado": "Error: No se pudo procesar",
            "Marca Procesador": "Desconocido",
            "Modelo Procesador": "Desconocido",
            Generación: "N/A",
            Velocidad: "N/A",
            "Cumple Requisitos": "No",
            "Motivo Incumplimiento": "Error en procesamiento",
          };
        }
      }

      return {
        ...row,
        "Procesador Normalizado": "Información no disponible",
        "Marca Procesador": "Desconocido",
        "Modelo Procesador": "Desconocido",
        Generación: "N/A",
        Velocidad: "N/A",
        "Cumple Requisitos": "No",
        "Motivo Incumplimiento": "Datos de procesador no válidos",
      };
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

    // Contar por generación
    const generationCount = {};
    normalizedData.forEach((row) => {
      const generation = row["Generación"];
      if (generation && generation !== "N/A") {
        generationCount[generation] = (generationCount[generation] || 0) + 1;
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

    // Estadísticas adicionales por combinación marca/modelo
    const brandModelCount = {};
    normalizedData.forEach((row) => {
      const key = `${row["Marca Procesador"]} ${row["Modelo Procesador"]}`;
      brandModelCount[key] = (brandModelCount[key] || 0) + 1;
    });

    // Preparar estadísticas
    const stats = {
      totalProcessors: totalRows,
      meetingRequirements: meetingReqs,
      notMeetingRequirements: notMeetingReqs,
      complianceRate: totalRows > 0 ? (meetingReqs / totalRows) * 100 : 0,
      brandDistribution: brandCount,
      modelDistribution: modelCount,
      generationDistribution: generationCount,
      brandModelDistribution: brandModelCount,
      failureReasons: failureReasons,
    };

    return { normalizedData, stats };
  } catch (error) {
    console.error("Error procesando el archivo:", error);
    throw new Error(`Error al procesar el archivo Excel: ${error.message}`);
  }
};

/**
 * Función para exportar los datos a Excel con formato mejorado
 * @param {Array} data - Datos a exportar
 * @param {String} filename - Nombre del archivo
 */
export const exportToExcel = (
  data,
  filename = "Procesadores_Normalizados.xlsx"
) => {
  if (!data || data.length === 0) return;

  // Crear hoja de trabajo
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Aplicar estilos a las celdas
  const columnsWidths = [
    { wch: 20 }, // Hostname
    { wch: 40 }, // Procesador original
    { wch: 40 }, // Procesador Normalizado
    { wch: 15 }, // Marca
    { wch: 15 }, // Modelo
    { wch: 15 }, // Generación
    { wch: 15 }, // Velocidad
    { wch: 15 }, // Cumple Requisitos
    { wch: 40 }, // Motivo Incumplimiento
  ];

  // Aplicar anchos de columna
  worksheet["!cols"] = columnsWidths;

  // Crear libro y agregar hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Normalizados");

  // Guardar archivo
  XLSX.writeFile(workbook, filename);
};
