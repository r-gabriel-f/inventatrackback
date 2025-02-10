const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const moment = require("moment");
const db = require("../db");
const path = require("path");

const generateReport = async (req, res) => {
  try {
    const fechaHoy = moment().format("YYYY-MM-DD");

    // Consulta las salidas del día
    const result = await db.query(
      `SELECT s.id, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, 
              s.fecha_salida, p.unidad, s.rumpero, s.trabajador, s.cantidad
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE DATE(s.fecha_salida) = $1`,
      [fechaHoy]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res.status(404).json({ message: "No hay salidas registradas hoy" });
    }

    // Crear contenido del QR con formato de tabla
    let qrData = `Reporte de Salidas - ${fechaHoy}\n\n`;

    // Encabezados
    qrData += `ID | Material | Producto | Unidad | Nivel | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
    qrData += `-------------------------------------------------------------------------------------------\n`;

    // Filas con los datos de la tabla
    salidas.forEach((s) => {
      qrData += `${s.id} | ${s.material} | ${s.producto} | ${s.unidad} | ${
        s.nivel
      } | ${s.cantidad} | ${s.responsable_nombre} | ${s.rumpero || "-"} | ${
        s.trabajador || "-"
      } | ${moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")}\n`;
    });

    // Generar código QR
    const qrImage = await QRCode.toDataURL(qrData);

    // Crear el PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
    });

    res.setHeader("Content-Disposition", `attachment; filename=reporte_${fechaHoy}.pdf`);
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Ruta del logo
    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");

    // Agregar el logo
    const logoSize = 80;
    doc.image(logoPath, doc.page.margins.left, 30, { width: logoSize, height: logoSize });

    // Encabezado con título
    doc.text("EMPRESA MINERA HUANUNI\nASISTENTE SUPERINTENDENCIA MINA", 0, 45, {
      align: "center",
      width: doc.page.width,
    });

    doc.moveDown(0.5);

    // Dibujar una línea horizontal
    doc.moveTo(doc.page.margins.left + logoSize + 10, doc.y).lineTo(500, doc.y).stroke();

    doc.moveDown(0.5);

    // Texto del reporte
    doc.fontSize(12).text(`Reporte de Salidas - ${fechaHoy}`, 0, doc.y, {
      align: "center",
      width: doc.page.width,
    });

    doc.moveDown(2);

    // Configuración de la tabla
    const tableTop = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Definir proporciones de las columnas
    const columnProportions = [5, 12, 12, 8, 8, 8, 12, 12, 12, 11];
    const columnWidths = columnProportions.map((proportion) => Math.floor((pageWidth * proportion) / 100));

    const headers = ["ID", "Material", "Producto", "Unidad", "Nivel", "Cantidad", "Responsable", "Rumpero", "Trabajador", "Fecha"];
    const headerColor = "#0066cc";

    const getXPosition = (index) => {
      let x = doc.page.margins.left;
      for (let i = 0; i < index; i++) {
        x += columnWidths[i];
      }
      return x;
    };

    // Agregar encabezados de la tabla
    headers.forEach((header, i) => {
      doc.fillColor(headerColor).fontSize(8).text(header, getXPosition(i), tableTop, {
        width: columnWidths[i],
        align: "left",
      });
    });

    doc.fillColor("black");
    doc.moveDown(0.5);

    // Dibujar línea después del encabezado
    doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

    let yPosition = doc.y + 10;
    salidas.forEach((s) => {
      doc.fontSize(8);
      const rowHeight = 20;

      const writeCell = (text, x, width) => {
        doc.text(text || "-", x, yPosition, { width: width, height: rowHeight, ellipsis: true });
      };

      writeCell(s.id.toString(), getXPosition(0), columnWidths[0]);
      writeCell(s.material, getXPosition(1), columnWidths[1]);
      writeCell(s.producto, getXPosition(2), columnWidths[2]);
      writeCell(s.unidad, getXPosition(3), columnWidths[3]);
      writeCell(s.nivel, getXPosition(4), columnWidths[4]);
      writeCell(s.cantidad.toString(), getXPosition(5), columnWidths[5]);
      writeCell(s.responsable_nombre, getXPosition(6), columnWidths[6]);
      writeCell(s.rumpero, getXPosition(7), columnWidths[7]);
      writeCell(s.trabajador, getXPosition(8), columnWidths[8]);
      writeCell(moment(s.fecha_salida).format("DD/MM/YYYY HH:mm"), getXPosition(9), columnWidths[9]);

      yPosition += rowHeight;
    });

    // Agregar código QR al PDF
    const qrSize = 80;
    doc.image(qrImage, doc.page.width - doc.page.margins.right - qrSize, 30, {
      width: qrSize,
      height: qrSize,
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte" });
  }
};

module.exports = { generateReport };
