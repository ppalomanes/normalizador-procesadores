// utils/pdfExporter.js
import { jsPDF } from "jspdf";
// Intentar importar jspdf-autotable
let autoTableLoaded = false;
try {
  require("jspdf-autotable");
  autoTableLoaded = true;
} catch (e) {
  console.warn("jspdf-autotable no se pudo cargar, se usará un formato básico");
}

/**
 * Divide un texto de encabezado en múltiples líneas para mejor visualización
 * @param {String} header - Texto del encabezado a dividir
 * @returns {Array} Array con las líneas del texto dividido
 */
const splitHeaderText = (header) => {
  // Mapeo de encabezados específicos para división manual
  const headerMap = {
    "Procesador Normalizado": ["Procesador", "Normalizado"],
    "RAM Normalizada": ["RAM", "Normalizada"],
    "Almacenamiento Normalizado": ["Almacenamiento", "Normalizado"],
    "Tipo Almacenamiento": ["Tipo", "Almacenamiento"],
    "Cumple Requisitos": ["Cumple", "Requisitos"],
    "Motivo Incumplimiento": ["Motivo", "Incumplimiento"],
  };

  // Si el encabezado tiene una división predefinida, usarla
  if (headerMap[header]) {
    return headerMap[header];
  }

  // Si no está en el mapeo, devolverlo como una sola línea
  return [header];
};

/**
 * Crea una tarjeta con fondo gris para mostrar estadísticas
 * @param {Object} doc - Documento PDF
 * @param {Number} x - Posición x inicial
 * @param {Number} y - Posición y inicial
 * @param {Number} width - Ancho de la tarjeta
 * @param {Number} height - Alto de la tarjeta
 * @param {String} title - Título a mostrar
 * @param {String} value - Valor principal a mostrar
 * @param {String} subtitle - Subtítulo opcional
 * @param {Array} colors - Colores RGB para el valor [r,g,b]
 */
const drawStatCard = (
  doc,
  x,
  y,
  width,
  height,
  title,
  value,
  subtitle = null,
  colors = [0, 0, 0]
) => {
  // Dibujar fondo
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(x, y, width, height, 3, 3, "F");

  // Dibujar título
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 120);
  doc.text(title, x + 5, y + 12);

  // Dibujar valor principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(colors[0], colors[1], colors[2]);
  doc.text(value, x + 5, y + 35);

  // Dibujar subtítulo si existe
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(colors[0], colors[1], colors[2]);
    doc.text(subtitle, x + value.length * 12 + 10, y + 35);
  }
};

/**
 * Crea una sección con título y lista de valores
 * @param {Object} doc - Documento PDF
 * @param {Number} x - Posición x inicial
 * @param {Number} y - Posición y inicial
 * @param {String} title - Título de la sección
 * @param {Array} items - Array de objetos {label, value, percentage}
 * @returns {Number} Posición y final después de dibujar la sección
 */
const drawListSection = (doc, x, y, title, items) => {
  // Dibujar título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y);

  y += 8; // Espacio después del título

  // Dibujar items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  items.forEach((item) => {
    let text = `${item.label}: ${item.value}`;
    if (item.percentage) {
      text += ` (${item.percentage}%)`;
    }

    doc.text(text, x, y);
    y += 7; // Espacio entre elementos
  });

  return y + 5; // Devolver posición final con margen adicional
};

/**
 * Genera un reporte PDF con los datos normalizados
 * @param {Array} data - Datos normalizados
 * @param {Object|String} statsOrFilename - Estadísticas calculadas o nombre de archivo
 * @param {String} optionalFilename - Nombre del archivo opcional si el segundo parámetro es stats
 */
export const exportToPDF = (
  data,
  statsOrFilename = null,
  optionalFilename = "Reporte_Procesadores.pdf"
) => {
  // Determinar parámetros basados en el tipo de datos proporcionados
  let stats = null;
  let filename = "Reporte_Procesadores.pdf";

  if (!data) return;

  // Verificar tipo del segundo parámetro
  if (typeof statsOrFilename === "string") {
    filename = statsOrFilename; // Es el nombre del archivo
  } else if (statsOrFilename && typeof statsOrFilename === "object") {
    stats = statsOrFilename; // Son las estadísticas
    filename = optionalFilename;
  }

  try {
    // Crear un nuevo documento PDF
    const doc = new jsPDF("landscape");

    // Configuración de colores
    const greenColor = [76, 175, 80]; // RGB
    const redColor = [244, 67, 54]; // RGB
    const blueColor = [33, 150, 243]; // RGB
    const neutralColor = [90, 90, 90]; // RGB

    // Establecer datos de la cabecera
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("Informe de Auditoría de Procesadores", 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    // Primera página - Resumen y estadísticas
    if (stats) {
      // Resumen del análisis
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumen del análisis", 14, 40);

      // ===== TARJETAS DE ESTADÍSTICAS =====
      // Tarjeta 1: Total equipos
      drawStatCard(
        doc,
        14, // x
        45, // y
        80, // width
        50, // height
        "Total equipos analizados", // title
        stats.totalProcessors.toString(), // value
        null, // subtitle
        neutralColor // colors
      );

      // Tarjeta 2: Equipos que cumplen
      drawStatCard(
        doc,
        100, // x
        45, // y
        80, // width
        50, // height
        "Equipos que cumplen requisitos", // title
        stats.meetingRequirements.toString(), // value
        `(${stats.complianceRate.toFixed(1)}%)`, // subtitle
        greenColor // colors
      );

      // Tarjeta 3: Equipos que no cumplen
      drawStatCard(
        doc,
        186, // x
        45, // y
        80, // width
        50, // height
        "Equipos que NO cumplen requisitos", // title
        stats.notMeetingRequirements.toString(), // value
        `(${(100 - stats.complianceRate).toFixed(1)}%)`, // subtitle
        redColor // colors
      );

      // ===== SECCIÓN DISTRIBUCIÓN POR MARCA Y MOTIVOS DE INCUMPLIMIENTO =====
      // Preparar datos para distribución por marca
      const brandItems = Object.entries(stats.brandDistribution).map(
        ([brand, count]) => ({
          label: brand,
          value: count,
          percentage: ((count / stats.totalProcessors) * 100).toFixed(1),
        })
      );

      // Preparar datos para motivos de incumplimiento
      const failureItems = Object.entries(stats.failureReasons)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason, count]) => ({
          label: reason,
          value: count,
          percentage: ((count / stats.notMeetingRequirements) * 100).toFixed(1),
        }));

      // Dibujar secciones en columnas paralelas
      drawListSection(doc, 14, 110, "Distribución por marca", brandItems);
      drawListSection(
        doc,
        150,
        110,
        "Principales motivos de incumplimiento",
        failureItems
      );

      // ===== SECCIÓN ESTADÍSTICAS DE RAM =====
      if (stats.ram && stats.ram.total > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Estadísticas de Memoria RAM", 14, 170);

        // Cuadros de estadísticas de RAM
        const cardWidth = 80;
        const cardHeight = 45;
        const cardY = 175;

        // Card 1: Total equipos con RAM
        drawStatCard(
          doc,
          14, // x
          cardY, // y
          cardWidth, // width
          cardHeight, // height
          "Equipos con RAM analizada", // title
          stats.ram.total.toString(), // value
          null, // subtitle
          blueColor // colors
        );

        // Card 2: Promedio RAM
        drawStatCard(
          doc,
          14 + cardWidth + 10, // x
          cardY, // y
          cardWidth, // width
          cardHeight, // height
          "Promedio de RAM", // title
          `${stats.ram.avg.toFixed(1)} GB`, // value
          null, // subtitle
          blueColor // colors
        );

        // Identificar la cantidad más común de RAM
        let mostCommonRamSize = Object.entries(stats.ram.distribution).sort(
          (a, b) => b[1] - a[1]
        )[0];

        // Card 3: Cantidad más común
        if (mostCommonRamSize) {
          drawStatCard(
            doc,
            14 + (cardWidth + 10) * 2, // x
            cardY, // y
            cardWidth, // width
            cardHeight, // height
            "Cantidad más común", // title
            `${mostCommonRamSize[0]} GB`, // value
            null, // subtitle
            blueColor // colors
          );
        }

        // Preparar datos para distribución por capacidad de RAM
        const ramDistItems = Object.entries(stats.ram.distribution)
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
          .map(([size, count]) => ({
            label: `${size} GB`,
            value: count,
            percentage: ((count / stats.ram.total) * 100).toFixed(1),
          }));

        // Dibujar distribución por capacidad
        drawListSection(
          doc,
          14,
          cardY + cardHeight + 10,
          "Distribución por capacidad",
          ramDistItems
        );
      }

      // ===== SECCIÓN ESTADÍSTICAS DE ALMACENAMIENTO =====
      if (stats.storage && stats.storage.total > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Estadísticas de Almacenamiento", 150, 170);

        // Preparar texto de almacenamiento promedio
        let avgStorageText = "";
        if (stats.storage.avgCapacity >= 1000) {
          avgStorageText = `${(stats.storage.avgCapacity / 1000).toFixed(
            1
          )} TB`;
        } else {
          avgStorageText = `${stats.storage.avgCapacity.toFixed(0)} GB`;
        }

        // Preparar datos para distribución por tipo
        const storageTypeItems = Object.entries(stats.storage.byType).map(
          ([type, count]) => ({
            label: type,
            value: count,
            percentage: ((count / stats.storage.total) * 100).toFixed(1),
          })
        );

        // Cuadro con total de equipos analizados
        drawStatCard(
          doc,
          150, // x
          175, // y
          80, // width
          45, // height
          "Total equipos analizados", // title
          stats.storage.total.toString(), // value
          null, // subtitle
          blueColor // colors
        );

        // Cuadro con capacidad promedio
        drawStatCard(
          doc,
          150 + 90, // x
          175, // y
          80, // width
          45, // height
          "Promedio de capacidad", // title
          avgStorageText, // value
          null, // subtitle
          blueColor // colors
        );

        // Dibujar distribución por tipo de almacenamiento
        drawListSection(
          doc,
          150,
          225,
          "Distribución por tipo",
          storageTypeItems
        );

        // Preparar datos para capacidades más comunes
        const storageCapacityItems = Object.entries(stats.storage.byCapacity)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([capacity, count]) => {
            const displayCapacity =
              capacity >= 1000
                ? `${(capacity / 1000).toFixed(1)} TB`
                : `${capacity} GB`;

            return {
              label: displayCapacity,
              value: count,
              percentage: ((count / stats.storage.total) * 100).toFixed(1),
            };
          });

        // Mostrar capacidades más comunes si hay datos
        if (storageCapacityItems.length > 0) {
          drawListSection(
            doc,
            150,
            260,
            "Capacidades más comunes",
            storageCapacityItems
          );
        }
      }
    } else {
      // Si no hay estadísticas, mostrar una nota
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("No se encontraron estadísticas para mostrar", 14, 50);
    }

    // ===== PÁGINA DE TABLA DE DATOS =====
    doc.addPage();

    // Título para la tabla de datos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalle de procesadores analizados", 14, 20);

    // Seleccionar SOLO las columnas específicas solicitadas
    const requestedColumns = [
      "Hostname",
      "Procesador Normalizado",
      "RAM Normalizada",
      "Almacenamiento Normalizado",
      "Tipo Almacenamiento",
      "Cumple Requisitos",
      "Motivo Incumplimiento",
    ];

    // Filtrar las columnas disponibles en los datos
    const availableColumns = requestedColumns.filter(
      (col) => data.length > 0 && Object.keys(data[0]).includes(col)
    );

    if (autoTableLoaded && typeof doc.autoTable === "function") {
      // Obtener los datos para la tabla
      const tableData = data.map((row) =>
        availableColumns.map((col) => row[col] || "")
      );

      // Calcular anchos automáticamente basado en el contenido
      const getMeasuredWidth = (text, fontSize) => {
        if (!text) return 0;
        return (
          (doc.getStringUnitWidth(text.toString()) * fontSize) /
          doc.internal.scaleFactor
        );
      };

      // Ajustar proporcionalmente para que la tabla se adapte a la página
      const pageWidth = doc.internal.pageSize.width;
      const pageMargins = { left: 5, right: 5 }; // Reducir márgenes para maximizar espacio
      const availableWidth = pageWidth - pageMargins.left - pageMargins.right;

      // Proporción de espacio para cada columna (porcentaje del ancho total disponible)
      const columnProportion = {
        Hostname: 13,
        "Procesador Normalizado": 26,
        "RAM Normalizada": 10,
        "Almacenamiento Normalizado": 13,
        "Tipo Almacenamiento": 10,
        "Cumple Requisitos": 8,
        "Motivo Incumplimiento": 20,
      };

      // Calcular anchos basados en proporciones
      const columnWidths = {};
      availableColumns.forEach((col) => {
        // Usar proporción si está definida, o distribuir equitativamente
        const proportion =
          columnProportion[col] || 100 / availableColumns.length;
        columnWidths[col] = (availableWidth * proportion) / 100;
      });

      // Configurar estilos de columna para autoTable
      const columnStyles = {};
      availableColumns.forEach((col, index) => {
        columnStyles[index] = {
          cellWidth: columnWidths[col],
          fontStyle: "normal",
          overflow: "linebreak", // Permitir salto de línea
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }, // Padding mínimo
          valign: "middle", // Alinear verticalmente
        };
      });

      // Preparar encabezados con formato mejorado
      const formattedHeaders = availableColumns.map((col) =>
        splitHeaderText(col)
      );

      // Crear tabla con datos con más filas por página
      doc.autoTable({
        startY: 25,
        head: [formattedHeaders],
        body: tableData.slice(0, 100),
        theme: "plain",
        headStyles: {
          fillColor: blueColor,
          textColor: [255, 255, 255],
          fontSize: 8, // Reducir tamaño de fuente
          fontStyle: "normal",
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          halign: "center",
          valign: "middle",
          minCellHeight: 8, // Reducir altura mínima
        },
        bodyStyles: {
          fontSize: 7.5, // Reducir aún más el tamaño en el cuerpo
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          fontStyle: "normal",
          minCellHeight: 6, // Muy compacto
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: columnStyles,
        didDrawCell: (data) => {
          // Dar color a las celdas según cumplimiento
          if (
            data.section === "body" &&
            availableColumns[data.column.index] === "Cumple Requisitos"
          ) {
            if (data.cell.raw === "Sí") {
              doc.setFillColor(235, 255, 235); // Verde muy claro
              doc.rect(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                "F"
              );
              doc.setTextColor(0, 128, 0);
              doc.setFontSize(7.5);
              doc.text(
                "Sí",
                data.cell.x + 2,
                data.cell.y + data.cell.height / 2 + 1
              );
            } else if (data.cell.raw === "No") {
              doc.setFillColor(255, 240, 240); // Rojo muy claro
              doc.rect(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                "F"
              );
              doc.setTextColor(180, 0, 0);
              doc.setFontSize(7.5);
              doc.text(
                "No",
                data.cell.x + 2,
                data.cell.y + data.cell.height / 2 + 1
              );
            }
            return true; // Señalar que hemos personalizado esta celda
          }
        },
        margin: { top: 25, left: pageMargins.left, right: pageMargins.right },
        tableWidth: "auto",
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Agregar nota de pie
          const currentDate = new Date().toLocaleString();
          doc.setFontSize(7); // Reducir tamaño de fuente del pie de página
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
            14,
            doc.internal.pageSize.height - 5
          );
        },
      });
    } else {
      // Fallback: Crear una tabla básica sin autoTable
      let startY = 30;
      const rowHeight = 8; // Altura reducida para más filas por página
      const headerRowHeight = 10;
      const fontSize = 7;
      const headerFontSize = 8;

      // Ajustar márgenes para maximizar espacio
      const leftMargin = 5;
      const pageWidth = doc.internal.pageSize.width;
      const availableWidth = pageWidth - 2 * leftMargin;

      // Proporciones para cada columna (como % del espacio disponible)
      const columnProportion = {
        Hostname: 13,
        "Procesador Normalizado": 26,
        "RAM Normalizada": 10,
        "Almacenamiento Normalizado": 13,
        "Tipo Almacenamiento": 10,
        "Cumple Requisitos": 8,
        "Motivo Incumplimiento": 20,
      };

      // Calcular ancho para cada columna
      const colWidths = {};
      let remainingWidth = availableWidth;
      let remainingColumns = availableColumns.length;

      availableColumns.forEach((col, index) => {
        // Usar proporciones predefinidas si existen
        if (columnProportion[col]) {
          colWidths[col] = (availableWidth * columnProportion[col]) / 100;
          remainingWidth -= colWidths[col];
          remainingColumns--;
        }
      });

      // Distribuir el espacio restante entre columnas sin proporción definida
      if (remainingColumns > 0) {
        const widthPerColumn = remainingWidth / remainingColumns;
        availableColumns.forEach((col) => {
          if (!colWidths[col]) {
            colWidths[col] = widthPerColumn;
          }
        });
      }

      // Calcular ancho total
      const totalWidth = availableColumns.reduce(
        (sum, col) => sum + colWidths[col],
        0
      );

      // Dibujar encabezados
      doc.setFillColor(33, 150, 243);
      doc.rect(leftMargin, startY, totalWidth, headerRowHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(headerFontSize);
      doc.setFont("helvetica", "normal");

      let colX = leftMargin;

      // Dibujar encabezados con mejor ajuste
      availableColumns.forEach((col) => {
        const width = colWidths[col];
        // Dividir encabezado usando la función helper
        const headerLines = splitHeaderText(col);

        // Centrar cada línea del encabezado
        headerLines.forEach((line, lineIndex) => {
          const lineCount = headerLines.length;
          const lineHeight = headerRowHeight / (lineCount + 0.5);
          const yPos = startY + 3 + lineIndex * lineHeight;
          doc.text(line, colX + width / 2, yPos, { align: "center" });
        });

        colX += width;
      });

      // Dibujar datos (más filas por página)
      startY += headerRowHeight;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", "normal");

      // Calcular cuántas filas caben en una página
      const pageHeight = doc.internal.pageSize.height;
      const maxRowsPerPage = Math.floor((pageHeight - startY - 10) / rowHeight);

      // Mostrar datos en páginas
      for (let i = 0; i < Math.min(data.length, 100); i++) {
        // Verificar si necesitamos una nueva página
        if (i > 0 && i % maxRowsPerPage === 0) {
          doc.addPage();
          startY = 30;

          // Volver a dibujar encabezados en la nueva página
          doc.setFillColor(33, 150, 243);
          doc.rect(leftMargin, startY, totalWidth, headerRowHeight, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(headerFontSize);

          colX = leftMargin;
          availableColumns.forEach((col) => {
            const width = colWidths[col];
            // Dividir encabezado usando la función helper
            const headerLines = splitHeaderText(col);

            // Centrar cada línea del encabezado
            headerLines.forEach((line, lineIndex) => {
              const lineCount = headerLines.length;
              const lineHeight = headerRowHeight / (lineCount + 0.5);
              const yPos = startY + 3 + lineIndex * lineHeight;
              doc.text(line, colX + width / 2, yPos, { align: "center" });
            });

            colX += width;
          });

          startY += headerRowHeight;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(fontSize);
          doc.setFont("helvetica", "normal");
        }

        const row = data[i];
        colX = leftMargin;

        // Verificar si esta fila cumple requisitos
        const cumpleRequisitos = row["Cumple Requisitos"] === "Sí";

        if (cumpleRequisitos) {
          doc.setFillColor(245, 255, 245); // Verde muy claro
        } else {
          doc.setFillColor(255, 245, 245); // Rojo muy claro
        }

        doc.rect(leftMargin, startY, totalWidth, rowHeight, "F");

        availableColumns.forEach((col) => {
          const value = row[col] || "";
          const width = colWidths[col];

          // Acortar texto si es necesario (permitir más texto)
          const maxLength = Math.floor(width / 1.5);
          const displayValue =
            value.length > maxLength
              ? value.substring(0, maxLength) + "..."
              : value;

          // Cambiar color para la columna "Cumple Requisitos"
          if (col === "Cumple Requisitos") {
            if (value === "Sí") {
              doc.setTextColor(0, 128, 0);
            } else {
              doc.setTextColor(178, 34, 34);
            }
          } else {
            doc.setTextColor(0, 0, 0);
          }

          doc.text(displayValue, colX + 1, startY + rowHeight / 2 + 1);
          colX += width;
        });

        startY += rowHeight;
      }

      // Agregar nota de pie
      const currentDate = new Date().toLocaleString();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
        leftMargin,
        doc.internal.pageSize.height - 5
      );
    }

    // Guardar el PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("Error en exportToPDF:", error);

    // Intentar exportar un PDF muy básico como último recurso
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Reporte básico de procesadores", 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(
        "No se pudo generar el informe completo debido a un error técnico.",
        20,
        40
      );
      doc.text("Datos analizados: " + data.length + " registros", 20, 50);

      if (stats) {
        doc.text("Total equipos: " + stats.totalProcessors, 20, 60);
        doc.text("Cumplen requisitos: " + stats.meetingRequirements, 20, 70);
        doc.text(
          "No cumplen requisitos: " + stats.notMeetingRequirements,
          20,
          80
        );
      }

      doc.text("Fecha de generación: " + new Date().toLocaleString(), 20, 100);
      doc.save(filename);
      return true;
    } catch (fallbackError) {
      console.error("Error en la exportación de emergencia:", fallbackError);
      alert(
        "No se pudo generar el PDF. Por favor, intente exportar a Excel como alternativa."
      );
      return false;
    }
  }
};

/**
 * Genera un reporte completo con estadísticas y recomendaciones
 * @param {Object|Array} dataOrObject - Objeto {normalizedData, stats} o Array de datos normalizados
 * @param {Object|String} statsOrFilename - Estadísticas o nombre de archivo
 * @param {String} optionalFilename - Nombre del archivo opcional
 */
export const exportDetailedReport = (
  dataOrObject,
  statsOrFilename = null,
  optionalFilename = "Reporte_Detallado.pdf"
) => {
  // Determinar cómo se han pasado los parámetros
  let normalizedData, stats, filename;

  // Verificar si el primer parámetro es un objeto con estructura {normalizedData, stats}
  if (dataOrObject && dataOrObject.normalizedData && dataOrObject.stats) {
    normalizedData = dataOrObject.normalizedData;
    stats = dataOrObject.stats;
    filename =
      typeof statsOrFilename === "string" ? statsOrFilename : optionalFilename;
  } else {
    // Formato tradicional: (data, stats, filename)
    normalizedData = dataOrObject;

    if (typeof statsOrFilename === "string") {
      stats = null;
      filename = statsOrFilename;
    } else {
      stats = statsOrFilename;
      filename = optionalFilename;
    }
  }

  if (!normalizedData) return;

  // Si no hay estadísticas, crear un PDF simple
  if (!stats) {
    exportToPDF(normalizedData, filename);
    return;
  }

  try {
    // Crear un nuevo documento PDF
    const doc = new jsPDF();

    // Configuración de estilos
    const titleFont = { size: 22, style: "bold" };
    const subtitleFont = { size: 16, style: "bold" };
    const normalFont = { size: 12, style: "normal" };
    const blueColor = [33, 150, 243]; // RGB azul

    // Colores
    const primaryColor = [41, 98, 255]; // RGB azul

    // Portada
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 30, doc.internal.pageSize.height, "F");

    doc.setFont("helvetica", titleFont.style);
    doc.setFontSize(titleFont.size);
    doc.setTextColor(0, 0, 0);
    doc.text("Informe de Auditoría", 40, 40);
    doc.text("Parque Informático", 40, 55);

    doc.setFont("helvetica", normalFont.style);
    doc.setFontSize(normalFont.size);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 40, 75);
    doc.text(`Total de equipos analizados: ${stats.totalProcessors}`, 40, 85);
    doc.text(
      `Tasa de cumplimiento: ${stats.complianceRate.toFixed(1)}%`,
      40,
      95
    );

    // Primera página - Resumen ejecutivo
    doc.addPage();

    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Resumen Ejecutivo", 14, 20);

    doc.setFont("helvetica", normalFont.style);
    doc.setFontSize(normalFont.size);
    doc.text(
      "Este informe presenta los resultados del análisis realizado sobre el parque",
      14,
      35
    );
    doc.text(
      "informático para determinar el cumplimiento de los requisitos mínimos de hardware.",
      14,
      45
    );

    // Cuadro resumen - Convertido a tarjeta
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(14, 55, 180, 60, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.text("Resultados clave:", 20, 65);

    doc.setFont("helvetica", "normal");
    doc.text(`• Total de equipos analizados: ${stats.totalProcessors}`, 20, 80);
    doc.text(
      `• Equipos que cumplen requisitos: ${
        stats.meetingRequirements
      } (${stats.complianceRate.toFixed(1)}%)`,
      20,
      90
    );
    doc.text(
      `• Equipos que no cumplen: ${stats.notMeetingRequirements} (${(
        100 - stats.complianceRate
      ).toFixed(1)}%)`,
      20,
      100
    );

    // Principales hallazgos
    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Principales Hallazgos", 14, 130);

    // Crear tarjetas para distribución por marca y motivos de incumplimiento
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(14, 140, 80, 80, 3, 3, "F");
    doc.roundedRect(110, 140, 80, 80, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text("Distribución por marca", 20, 150);
    doc.text("Principales motivos de incumplimiento", 115, 150);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Crear resumen de marcas
    let brandY = 160;
    Object.entries(stats.brandDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => {
        const percentage = ((count / stats.totalProcessors) * 100).toFixed(1);
        doc.text(`${brand}: ${count} (${percentage}%)`, 20, brandY);
        brandY += 8;
      });

    // Principales motivos de fallo
    let failureY = 160;
    Object.entries(stats.failureReasons || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach((reason) => {
        const percentage = (
          (reason[1] / stats.notMeetingRequirements) *
          100
        ).toFixed(1);
        const shortReason =
          reason[0].length > 25
            ? reason[0].substring(0, 22) + "..."
            : reason[0];
        doc.text(
          `${shortReason}: ${reason[1]} (${percentage}%)`,
          115,
          failureY
        );
        failureY += 8;
      });

    // Recomendaciones
    doc.addPage();

    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Recomendaciones", 14, 20);

    // Tarjeta para recomendaciones
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(14, 30, 180, 100, 3, 3, "F");

    doc.setFont("helvetica", normalFont.style);
    doc.setFontSize(normalFont.size);

    // Calcular la fecha a un año
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const recommendationText = [
      "En base al análisis realizado, se recomienda lo siguiente:",
      "",
      `1. Actualizar ${stats.notMeetingRequirements} equipos que no cumplen con los requisitos mínimos antes`,
      `   de ${oneYearFromNow.toLocaleDateString()}.`,
      "",
      "2. Priorizar la actualización de equipos con los siguientes procesadores:",
    ];

    // Encontrar los procesadores más problemáticos
    const processorCount = {};
    normalizedData
      .filter((row) => row["Cumple Requisitos"] === "No")
      .forEach((row) => {
        const processor = row["Procesador Normalizado"] || "";
        processorCount[processor] = (processorCount[processor] || 0) + 1;
      });

    const topProblematicProcessors = Object.entries(processorCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topProblematicProcessors.forEach((processor, index) => {
      recommendationText.push(`   • ${processor[0]}: ${processor[1]} equipos`);
    });

    recommendationText.push(
      "",
      "3. Establecer un plan de actualización gradual, priorizando equipos críticos",
      "   para el negocio y aquellos con mayor obsolescencia tecnológica.",
      "",
      "4. Considerar la adquisición de equipos con especificaciones superiores a las",
      "   mínimas para garantizar mayor vida útil y mejor rendimiento."
    );

    doc.text(recommendationText.join("\n"), 20, 45);

    // Agregar tabla de procesadores analizados con las mismas mejoras que en exportToPDF
    doc.addPage();

    // Título para la tabla
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Detalle de Procesadores Analizados", 14, 20);

    // Seleccionar columnas específicas
    const requestedColumns = [
      "Hostname",
      "Procesador Normalizado",
      "RAM Normalizada",
      "Almacenamiento Normalizado",
      "Tipo Almacenamiento",
      "Cumple Requisitos",
      "Motivo Incumplimiento",
    ];

    // Filtrar columnas disponibles
    const availableColumns = requestedColumns.filter(
      (col) =>
        normalizedData.length > 0 &&
        Object.keys(normalizedData[0]).includes(col)
    );

    if (autoTableLoaded && typeof doc.autoTable === "function") {
      // Usar la misma función que en exportToPDF para calcular los anchos
      const getMeasuredWidth = (text, fontSize) => {
        if (!text) return 0;
        return (
          (doc.getStringUnitWidth(text.toString()) * fontSize) /
          doc.internal.scaleFactor
        );
      };

      // Ajustar proporcionalmente para que la tabla se adapte a la página
      const pageWidth = doc.internal.pageSize.width;
      const pageMargins = { left: 5, right: 5 };
      const availableWidth = pageWidth - pageMargins.left - pageMargins.right;

      // Proporción de espacio para cada columna
      const columnProportion = {
        Hostname: 13,
        "Procesador Normalizado": 24,
        "RAM Normalizada": 12,
        "Almacenamiento Normalizado": 14,
        "Tipo Almacenamiento": 11,
        "Cumple Requisitos": 9,
        "Motivo Incumplimiento": 17,
      };

      // Calcular anchos basados en proporciones
      const columnWidths = {};
      availableColumns.forEach((col) => {
        // Usar proporción si está definida, o distribuir equitativamente
        const proportion =
          columnProportion[col] || 100 / availableColumns.length;
        columnWidths[col] = (availableWidth * proportion) / 100;
      });

      // Preparar encabezados con formato mejorado
      const formattedHeaders = availableColumns.map((col) =>
        splitHeaderText(col)
      );

      // Crear tabla con datos
      const tableData = normalizedData.map((row) =>
        availableColumns.map((col) => row[col] || "")
      );

      // Configurar estilos de columna para autoTable
      const columnStyles = {};
      availableColumns.forEach((col, index) => {
        columnStyles[index] = {
          cellWidth: columnWidths[col],
          fontStyle: "normal",
          overflow: "linebreak",
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          valign: "middle",
        };
      });

      doc.autoTable({
        startY: 25,
        head: [formattedHeaders],
        body: tableData.slice(0, 100),
        theme: "plain",
        headStyles: {
          fillColor: blueColor,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: "normal",
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          halign: "center",
          valign: "middle",
          minCellHeight: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          fontStyle: "normal",
          minCellHeight: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: columnStyles,
        margin: { top: 25, left: pageMargins.left, right: pageMargins.right },
        didDrawCell: (data) => {
          // Colorear celdas de cumplimiento
          if (
            data.section === "body" &&
            availableColumns[data.column.index] === "Cumple Requisitos"
          ) {
            if (data.cell.raw === "Sí") {
              doc.setFillColor(235, 255, 235);
              doc.rect(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                "F"
              );
              doc.setTextColor(0, 128, 0);
              doc.setFontSize(7.5);
              doc.text(
                "Sí",
                data.cell.x + 2,
                data.cell.y + data.cell.height / 2 + 1
              );
            } else {
              doc.setFillColor(255, 240, 240);
              doc.rect(
                data.cell.x,
                data.cell.y,
                data.cell.width,
                data.cell.height,
                "F"
              );
              doc.setTextColor(180, 0, 0);
              doc.setFontSize(7.5);
              doc.text(
                "No",
                data.cell.x + 2,
                data.cell.y + data.cell.height / 2 + 1
              );
            }
            return true;
          }
        },
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Agregar nota de pie
          const currentDate = new Date().toLocaleString();
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
            14,
            doc.internal.pageSize.height - 5
          );
        },
      });
    } else {
      // Implementación básica de tabla sin autoTable
      doc.setFontSize(10);
      doc.text(
        "No se puede mostrar la tabla detallada. Use la exportación a Excel.",
        14,
        30
      );
    }

    // Guardar PDF
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("Error en exportDetailedReport:", error);

    // Intentar la exportación básica como fallback
    try {
      return exportToPDF(normalizedData, stats, filename);
    } catch (fallbackError) {
      console.error(
        "Error en el fallback de exportDetailedReport:",
        fallbackError
      );
      alert(
        "No se pudo generar el informe detallado. Por favor, intente otra opción de exportación."
      );
      return false;
    }
  }
};
