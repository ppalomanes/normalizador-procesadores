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
 * Crea una tarjeta compacta para mostrar estadísticas
 * @param {Object} doc - Documento PDF
 * @param {Number} x - Posición x inicial
 * @param {Number} y - Posición y inicial
 * @param {Number} width - Ancho de la tarjeta
 * @param {Number} height - Alto de la tarjeta (reducido para mayor compacidad)
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
  // Dibujar fondo más compacto
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(x, y, width, height, 2, 2, "F");

  // Dibujar título más pequeño
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8); // Reducido de 9 a 8
  doc.setTextColor(100, 100, 120);
  doc.text(title, x + 4, y + 8); // Ajuste vertical

  // Dibujar valor principal - tamaño más compacto
  const valueSize = value.length > 5 ? 14 : 16; // Reducido de 16/20 a 14/16
  doc.setFont("helvetica", "bold");
  doc.setFontSize(valueSize);
  doc.setTextColor(colors[0], colors[1], colors[2]);
  doc.text(value, x + 4, y + 20); // Ajuste vertical

  // Dibujar subtítulo si existe - más compacto
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Reducido de 10 a 9
    doc.setTextColor(colors[0], colors[1], colors[2]);
    // Posicionar el subtítulo a la derecha del valor principal
    const valueWidth = doc.getTextWidth(value);
    doc.text(subtitle, x + 4 + valueWidth + 3, y + 20); // Espaciado reducido
  }
};

/**
 * Crea una sección compacta con título y lista de valores
 * @param {Object} doc - Documento PDF
 * @param {Number} x - Posición x inicial
 * @param {Number} y - Posición y inicial
 * @param {Number} width - Ancho de la tarjeta
 * @param {String} title - Título de la sección
 * @param {Array} items - Array de objetos {label, value, percentage}
 * @returns {Number} Posición y final después de dibujar la sección
 */
const drawListSection = (doc, x, y, width, title, items) => {
  // Calcular altura más ajustada para el contenido
  const itemHeight = 4.5; // Altura por ítem aún más reducida
  const estimatedHeight = Math.max(6 + items.length * itemHeight + 6, 24); // Altura mínima reducida a 24px

  // Dibujar fondo de la tarjeta primero
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(x, y, width, estimatedHeight, 2, 2, "F");

  // Dibujar título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8); // Tamaño de título reducido
  doc.setTextColor(50, 50, 50);
  doc.text(title, x + 4, y + 8); // Posición Y reducida

  // Posición inicial para los ítems - más cerca del título
  let itemY = y + 14; // Posición inicial más alta

  // Dibujar items con compresión de texto
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5); // Tamaño de texto aún más reducido
  doc.setTextColor(0, 0, 0);

  items.forEach((item) => {
    // Calcular ancho disponible evitando desbordamiento
    const maxLabelWidth = width - 45; // Espacio para valor y porcentaje
    let label = item.label;

    // Verificar si el texto es demasiado largo y truncarlo
    if (
      (doc.getStringUnitWidth(label) * 6.5) / doc.internal.scaleFactor >
      maxLabelWidth
    ) {
      // Truncar el texto para que quepa
      let truncateLength =
        Math.floor(
          (maxLabelWidth * doc.internal.scaleFactor) /
            (doc.getStringUnitWidth("a") * 6.5)
        ) - 3;
      label = label.substring(0, truncateLength) + "...";
    }

    let text = `${label}: ${item.value}`;
    if (item.percentage) {
      text += ` (${item.percentage}%)`;
    }

    doc.text(text, x + 6, itemY);
    itemY += itemHeight; // Espacio entre elementos reducido
  });

  return y + estimatedHeight + 2; // Margen final reducido
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

    // Definir márgenes y áreas de trabajo
    const margins = {
      left: 10,
      right: 10,
      top: 14,
    };
    const pageWidth = doc.internal.pageSize.width;
    const workingWidth = pageWidth - margins.left - margins.right;

    // Configuración de colores
    const greenColor = [76, 175, 80]; // RGB
    const redColor = [244, 67, 54]; // RGB
    const blueColor = [33, 150, 243]; // RGB
    const neutralColor = [90, 90, 90]; // RGB

    // Establecer datos de la cabecera - TÍTULO MODIFICADO
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(
      "Informe Auditoría del Parque Informático General",
      margins.left,
      margins.top + 2
    );

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString()}`,
      margins.left,
      margins.top + 8
    );

    // Primera página - Resumen y estadísticas
    if (stats) {
      // Resumen del análisis - título ligeramente reposicionado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumen del análisis", margins.left, margins.top + 14);

      // ===== TARJETAS DE ESTADÍSTICAS =====
      // Calcular anchos óptimos para tres tarjetas en una fila
      const cardGap = 4; // Reducir espacio entre tarjetas
      const cardWidth = (workingWidth - 2 * cardGap) / 3;
      const cardHeight = 26; // Altura reducida
      const cardY = margins.top + 18;

      // Tarjeta 1: Total equipos
      drawStatCard(
        doc,
        margins.left, // x
        cardY, // y
        cardWidth, // width
        cardHeight, // height
        "Total equipos analizados", // title
        stats.totalProcessors.toString(), // value
        null, // subtitle
        neutralColor // colors
      );

      // Tarjeta 2: Equipos que cumplen
      drawStatCard(
        doc,
        margins.left + cardWidth + cardGap, // x
        cardY, // y
        cardWidth, // width
        cardHeight, // height
        "Equipos que cumplen requisitos", // title
        stats.meetingRequirements.toString(), // value
        `(${stats.complianceRate.toFixed(1)}%)`, // subtitle
        greenColor // colors
      );

      // Tarjeta 3: Equipos que no cumplen
      drawStatCard(
        doc,
        margins.left + 2 * (cardWidth + cardGap), // x
        cardY, // y
        cardWidth, // width
        cardHeight, // height
        "Equipos que NO cumplen requisitos", // title
        stats.notMeetingRequirements.toString(), // value
        `(${(100 - stats.complianceRate).toFixed(1)}%)`, // subtitle
        redColor // colors
      );

      // ===== SECCIÓN DISTRIBUCIÓN POR MARCA Y MOTIVOS DE INCUMPLIMIENTO =====
      // Posicionar estas secciones justo debajo de las tarjetas anteriores
      const sectionY = cardY + cardHeight + 6; // Reducido el espacio entre secciones
      const sectionWidth = (workingWidth - cardGap) / 2;

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

      // Dibujar secciones en columnas paralelas con fondos de tarjeta
      const leftSectionY = drawListSection(
        doc,
        margins.left,
        sectionY,
        sectionWidth,
        "Distribución por marca",
        brandItems
      );

      const rightSectionY = drawListSection(
        doc,
        margins.left + sectionWidth + cardGap,
        sectionY,
        sectionWidth,
        "Principales motivos de incumplimiento",
        failureItems
      );

      // Determinar posición Y para la próxima sección (la más baja de las dos)
      const nextSectionY = Math.max(leftSectionY, rightSectionY);

      // ===== SECCIÓN ESTADÍSTICAS DE RAM =====
      if (stats.ram && stats.ram.total > 0) {
        // Título de sección RAM
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Estadísticas de Memoria RAM", margins.left, nextSectionY + 4);

        // Cuadros de estadísticas de RAM - altura y espaciado reducidos
        const ramCardY = nextSectionY + 6;
        const ramCardWidth = (workingWidth - 2 * cardGap) / 3;
        const ramCardHeight = 26;

        // Card 1: Total equipos con RAM
        drawStatCard(
          doc,
          margins.left, // x
          ramCardY, // y
          ramCardWidth, // width
          ramCardHeight, // height
          "Equipos con RAM analizada", // title
          stats.ram.total.toString(), // value
          null, // subtitle
          blueColor // colors
        );

        // Card 2: Promedio RAM
        drawStatCard(
          doc,
          margins.left + ramCardWidth + cardGap, // x
          ramCardY, // y
          ramCardWidth, // width
          ramCardHeight, // height
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
            margins.left + 2 * (ramCardWidth + cardGap), // x
            ramCardY, // y
            ramCardWidth, // width
            ramCardHeight, // height
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

        // Dibujar distribución por capacidad - más compacto
        const ramDistY = ramCardY + ramCardHeight + 4;
        drawListSection(
          doc,
          margins.left,
          ramDistY,
          workingWidth,
          "Distribución por capacidad",
          ramDistItems
        );
      }

      // ===== SECCIÓN ESTADÍSTICAS DE ALMACENAMIENTO =====
      if (stats.storage && stats.storage.total > 0) {
        // Ajustar espacio vertical si hay sección RAM
        const storageY =
          nextSectionY + (stats.ram && stats.ram.total > 0 ? 70 : 0);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text("Estadísticas de Almacenamiento", margins.left, storageY + 4);

        // Preparar texto de almacenamiento promedio
        let avgStorageText = "";
        if (stats.storage.avgCapacity >= 1000) {
          avgStorageText = `${(stats.storage.avgCapacity / 1000).toFixed(
            1
          )} TB`;
        } else {
          avgStorageText = `${stats.storage.avgCapacity.toFixed(0)} GB`;
        }

        // Tarjetas de almacenamiento
        const storageCardY = storageY + 8;
        const storageCardWidth = (workingWidth - 2 * cardGap) / 3;
        const storageCardHeight = 26; // Altura reducida

        // Cuadro con total de equipos analizados
        drawStatCard(
          doc,
          margins.left, // x
          storageCardY, // y
          storageCardWidth, // width
          storageCardHeight, // height
          "Total equipos analizados", // title
          stats.storage.total.toString(), // value
          null, // subtitle
          blueColor // colors
        );

        // Cuadro con capacidad promedio
        drawStatCard(
          doc,
          margins.left + storageCardWidth + cardGap, // x
          storageCardY, // y
          storageCardWidth, // width
          storageCardHeight, // height
          "Promedio de capacidad", // title
          avgStorageText, // value
          null, // subtitle
          blueColor // colors
        );

        // Tercer cuadro para tipo más común
        // Encontrar el tipo más común
        const mostCommonType = Object.entries(stats.storage.byType).sort(
          (a, b) => b[1] - a[1]
        )[0];

        if (mostCommonType) {
          drawStatCard(
            doc,
            margins.left + 2 * (storageCardWidth + cardGap), // x
            storageCardY, // y
            storageCardWidth, // width
            storageCardHeight, // height
            "Tipo más común", // title
            mostCommonType[0], // value
            null, // subtitle
            blueColor // colors
          );
        }

        // Preparar datos para distribución por tipo
        const storageTypeItems = Object.entries(stats.storage.byType).map(
          ([type, count]) => ({
            label: type,
            value: count,
            percentage: ((count / stats.storage.total) * 100).toFixed(1),
          })
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

        // Colocar distribuciones de almacenamiento en dos columnas - reducir espacio vertical
        const storageDistY = storageCardY + storageCardHeight + 4;
        const storageDistWidth = (workingWidth - cardGap) / 2;

        // Dibujar distribución por tipo
        drawListSection(
          doc,
          margins.left,
          storageDistY,
          storageDistWidth,
          "Distribución por tipo",
          storageTypeItems
        );

        // Dibujar capacidades más comunes si hay datos
        if (storageCapacityItems.length > 0) {
          drawListSection(
            doc,
            margins.left + storageDistWidth + cardGap,
            storageDistY,
            storageDistWidth,
            "Principales capacidades",
            storageCapacityItems
          );
        }
      }
    } else {
      // Si no hay estadísticas, mostrar una nota
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "No se encontraron estadísticas para mostrar",
        margins.left,
        margins.top + 30
      );
    }

    // ===== PÁGINA DE TABLA DE DATOS =====
    doc.addPage();

    // Título para la tabla de datos
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalle de procesadores analizados", margins.left, margins.top);

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

      // Ajustar proporcionalmente para que la tabla se adapte a la página
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
        startY: margins.top + 5,
        head: [formattedHeaders],
        body: tableData.slice(0, 100),
        theme: "plain",
        headStyles: {
          fillColor: blueColor,
          textColor: [255, 255, 255],
          fontSize: 7, // Reducir tamaño de fuente
          fontStyle: "normal",
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          halign: "center",
          valign: "middle",
          minCellHeight: 6, // Reducir altura mínima
        },
        bodyStyles: {
          fontSize: 7, // Reducir aún más el tamaño en el cuerpo
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          fontStyle: "normal",
          minCellHeight: 5, // Muy compacto
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
              doc.setFontSize(7);
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
              doc.setFontSize(7);
              doc.text(
                "No",
                data.cell.x + 2,
                data.cell.y + data.cell.height / 2 + 1
              );
            }
            return true; // Señalar que hemos personalizado esta celda
          }
        },
        margin: {
          top: margins.top + 5,
          left: pageMargins.left,
          right: pageMargins.right,
        },
        tableWidth: "auto",
        showHead: "everyPage",
        didDrawPage: function (data) {
          // Agregar nota de pie
          const currentDate = new Date().toLocaleString();
          doc.setFontSize(6.5); // Reducir tamaño de fuente del pie de página
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
            margins.left,
            doc.internal.pageSize.height - 4
          );
        },
      });
    } else {
      // Fallback: Crear una tabla básica sin autoTable
      let startY = margins.top + 8;
      const rowHeight = 6; // Altura reducida para más filas por página
      const headerRowHeight = 8;
      const fontSize = 6.5;
      const headerFontSize = 7;

      // Ajustar márgenes para maximizar espacio
      const leftMargin = 5;
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
      const maxRowsPerPage = Math.floor((pageHeight - startY - 8) / rowHeight);

      // Mostrar datos en páginas
      for (let i = 0; i < Math.min(data.length, 100); i++) {
        // Verificar si necesitamos una nueva página
        if (i > 0 && i % maxRowsPerPage === 0) {
          doc.addPage();
          startY = margins.top + 6;

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

            // Calcular posiciones antes de pasar a la función
            const currentX = colX;
            const currentY = startY;

            // Función para dibujar líneas de encabezado con variables capturadas por valor
            const drawHeaderLines = (lines, x, width, y, rowHeight) => {
              lines.forEach((line, lineIndex) => {
                const lineCount = lines.length;
                const lineHeight = rowHeight / (lineCount + 0.5);
                const yPos = y + 3 + lineIndex * lineHeight;
                doc.text(line, x + width / 2, yPos, { align: "center" });
              });
            };

            // Llamar a la función con los valores actuales
            drawHeaderLines(
              headerLines,
              currentX,
              width,
              currentY,
              headerRowHeight
            );

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
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
        leftMargin,
        pageHeight - 4
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
      doc.text("Informe Auditoría del Parque Informático General", 20, 20);

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

    // Definir márgenes y áreas de trabajo
    const margins = {
      left: 14,
      right: 14,
      top: 20,
    };
    const pageWidth = doc.internal.pageSize.width;
    const workingWidth = pageWidth - margins.left - margins.right;

    // Configuración de estilos
    const titleFont = { size: 20, style: "bold" };
    const subtitleFont = { size: 14, style: "bold" };
    const normalFont = { size: 11, style: "normal" };

    // Colores
    const primaryColor = [41, 98, 255]; // RGB azul
    const blueColor = [33, 150, 243]; // RGB azul para tablas

    // Portada
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 20, doc.internal.pageSize.height, "F");

    doc.setFont("helvetica", titleFont.style);
    doc.setFontSize(titleFont.size);
    doc.setTextColor(0, 0, 0);
    doc.text("Informe Auditoría del", 30, 40);
    doc.text("Parque Informático General", 30, 50);

    doc.setFont("helvetica", normalFont.style);
    doc.setFontSize(normalFont.size);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 30, 70);
    doc.text(`Total de equipos analizados: ${stats.totalProcessors}`, 30, 80);
    doc.text(
      `Tasa de cumplimiento: ${stats.complianceRate.toFixed(1)}%`,
      30,
      90
    );

    // Primera página - Resumen ejecutivo
    doc.addPage();

    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Resumen Ejecutivo", margins.left, margins.top);

    doc.setFont("helvetica", normalFont.style);
    doc.setFontSize(normalFont.size);
    doc.text(
      "Este informe presenta los resultados del análisis realizado sobre el parque",
      margins.left,
      margins.top + 12
    );
    doc.text(
      "informático para determinar el cumplimiento de los requisitos mínimos de hardware.",
      margins.left,
      margins.top + 20
    );

    // Cuadro resumen - Convertido a tarjeta (altura reducida)
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(
      margins.left,
      margins.top + 25,
      workingWidth,
      45,
      3,
      3,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.text("Resultados clave:", margins.left + 5, margins.top + 35);

    doc.setFont("helvetica", "normal");
    doc.text(
      `• Total de equipos analizados: ${stats.totalProcessors}`,
      margins.left + 5,
      margins.top + 45
    );
    doc.text(
      `• Equipos que cumplen requisitos: ${
        stats.meetingRequirements
      } (${stats.complianceRate.toFixed(1)}%)`,
      margins.left + 5,
      margins.top + 55
    );
    doc.text(
      `• Equipos que no cumplen: ${stats.notMeetingRequirements} (${(
        100 - stats.complianceRate
      ).toFixed(1)}%)`,
      margins.left + 5,
      margins.top + 65
    );

    // Principales hallazgos
    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Principales Hallazgos", margins.left, margins.top + 85);

    // Crear tarjetas para distribución por marca y motivos de incumplimiento
    const cardGap = 8;
    const cardWidth = (workingWidth - cardGap) / 2;

    doc.setFillColor(240, 240, 245);
    doc.roundedRect(margins.left, margins.top + 90, cardWidth, 55, 3, 3, "F");
    doc.roundedRect(
      margins.left + cardWidth + cardGap,
      margins.top + 90,
      cardWidth,
      55,
      3,
      3,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text("Distribución por marca", margins.left + 5, margins.top + 100);
    doc.text(
      "Principales motivos de incumplimiento",
      margins.left + cardWidth + cardGap + 5,
      margins.top + 100
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    // Crear resumen de marcas
    let brandY = margins.top + 110;
    Object.entries(stats.brandDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([brand, count]) => {
        const percentage = ((count / stats.totalProcessors) * 100).toFixed(1);
        doc.text(
          `${brand}: ${count} (${percentage}%)`,
          margins.left + 8,
          brandY
        );
        brandY += 7;
      });

    // Principales motivos de fallo
    let failureY = margins.top + 110;
    Object.entries(stats.failureReasons || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .forEach((reason, index) => {
        const percentage = (
          (reason[1] / stats.notMeetingRequirements) *
          100
        ).toFixed(1);

        // Truncar razones demasiado largas
        let displayReason = reason[0];
        if (displayReason.length > 30) {
          displayReason = displayReason.substring(0, 27) + "...";
        }

        doc.text(
          `${index + 1}. ${displayReason}: ${reason[1]} (${percentage}%)`,
          margins.left + cardWidth + cardGap + 8,
          failureY
        );
        failureY += 7;
      });

    // Recomendaciones
    doc.addPage();

    doc.setFont("helvetica", subtitleFont.style);
    doc.setFontSize(subtitleFont.size);
    doc.text("Recomendaciones", margins.left, margins.top);

    // Tarjeta para recomendaciones (altura ajustada)
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(
      margins.left,
      margins.top + 10,
      workingWidth,
      85,
      3,
      3,
      "F"
    );

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

    doc.text(recommendationText.join("\n"), margins.left + 5, margins.top + 20);

    // Agregar tabla de procesadores analizados con las mismas mejoras que en exportToPDF
    doc.addPage();

    // Título para la tabla
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Detalle de Procesadores Analizados", margins.left, margins.top);

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
      // Ajustar proporcionalmente para que la tabla se adapte a la página
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
        startY: margins.top + 5,
        head: [formattedHeaders],
        body: tableData.slice(0, 100),
        theme: "plain",
        headStyles: {
          fillColor: blueColor,
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: "normal",
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          halign: "center",
          valign: "middle",
          minCellHeight: 6,
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          fontStyle: "normal",
          minCellHeight: 5,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: columnStyles,
        margin: {
          top: margins.top + 5,
          left: pageMargins.left,
          right: pageMargins.right,
        },
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
              doc.setFontSize(7);
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
              doc.setFontSize(7);
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
            margins.left,
            doc.internal.pageSize.height - 5
          );
        },
      });
    } else {
      // Implementación básica de tabla sin autoTable
      doc.setFontSize(10);
      doc.text(
        "No se puede mostrar la tabla detallada. Use la exportación a Excel.",
        margins.left,
        margins.top + 10
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
