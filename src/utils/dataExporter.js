// utils/dataExporter.js
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * Clase para exportar datos en diferentes formatos
 */
export class DataExporter {
  /**
   * Exporta datos a un archivo Excel (.xlsx)
   * @param {Array} data - Datos a exportar
   * @param {String} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones adicionales
   */
  static toExcel(data, filename = "exported_data", options = {}) {
    try {
      if (!data || data.length === 0) {
        console.error("No hay datos para exportar");
        return false;
      }

      // Crear una hoja de trabajo
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Aplicar anchos de columna automáticos si no se especifican
      if (!options.columnWidths) {
        const cols = Object.keys(data[0]).map((key) => ({
          wch: Math.max(key.length, 15),
        }));
        worksheet["!cols"] = cols;
      } else {
        worksheet["!cols"] = options.columnWidths;
      }

      // Crear un libro y agregar la hoja
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        options.sheetName || "Datos"
      );

      // Guardar el archivo
      XLSX.writeFile(workbook, `${filename}.xlsx`);
      return true;
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      return false;
    }
  }

  /**
   * Exporta datos a un archivo CSV
   * @param {Array} data - Datos a exportar
   * @param {String} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones adicionales
   */
  static toCSV(data, filename = "exported_data", options = {}) {
    try {
      if (!data || data.length === 0) {
        console.error("No hay datos para exportar");
        return false;
      }

      // Convertir a CSV
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet, {
        FS: options.delimiter || ",",
        blankrows: false,
      });

      // Crear un blob y descargar
      const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("Error al exportar a CSV:", error);
      return false;
    }
  }

  /**
   * Exporta datos a un archivo PDF
   * @param {Array} data - Datos a exportar
   * @param {String} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones adicionales
   */
  static toPDF(data, filename = "exported_data", options = {}) {
    try {
      if (!data || data.length === 0) {
        console.error("No hay datos para exportar");
        return false;
      }

      // Inicializar PDF
      const orientation = options.orientation || "landscape";
      const doc = new jsPDF(orientation, "mm", "a4");

      // Agregar título
      if (options.title) {
        doc.setFontSize(18);
        doc.text(options.title, 14, 22);
        doc.setFontSize(12);
      }

      // Agregar fecha
      const now = new Date().toLocaleString();
      doc.setFontSize(10);
      doc.text(`Generado: ${now}`, 14, 30);
      doc.setFontSize(12);

      // Seleccionar columnas a mostrar
      let columns = [];
      let tableData = [];

      if (options.columns) {
        // Usar columnas especificadas
        columns = options.columns.map((col) => ({
          header: col.header || col.key,
          dataKey: col.key,
        }));

        tableData = data.map((row) => {
          const newRow = {};
          options.columns.forEach((col) => {
            newRow[col.key] = row[col.key] || "";
          });
          return newRow;
        });
      } else {
        // Usar todas las columnas
        if (data.length > 0) {
          columns = Object.keys(data[0]).map((key) => ({
            header: key,
            dataKey: key,
          }));
          tableData = data;
        }
      }

      // Crear tabla
      doc.autoTable({
        startY: 35,
        head: [columns.map((col) => col.header)],
        body: tableData.map((row) =>
          columns.map((col) => row[col.dataKey] || "")
        ),
        theme: options.theme || "grid",
        headStyles: {
          fillColor: options.headerColor || [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        margin: { top: 35 },
      });

      // Agregar número de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // Guardar archivo
      doc.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      console.error("Error al exportar a PDF:", error);
      return false;
    }
  }

  /**
   * Exporta datos a un archivo HTML
   * @param {Array} data - Datos a exportar
   * @param {String} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones adicionales
   */
  static toHTML(data, filename = "exported_data", options = {}) {
    try {
      if (!data || data.length === 0) {
        console.error("No hay datos para exportar");
        return false;
      }

      // Iniciar contenido HTML
      let html = `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.title || "Datos Exportados"}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${options.title || "Datos Exportados"}</h1>
        <p>Generado el ${new Date().toLocaleString()}</p>`;

      // Agregar tabla
      html += "<table><thead><tr>";

      // Encabezados
      const headers = options.columns
        ? options.columns.map((col) => col.header || col.key)
        : Object.keys(data[0]);

      headers.forEach((header) => {
        html += `<th>${header}</th>`;
      });

      html += "</tr></thead><tbody>";

      // Filas de datos
      data.forEach((row) => {
        html += "<tr>";
        if (options.columns) {
          options.columns.forEach((col) => {
            html += `<td>${row[col.key] || ""}</td>`;
          });
        } else {
          Object.values(row).forEach((value) => {
            html += `<td>${value || ""}</td>`;
          });
        }
        html += "</tr>";
      });

      html += "</tbody></table>";

      // Agregar pie de página
      if (options.footer) {
        html += `<div class="footer">${options.footer}</div>`;
      } else {
        html += `<div class="footer">Total de registros: ${data.length}</div>`;
      }

      html += "</body></html>";

      // Crear blob y descargar
      const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.html`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("Error al exportar a HTML:", error);
      return false;
    }
  }

  /**
   * Exporta datos a un archivo JSON
   * @param {Array|Object} data - Datos a exportar
   * @param {String} filename - Nombre del archivo (sin extensión)
   * @param {Object} options - Opciones adicionales
   */
  static toJSON(data, filename = "exported_data", options = {}) {
    try {
      if (!data) {
        console.error("No hay datos para exportar");
        return false;
      }

      // Convertir a formato JSON (pretty print)
      const jsonStr = JSON.stringify(data, null, options.spaces || 2);

      // Crear blob y descargar
      const blob = new Blob([jsonStr], {
        type: "application/json;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error("Error al exportar a JSON:", error);
      return false;
    }
  }

  /**
   * Exporta una vista completa con resumen para compartir
   * @param {Object} data - Objeto con datos y estadísticas
   * @param {String} filename - Nombre del archivo (sin extensión)
   */
  static generateFullReport(data, filename = "reporte_completo") {
    try {
      if (!data || !data.normalizedData || !data.stats) {
        console.error("Datos incompletos para generar el reporte");
        return false;
      }

      // Crear un PDF con orientación horizontal
      const doc = new jsPDF("landscape", "mm", "a4");

      // Título
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 128);
      doc.text("REPORTE DE AUDITORÍA DE PROCESADORES", 14, 20);

      // Fecha
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 28);

      // Resumen
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumen del análisis", 14, 40);

      // Tabla de resumen
      const summaryData = [
        ["Total de equipos analizados", data.stats.totalProcessors.toString()],
        [
          "Equipos que cumplen requisitos",
          `${
            data.stats.meetingRequirements
          } (${data.stats.complianceRate.toFixed(1)}%)`,
        ],
        [
          "Equipos que NO cumplen requisitos",
          `${data.stats.notMeetingRequirements} (${(
            100 - data.stats.complianceRate
          ).toFixed(1)}%)`,
        ],
      ];

      doc.autoTable({
        startY: 45,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
        },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      });

      // Distribución por marca
      let yPos = doc.autoTable.previous.finalY + 10;
      doc.setFontSize(12);
      doc.text("Distribución por marca", 14, yPos);

      const brandData = [];
      Object.entries(data.stats.brandDistribution).forEach(([brand, count]) => {
        brandData.push([
          brand,
          count.toString(),
          `${((count / data.stats.totalProcessors) * 100).toFixed(1)}%`,
        ]);
      });

      doc.autoTable({
        startY: yPos + 5,
        head: [["Marca", "Cantidad", "Porcentaje"]],
        body: brandData,
        theme: "grid",
        headStyles: {
          fillColor: [76, 175, 80],
          textColor: [255, 255, 255],
        },
        margin: { left: 14, right: 14 },
        tableWidth: 100,
      });

      // Motivos de incumplimiento
      yPos = doc.autoTable.previous.finalY + 10;
      doc.text("Motivos de incumplimiento", 140, yPos);

      const failureData = [];
      Object.entries(data.stats.failureReasons)
        .sort((a, b) => b[1] - a[1])
        .forEach(([reason, count]) => {
          failureData.push([
            reason,
            count.toString(),
            `${((count / data.stats.notMeetingRequirements) * 100).toFixed(
              1
            )}%`,
          ]);
        });

      doc.autoTable({
        startY: yPos + 5,
        head: [["Motivo", "Cantidad", "Porcentaje"]],
        body: failureData,
        theme: "grid",
        headStyles: {
          fillColor: [244, 67, 54],
          textColor: [255, 255, 255],
        },
        margin: { left: 140, right: 14 },
        tableWidth: 140,
      });

      // Nueva página para listado de procesadores
      doc.addPage();

      // Título
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Listado de procesadores analizados", 14, 20);

      // Seleccionar columnas relevantes
      const relevantColumns = [
        "Hostname",
        "Procesador Normalizado",
        "Marca Procesador",
        "Modelo Procesador",
        "Generación",
        "Velocidad",
        "Cumple Requisitos",
      ];

      // Preparar datos para la tabla
      const tableData = data.normalizedData.map((item) => {
        const row = {};
        relevantColumns.forEach((col) => {
          if (item.hasOwnProperty(col)) {
            row[col] = item[col];
          }
        });
        return row;
      });

      // Crear tabla con los procesadores
      doc.autoTable({
        startY: 25,
        columns: relevantColumns.map((col) => ({ header: col, dataKey: col })),
        body: tableData,
        theme: "striped",
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          "Cumple Requisitos": {
            cellCallback: function (cell, data) {
              if (cell.text[0] === "Sí") {
                cell.styles.fillColor = [220, 255, 220];
                cell.styles.textColor = [0, 100, 0];
              } else if (cell.text[0] === "No") {
                cell.styles.fillColor = [255, 220, 220];
                cell.styles.textColor = [150, 0, 0];
              }
            },
          },
        },
        margin: { top: 25, left: 10, right: 10 },
      });

      // Agregar número de página
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );
      }

      // Guardar archivo
      doc.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      console.error("Error al generar reporte completo:", error);
      return false;
    }
  }
}

// Exportar funciones individuales para facilitar su uso
export const exportToExcel = DataExporter.toExcel;
export const exportToCSV = DataExporter.toCSV;
export const exportToPDF = DataExporter.toPDF;
export const exportToHTML = DataExporter.toHTML;
export const exportToJSON = DataExporter.toJSON;
export const generateFullReport = DataExporter.generateFullReport;
