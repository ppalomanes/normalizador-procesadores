// utils/analysisStorage.js

/**
 * Clase para manejar el almacenamiento de análisis previos
 */
export class AnalysisStorage {
  constructor() {
    this.storageKey = "processor_analysis_history";
    this.maxEntries = 10; // Máximo número de análisis almacenados
  }

  /**
   * Guarda un nuevo análisis en el almacenamiento local
   * @param {Object} analysisData - Datos del análisis a guardar
   * @returns {string} ID del análisis guardado
   */
  saveAnalysis(analysisData) {
    try {
      // Generar un ID único para este análisis
      const analysisId = `analysis_${Date.now()}`;

      // Obtener análisis existentes
      const existingAnalyses = this.getAnalysisList();

      // Crear nueva entrada
      const newEntry = {
        id: analysisId,
        timestamp: new Date().toISOString(),
        name: analysisData.name || `Análisis ${new Date().toLocaleString()}`,
        summary: {
          totalProcessors: analysisData.stats.totalProcessors,
          meetingRequirements: analysisData.stats.meetingRequirements,
          complianceRate: analysisData.stats.complianceRate,
        },
        stats: analysisData.stats,
        // Solo guardamos una muestra de datos para ahorrar espacio
        sampleData: analysisData.data.slice(0, 10),
      };

      // Añadir el nuevo análisis al principio de la lista
      existingAnalyses.unshift(newEntry);

      // Limitar la cantidad de análisis guardados
      if (existingAnalyses.length > this.maxEntries) {
        existingAnalyses.pop();
      }

      // Guardar en localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(existingAnalyses));

      return analysisId;
    } catch (error) {
      console.error("Error al guardar análisis:", error);
      return null;
    }
  }

  /**
   * Obtiene la lista de análisis guardados
   * @returns {Array} Lista de análisis
   */
  getAnalysisList() {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
      console.error("Error al obtener lista de análisis:", error);
      return [];
    }
  }

  /**
   * Obtiene un análisis por su ID
   * @param {string} id - ID del análisis
   * @returns {Object|null} Datos del análisis o null si no existe
   */
  getAnalysisById(id) {
    try {
      const analyses = this.getAnalysisList();
      return analyses.find((analysis) => analysis.id === id) || null;
    } catch (error) {
      console.error("Error al obtener análisis:", error);
      return null;
    }
  }

  /**
   * Elimina un análisis por su ID
   * @param {string} id - ID del análisis a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  deleteAnalysis(id) {
    try {
      const analyses = this.getAnalysisList();
      const filteredAnalyses = analyses.filter(
        (analysis) => analysis.id !== id
      );

      // Verificar si se encontró y eliminó el análisis
      if (filteredAnalyses.length === analyses.length) {
        return false; // No se encontró el análisis
      }

      // Guardar la lista actualizada
      localStorage.setItem(this.storageKey, JSON.stringify(filteredAnalyses));
      return true;
    } catch (error) {
      console.error("Error al eliminar análisis:", error);
      return false;
    }
  }

  /**
   * Elimina todos los análisis guardados
   * @returns {boolean} True si se eliminaron correctamente
   */
  clearAllAnalyses() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error("Error al eliminar todos los análisis:", error);
      return false;
    }
  }

  /**
   * Exporta todos los análisis como un archivo JSON
   */
  exportAllAnalyses() {
    try {
      const analyses = this.getAnalysisList();

      // Crear un blob con los datos
      const dataStr = JSON.stringify(analyses, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const dataUrl = URL.createObjectURL(dataBlob);

      // Crear un enlace para descargar el archivo
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `processor_analyses_export_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

      // Disparar la descarga
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      return true;
    } catch (error) {
      console.error("Error al exportar análisis:", error);
      return false;
    }
  }

  /**
   * Importa análisis desde un archivo JSON
   * @param {File} file - Archivo JSON a importar
   * @returns {Promise<Object>} Resultado de la importación
   */
  importAnalyses(file) {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const importedData = JSON.parse(e.target.result);

            // Validar que sea un array
            if (!Array.isArray(importedData)) {
              reject({
                success: false,
                message: "Formato de archivo inválido",
              });
              return;
            }

            // Validar estructura básica de cada análisis
            const validAnalyses = importedData.filter(
              (analysis) =>
                analysis.id &&
                analysis.timestamp &&
                analysis.summary &&
                typeof analysis.summary.totalProcessors === "number"
            );

            if (validAnalyses.length === 0) {
              reject({
                success: false,
                message: "No se encontraron análisis válidos en el archivo",
              });
              return;
            }

            // Obtener análisis existentes
            const existingAnalyses = this.getAnalysisList();

            // Combinar con los importados, evitando duplicados por ID
            const existingIds = new Set(existingAnalyses.map((a) => a.id));
            const newAnalyses = [...existingAnalyses];

            let addedCount = 0;
            validAnalyses.forEach((analysis) => {
              if (!existingIds.has(analysis.id)) {
                newAnalyses.push(analysis);
                existingIds.add(analysis.id);
                addedCount++;
              }
            });

            // Ordenar por fecha (más reciente primero)
            newAnalyses.sort(
              (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            // Limitar la cantidad total
            const trimmedAnalyses = newAnalyses.slice(0, this.maxEntries);

            // Guardar en localStorage
            localStorage.setItem(
              this.storageKey,
              JSON.stringify(trimmedAnalyses)
            );

            resolve({
              success: true,
              message: `Importación exitosa: ${addedCount} análisis añadidos`,
              importedCount: addedCount,
            });
          } catch (parseError) {
            reject({
              success: false,
              message: `Error al procesar el archivo: ${parseError.message}`,
            });
          }
        };

        reader.onerror = () => {
          reject({ success: false, message: "Error al leer el archivo" });
        };

        reader.readAsText(file);
      } catch (error) {
        reject({
          success: false,
          message: `Error en la importación: ${error.message}`,
        });
      }
    });
  }
}

// Instancia singleton
export const analysisStorage = new AnalysisStorage();
