// utils/excelProcessor.js
import * as XLSX from "xlsx";
import { normalizeProcessor } from "./processorNormalizer";
import {
  normalizeRAM,
  validateRAM,
  normalizeStorage,
  validateStorage,
} from "./hardwareNormalizer";

/**
 * Procesa un archivo Excel con información de hardware
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

    // Buscar columnas para procesador, RAM y almacenamiento
    const findColumns = (row) => {
      // Buscar columna procesador
      const processorKey = Object.keys(row).find((key) => {
        if (!key || typeof key !== "string") return false;
        const lowerKey = key.toLowerCase();
        return [
          "procesador",
          "processor",
          "cpu",
          "micro",
          "microprocesador",
        ].some((name) => lowerKey.includes(name));
      });

      // Buscar columna RAM
      const ramKey = Object.keys(row).find((key) => {
        if (!key || typeof key !== "string") return false;
        const lowerKey = key.toLowerCase();
        return ["ram", "memoria", "memory"].some((name) =>
          lowerKey.includes(name)
        );
      });

      // Buscar columna almacenamiento
      const storageKey = Object.keys(row).find((key) => {
        if (!key || typeof key !== "string") return false;
        const lowerKey = key.toLowerCase();
        return [
          "disco",
          "disk",
          "hdd",
          "ssd",
          "storage",
          "almacenamiento",
        ].some((name) => lowerKey.includes(name));
      });

      return { processorKey, ramKey, storageKey };
    };

    // Determinar columnas basadas en la primera fila
    const { processorKey, ramKey, storageKey } = findColumns(jsonData[0]);

    if (!processorKey) {
      throw new Error(
        "No se pudo identificar una columna de procesador en el archivo. " +
          "Asegúrese de que exista una columna con un nombre que contenga 'procesador', 'processor' o 'cpu'."
      );
    }

    // Normalizar los datos con manejo de errores y progreso
    const normalizedData = jsonData.map((row) => {
      let result = { ...row };
      let processorResult = {
        meetsRequirements: false,
        reason: "No se procesó",
      };
      let ramResult = { meetsRequirements: true, reason: "" }; // Por defecto true si no hay columna
      let storageResult = { meetsRequirements: true, reason: "" }; // Por defecto true si no hay columna

      // Procesar CPU
      if (processorKey && row[processorKey]) {
        try {
          const normalizedProcessor = normalizeProcessor(
            row[processorKey],
            rules
          );
          processorResult = {
            normalized: normalizedProcessor.normalized,
            brand: normalizedProcessor.brand,
            model: normalizedProcessor.model,
            generation: normalizedProcessor.generation || "N/A",
            speed: normalizedProcessor.speed || "N/A",
            meetsRequirements: normalizedProcessor.meetsRequirements,
            reason: normalizedProcessor.reason || "",
          };

          // Añadir resultados al objeto
          result = {
            ...result,
            "Procesador Normalizado": normalizedProcessor.normalized,
            "Marca Procesador": normalizedProcessor.brand,
            "Modelo Procesador": normalizedProcessor.model,
            Generación: normalizedProcessor.generation || "N/A",
            Velocidad: normalizedProcessor.speed || "N/A",
            "Cumple Requisitos Procesador":
              normalizedProcessor.meetsRequirements ? "Sí" : "No",
            "Motivo Incumplimiento Procesador":
              normalizedProcessor.meetsRequirements
                ? ""
                : normalizedProcessor.reason,
          };
        } catch (error) {
          console.error(
            `Error normalizando procesador: ${row[processorKey]}`,
            error
          );
          processorResult = {
            meetsRequirements: false,
            reason: "Error en procesamiento",
          };

          result = {
            ...row,
            "Procesador Normalizado": "Error: No se pudo procesar",
            "Marca Procesador": "Desconocido",
            "Modelo Procesador": "Desconocido",
            Generación: "N/A",
            Velocidad: "N/A",
            "Cumple Requisitos Procesador": "No",
            "Motivo Incumplimiento Procesador": "Error en procesamiento",
          };
        }
      }

      // Procesar RAM si existe columna
      if (ramKey && row[ramKey]) {
        try {
          const normalizedRAM = normalizeRAM(row[ramKey]);
          const ramValidation = validateRAM(normalizedRAM, rules);
          ramResult = {
            ...normalizedRAM,
            meetsRequirements: ramValidation.meetsRequirements,
            reason: ramValidation.reason || "",
          };

          // Añadir resultados al objeto
          result = {
            ...result,
            "RAM Normalizada": normalizedRAM.normalized,
            "Capacidad RAM": `${normalizedRAM.capacityGB} GB`,
            "Tipo RAM": normalizedRAM.type,
            "Cumple Requisitos RAM": ramValidation.meetsRequirements
              ? "Sí"
              : "No",
            "Motivo Incumplimiento RAM": ramValidation.meetsRequirements
              ? ""
              : ramValidation.reason,
          };
        } catch (error) {
          console.error(`Error normalizando RAM: ${row[ramKey]}`, error);
          ramResult = {
            meetsRequirements: false,
            reason: "Error en procesamiento",
          };

          result = {
            ...result,
            "RAM Normalizada": "Error: No se pudo procesar",
            "Capacidad RAM": "Desconocida",
            "Tipo RAM": "Desconocido",
            "Cumple Requisitos RAM": "No",
            "Motivo Incumplimiento RAM": "Error en procesamiento",
          };
        }
      }

      // Procesar almacenamiento si existe columna
      if (storageKey && row[storageKey]) {
        try {
          const normalizedStorage = normalizeStorage(row[storageKey]);
          const storageValidation = validateStorage(normalizedStorage, rules);
          storageResult = {
            ...normalizedStorage,
            meetsRequirements: storageValidation.meetsRequirements,
            reason: storageValidation.reason || "",
          };

          // Añadir resultados al objeto
          result = {
            ...result,
            "Almacenamiento Normalizado": normalizedStorage.normalized,
            "Capacidad Almacenamiento": `${normalizedStorage.displayCapacity} ${normalizedStorage.displayUnit}`,
            "Tipo Almacenamiento": normalizedStorage.type,
            "Cumple Requisitos Almacenamiento":
              storageValidation.meetsRequirements ? "Sí" : "No",
            "Motivo Incumplimiento Almacenamiento":
              storageValidation.meetsRequirements
                ? ""
                : storageValidation.reason,
          };
        } catch (error) {
          console.error(
            `Error normalizando almacenamiento: ${row[storageKey]}`,
            error
          );
          storageResult = {
            meetsRequirements: false,
            reason: "Error en procesamiento",
          };

          result = {
            ...result,
            "Almacenamiento Normalizado": "Error: No se pudo procesar",
            "Capacidad Almacenamiento": "Desconocida",
            "Tipo Almacenamiento": "Desconocido",
            "Cumple Requisitos Almacenamiento": "No",
            "Motivo Incumplimiento Almacenamiento": "Error en procesamiento",
          };
        }
      }

      // Determinar cumplimiento global basado en reglas
      const overallCompliance =
        processorResult.meetsRequirements &&
        ramResult.meetsRequirements &&
        storageResult.meetsRequirements;

      // Determinar motivo de incumplimiento global
      let overallReason = "";
      if (!overallCompliance) {
        if (!processorResult.meetsRequirements) {
          overallReason =
            processorResult.reason || "Procesador no cumple requisitos";
        } else if (!ramResult.meetsRequirements) {
          overallReason = ramResult.reason || "RAM no cumple requisitos";
        } else if (!storageResult.meetsRequirements) {
          overallReason =
            storageResult.reason || "Almacenamiento no cumple requisitos";
        }
      }

      // Actualizar campos generales
      result = {
        ...result,
        "Cumple Requisitos": overallCompliance ? "Sí" : "No",
        "Motivo Incumplimiento": overallReason,
      };

      return result;
    });

    // Generar estadísticas
    const totalRows = normalizedData.length;
    const meetingReqs = normalizedData.filter(
      (row) => row["Cumple Requisitos"] === "Sí"
    ).length;
    const notMeetingReqs = totalRows - meetingReqs;

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

    // Estadísticas de RAM
    const ramStats = {
      total: 0,
      meetingRequirements: 0,
      notMeetingRequirements: 0,
      distribution: {},
      avg: 0,
    };

    // Estadísticas de almacenamiento
    const storageStats = {
      total: 0,
      meetingRequirements: 0,
      notMeetingRequirements: 0,
      byType: {},
      byCapacity: {},
      avgCapacity: 0,
    };

    // Calcular estadísticas para RAM
    let totalRAM = 0;
    normalizedData.forEach((row) => {
      if (row["Capacidad RAM"]) {
        ramStats.total++;
        const capacityMatch = row["Capacidad RAM"].match(/(\d+(?:\.\d+)?)/);
        if (capacityMatch) {
          const capacity = parseFloat(capacityMatch[1]);
          totalRAM += capacity;

          // Distribución por tamaños
          if (!ramStats.distribution[capacity]) {
            ramStats.distribution[capacity] = 0;
          }
          ramStats.distribution[capacity]++;
        }

        // Verificar cumplimiento
        if (row["Cumple Requisitos RAM"] === "Sí") {
          ramStats.meetingRequirements++;
        } else {
          ramStats.notMeetingRequirements++;
        }
      }
    });
    if (ramStats.total > 0) {
      ramStats.avg = totalRAM / ramStats.total;
    }

    // Calcular estadísticas para almacenamiento
    let totalStorage = 0;
    normalizedData.forEach((row) => {
      if (row["Capacidad Almacenamiento"]) {
        storageStats.total++;

        // Extraer capacidad y convertir a GB para cálculos
        const capacityMatch = row["Capacidad Almacenamiento"].match(
          /(\d+(?:\.\d+)?)\s*(TB|GB)/i
        );
        if (capacityMatch) {
          const value = parseFloat(capacityMatch[1]);
          const unit = capacityMatch[2].toUpperCase();
          const capacityGB = unit === "TB" ? value * 1000 : value;
          totalStorage += capacityGB;

          // Agregar a distribución por capacidad
          if (!storageStats.byCapacity[capacityGB]) {
            storageStats.byCapacity[capacityGB] = 0;
          }
          storageStats.byCapacity[capacityGB]++;
        }

        // Distribución por tipo
        const type = row["Tipo Almacenamiento"] || "Desconocido";
        if (!storageStats.byType[type]) {
          storageStats.byType[type] = 0;
        }
        storageStats.byType[type]++;

        // Verificar cumplimiento
        if (row["Cumple Requisitos Almacenamiento"] === "Sí") {
          storageStats.meetingRequirements++;
        } else {
          storageStats.notMeetingRequirements++;
        }
      }
    });
    if (storageStats.total > 0) {
      storageStats.avgCapacity = totalStorage / storageStats.total;
    }

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
      ram: ramStats,
      storage: storageStats,
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
export const exportToExcel = (data, filename = "Hardware_Normalizado.xlsx") => {
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
    { wch: 15 }, // RAM
    { wch: 15 }, // Almacenamiento
  ];

  // Aplicar anchos de columna
  worksheet["!cols"] = columnsWidths;

  // Crear libro y agregar hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos Normalizados");

  // Guardar archivo
  XLSX.writeFile(workbook, filename);
};
