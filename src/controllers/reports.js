const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const moment = require("moment");
const db = require("../db");

const generateReport = async (req, res) => {
  try {
    const fechaHoy = moment().format("YYYY-MM-DD");

    // Consulta las salidas del día
    const result = await db.query(
      `SELECT s.id, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, s.fecha_salida, 
                    p.unidad, s.rumpero, s.trabajador, s.cantidad
            FROM salidas s 
            JOIN materiales m ON s.material_id = m.id 
            JOIN productos p ON s.producto_id = p.id
            WHERE DATE(s.fecha_salida) = $1`,
      [fechaHoy]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay salidas registradas hoy" });
    }

    // Crear contenido del QR
    let qrData = `Reporte del ${fechaHoy}\n`;
    salidas.forEach((s) => {
      qrData += `ID: ${s.id}, Material: ${s.material}, Producto: ${
        s.producto
      }, Responsable: ${s.responsable_nombre}, 
                    Rumpero: ${s.rumpero || "-"}, Trabajador: ${
        s.trabajador || "-"
      }, Cantidad: ${s.cantidad}\n`;
    });

    // Generar código QR
    const qrImage = await QRCode.toDataURL(qrData);

    // Crear el PDF
    const doc = new PDFDocument({
      margins: {
        top: 50,
        bottom: 50,
        left: 40,
        right: 40,
      },
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_${fechaHoy}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Encabezado
    doc
      .fontSize(14)
      .text(`Reporte de Salidas - ${fechaHoy}`, { align: "center" });
    doc.moveDown(1);

    // Configurar tabla de salidas
    const tableTop = doc.y + 60;

    // Calcular el ancho disponible de la página
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Definir proporciones relativas para cada columna (total debe sumar 100)
    const columnProportions = [
      5, // ID (más estrecho)
      12, // Material
      12, // Producto
      8, // Unidad
      8, // Nivel
      8, // Cantidad
      12, // Responsable
      12, // Rumpero
      12, // Trabajador
      11, // Fecha
    ];

    // Calcular anchos reales basados en las proporciones
    const columnWidths = columnProportions.map((proportion) =>
      Math.floor((pageWidth * proportion) / 100)
    );

    const headers = [
      "ID",
      "Material",
      "Producto",
      "Unidad",
      "Nivel",
      "Cantidad",
      "Responsable",
      "Rumpero",
      "Trabajador",
      "Fecha",
    ];
    const headerColor = "#0066cc";

    // Función helper para calcular la posición X de cada columna
    const getXPosition = (index) => {
      let x = doc.page.margins.left;
      for (let i = 0; i < index; i++) {
        x += columnWidths[i];
      }
      return x;
    };

    // Agregar encabezados de la tabla
    headers.forEach((header, i) => {
      doc
        .fillColor(headerColor)
        .fontSize(8)
        .text(header, getXPosition(i), tableTop, {
          width: columnWidths[i],
          align: "left",
        });
    });

    doc.fillColor("black");
    doc.moveDown(0.5);

    // Dibujar línea después del encabezado
    const lineStart = doc.page.margins.left;
    const lineEnd = doc.page.width - doc.page.margins.right;
    doc.moveTo(lineStart, doc.y).lineTo(lineEnd, doc.y).stroke();

    // Agregar filas de la tabla
    let yPosition = doc.y + 10;

    salidas.forEach((s) => {
      doc.fontSize(8);
      const rowHeight = 20; // Altura fija para cada fila

      // Función helper para escribir texto en una celda con ellipsis si es necesario
      const writeCell = (text, x, width) => {
        doc.text(text || "-", x, yPosition, {
          width: width,
          height: rowHeight,
          ellipsis: true,
        });
      };

      writeCell(s.id.toString(), getXPosition(0), columnWidths[0]);
      writeCell(s.material, getXPosition(1), columnWidths[1]);
      writeCell(s.producto, getXPosition(2), columnWidths[2]);
      writeCell(s.unidad, getXPosition(3), columnWidths[3]);
      writeCell(s.nivel, getXPosition(4), columnWidths[4]);
      writeCell(s.cantidad, getXPosition(5), columnWidths[5]);
      writeCell(s.responsable_nombre, getXPosition(6), columnWidths[6]);
      writeCell(s.rumpero, getXPosition(7), columnWidths[7]);
      writeCell(s.trabajador, getXPosition(8), columnWidths[8]);
      writeCell(
        moment(s.fecha_salida).format("DD/MM/YYYY HH:mm"),
        getXPosition(9),
        columnWidths[9]
      );

      yPosition += rowHeight;
    });

    // Agregar QR al PDF
    const qrSize = 80;
    doc.image(
      qrImage,
      doc.page.width - doc.page.margins.right - qrSize,
      doc.page.margins.top,
      {
        width: qrSize,
        height: qrSize,
      }
    );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte" });
  }
};

module.exports = { generateReport };
