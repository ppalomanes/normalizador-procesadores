// utils/pdfExporter.js
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Genera un reporte PDF con los datos normalizados
 * @param {Array} data - Datos normalizados
 * @param {Object} stats - Estadísticas calculadas
 * @param {String} filename - Nombre del archivo (opcional)
 */
export const exportToPDF = (
  data,
  stats,
  filename = "Reporte_Procesadores.pdf"
) => {
  if (!data || !stats) return;

  // Crear un nuevo documento PDF
  const doc = new jsPDF("landscape");

  // Configuración de colores
  const greenColor = [76, 175, 80]; // RGB
  const redColor = [244, 67, 54]; // RGB
  const blueColor = [33, 150, 243]; // RGB

  // Establecer datos de la cabecera
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text("Informe de Auditoría de Procesadores", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

  // Resumen de datos
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Resumen del análisis", 14, 40);

  // Cuadros de estadísticas
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, 45, 80, 25, 3, 3, "F");
  doc.roundedRect(100, 45, 80, 25, 3, 3, "F");
  doc.roundedRect(186, 45, 80, 25, 3, 3, "F");

  // Títulos y valores de estadísticas
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Total de equipos analizados", 19, 53);
  doc.text("Equipos que cumplen requisitos", 105, 53);
  doc.text("Equipos que NO cumplen requisitos", 191, 53);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(stats.totalProcessors.toString(), 19, 65);

  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.text(stats.meetingRequirements.toString(), 105, 65);
  doc.setFontSize(12);
  doc.text(`(${stats.complianceRate.toFixed(1)}%)`, 125, 65);

  doc.setFontSize(18);
  doc.setTextColor(redColor[0], redColor[1], redColor[2]);
  doc.text(stats.notMeetingRequirements.toString(), 191, 65);
  doc.setFontSize(12);
  doc.text(`(${(100 - stats.complianceRate).toFixed(1)}%)`, 211, 65);

  // Gráficos de distribución
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Distribución por marca", 14, 85);

  // Crear tabla de distribución por marca
  const brandTableData = Object.entries(stats.brandDistribution).map(
    ([brand, count]) => [
      brand,
      count,
      `${((count / stats.totalProcessors) * 100).toFixed(1)}%`,
    ]
  );

  doc.autoTable({
    startY: 90,
    head: [["Marca", "Cantidad", "Porcentaje"]],
    body: brandTableData,
    theme: "striped",
    headStyles: { fillColor: blueColor },
    margin: { left: 14 },
    width: 100,
  });

  // Título para la sección de incumplimientos
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Principales motivos de incumplimiento", 150, 85);

  // Tabla de motivos de incumplimiento
  const failureTableData = Object.entries(stats.failureReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => [
      reason.length > 40 ? reason.substring(0, 40) + "..." : reason,
      count,
      `${((count / stats.notMeetingRequirements) * 100).toFixed(1)}%`,
    ]);

  doc.autoTable({
    startY: 90,
    head: [["Motivo", "Cantidad", "Porcentaje"]],
    body: failureTableData,
    theme: "striped",
    headStyles: { fillColor: redColor },
    margin: { left: 150 },
  });

  // Nueva página para los datos
  doc.addPage();

  // Título para la tabla de datos
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Detalle de procesadores analizados", 14, 20);

  // Seleccionar las columnas más relevantes
  const columns = [
    "Hostname",
    "Procesador (marca, modelo y velocidad)",
    "Procesador Normalizado",
    "Marca Procesador",
    "Modelo Procesador",
    "Generación",
    "Velocidad",
    "Cumple Requisitos",
  ];

  // Filtrar las columnas disponibles en los datos
  const availableColumns = columns.filter(
    (col) => data.length > 0 && Object.keys(data[0]).includes(col)
  );

  // Obtener los datos para la tabla
  const tableData = data.map((row) =>
    availableColumns.map((col) => row[col] || "")
  );

  // Crear tabla con datos (limitada a 100 filas para evitar PDFs muy grandes)
  doc.autoTable({
    startY: 25,
    head: [availableColumns],
    body: tableData.slice(0, 100),
    theme: "striped",
    headStyles: { fillColor: blueColor },
    didDrawCell: (data) => {
      // Dar color a las celdas según cumplimiento
      if (
        data.section === "body" &&
        availableColumns[data.column.index] === "Cumple Requisitos"
      ) {
        if (data.cell.raw === "Sí") {
          doc.setFillColor(200, 250, 200); // Verde claro
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );
          doc.setTextColor(0, 100, 0);
          doc.text("Sí", data.cell.x + 5, data.cell.y + 10);
        } else if (data.cell.raw === "No") {
          doc.setFillColor(250, 200, 200); // Rojo claro
          doc.rect(
            data.cell.x,
            data.cell.y,
            data.cell.width,
            data.cell.height,
            "F"
          );
          doc.setTextColor(150, 0, 0);
          doc.text("No", data.cell.x + 5, data.cell.y + 10);
        }
        return true; // Señalar que hemos personalizado esta celda
      }
    },
    margin: { top: 25 },
  });

  // Agregar nota de pie
  const currentDate = new Date().toLocaleString();
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Reporte generado el ${currentDate}. Se muestran hasta 100 equipos.`,
    14,
    doc.internal.pageSize.height - 10
  );

  // Guardar el PDF
  doc.save(filename);
};

/**
 * Genera un reporte completo con estadísticas y recomendaciones
 * @param {Array} data - Datos normalizados
 * @param {Object} stats - Estadísticas calculadas
 * @param {String} filename - Nombre del archivo (opcional)
 */
export const exportDetailedReport = (
  data,
  stats,
  filename = "Reporte_Detallado.pdf"
) => {
  if (!data || !stats) return;

  // Crear un nuevo documento PDF
  const doc = new jsPDF();

  // Configuración de estilos
  const titleFont = { size: 22, style: "bold" };
  const subtitleFont = { size: 16, style: "bold" };
  const normalFont = { size: 12, style: "normal" };
  const smallFont = { size: 10, style: "normal" };

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
  doc.text(`Tasa de cumplimiento: ${stats.complianceRate.toFixed(1)}%`, 40, 95);

  // Agregar una imagen (logo o gráfico)
  // doc.addImage(logoDataUrl, 'PNG', 120, 20, 70, 70);

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

  // Cuadro resumen
  doc.setFillColor(245, 245, 245);
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

  doc.setFont("helvetica", normalFont.style);
  doc.setFontSize(normalFont.size);

  // Crear resumen de marcas
  const brandSummary = Object.entries(stats.brandDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([brand, count]) =>
        `${brand}: ${count} equipos (${(
          (count / stats.totalProcessors) *
          100
        ).toFixed(1)}%)`
    )
    .join("\n");

  doc.text("Distribución por marca:", 14, 145);
  doc.text(brandSummary, 20, 155);

  // Principales motivos de fallo
  const yStart = 155 + Object.keys(stats.brandDistribution).length * 10;

  doc.text("Principales motivos de incumplimiento:", 14, yStart);

  const failureReasons = Object.entries(stats.failureReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  failureReasons.forEach((reason, index) => {
    doc.text(
      `${index + 1}. ${reason[0]}: ${reason[1]} equipos`,
      20,
      yStart + 15 + index * 10
    );
  });

  // Recomendaciones
  doc.addPage();

  doc.setFont("helvetica", subtitleFont.style);
  doc.setFontSize(subtitleFont.size);
  doc.text("Recomendaciones", 14, 20);

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
  data
    .filter((row) => row["Cumple Requisitos"] === "No")
    .forEach((row) => {
      const processor = row["Procesador Normalizado"];
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

  doc.text(recommendationText.join("\n"), 14, 40);

  // Guardar PDF
  doc.save(filename);
};
