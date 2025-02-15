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
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, 
              s.fecha_salida, p.unidad, s.rumpero, s.trabajador, s.cantidad
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE DATE(s.fecha_salida) = $1
       ORDER BY s.nivel, m.nombre, s.fecha_salida DESC`,
      [fechaHoy]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay salidas registradas hoy" });
    }

    // Crear contenido del QR con formato de tabla
    let qrData = `Reporte de Salidas - ${fechaHoy}\n\n`;

    // Encabezados
    qrData += `Código | Material | Producto | Unidad | Nivel | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
    qrData += `----------------------------------------------------------------------------------------------\n`;

    // Filas con los datos de la tabla
    salidas.forEach((s) => {
      qrData += `${s.codigo} | ${s.material} | ${s.producto} | ${s.unidad} | ${
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

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_${fechaHoy}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Ruta del logo
    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");

    // Agregar el logo
    const logoSize = 80;
    doc.image(logoPath, doc.page.margins.left, 30, {
      width: logoSize,
      height: logoSize,
    });

    // Encabezado con título
    doc.text(
      "EMPRESA MINERA HUANUNI\nASISTENCIA SUPERINTENDENCIA MINA",
      0,
      45,
      {
        align: "center",
        width: doc.page.width,
      }
    );

    doc.moveDown(0.5);

    // Dibujar una línea horizontal
    doc
      .moveTo(doc.page.margins.left + logoSize + 10, doc.y)
      .lineTo(500, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Texto del reporte
    doc.fontSize(12).text(`Reporte de Salidas - ${fechaHoy}`, 0, doc.y, {
      align: "center",
      width: doc.page.width,
    });

    doc.moveDown(1);

    const qrSize = 80;
    doc.image(qrImage, doc.page.width - doc.page.margins.right - qrSize, 30, {
      width: qrSize,
      height: qrSize,
    });
    doc.moveDown(2);

    // Configuración de la tabla
    const tableTop = doc.y;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Definir proporciones de las columnas
    const columnProportions = [7, 12, 12, 13, 8, 8, 12, 12, 10, 11];
    const columnWidths = columnProportions.map((proportion) =>
      Math.floor((pageWidth * proportion) / 100)
    );

    const headers = [
      "Código",
      "Nivel",
      "Material",
      "Producto",
      "Unidad",
      "Cantidad",
      "Responsable",
      "Rumpero",
      "Trabajador",
      "Fecha",
    ];
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
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    let yPosition = doc.y + 10;
    const rowHeight = 30;
    salidas.forEach((s, index) => {
      // Comprobar si se alcanzó el final de la página
      if (yPosition + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); // Agregar nueva página
        yPosition = doc.y; // Resetear la posición
      }

      doc.fontSize(8);

      const writeCell = (text, x, width) => {
        doc.text(text || "-", x, yPosition, {
          width: width,
          height: rowHeight,
          ellipsis: true,
        });
      };
      writeCell(s.codigo, getXPosition(0), columnWidths[0]);
      writeCell(s.nivel, getXPosition(1), columnWidths[1]);
      writeCell(s.material, getXPosition(2), columnWidths[2]);
      writeCell(s.producto, getXPosition(3), columnWidths[3]);
      writeCell(s.unidad, getXPosition(4), columnWidths[4]);
      writeCell(s.cantidad.toString(), getXPosition(5), columnWidths[5]);
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

    // Agregar código QR al PDF

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte" });
  }
};
const generateMonthlyReport = async (req, res) => {
  try {
    const yearMonth = req.params.yearMonth;

    // Validar formato YYYY-MM
    if (!moment(yearMonth, "YYYY-MM", true).isValid()) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Use YYYY-MM (ejemplo: 2022-01)",
      });
    }

    const [year, month] = yearMonth.split("-");

    // Consulta las salidas del mes con nuevo orden
    const result = await db.query(
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, 
              s.fecha_salida, p.unidad, s.rumpero, s.trabajador, s.cantidad
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE TO_CHAR(s.fecha_salida, 'YYYY-MM') = $1
       ORDER BY s.nivel, m.nombre DESC`,
      [yearMonth]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el mes ${month} del año ${year}`,
      });
    }

    // Crear contenido del QR con formato de tabla
    let qrData = `Reporte Mensual de Salidas - ${yearMonth}\n\n`;

    // Encabezados
    qrData += `Código | Material | Producto | Unidad | Nivel | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
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

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_mensual_${yearMonth}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Ruta del logo
    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");

    // Agregar el logo
    const logoSize = 80;
    doc.image(logoPath, doc.page.margins.left, 30, {
      width: logoSize,
      height: logoSize,
    });

    // Encabezado con título
    doc.text(
      "EMPRESA MINERA HUANUNI\nASISTENCIA SUPERINTENDENCIA MINA",
      0,
      45,
      {
        align: "center",
        width: doc.page.width,
      }
    );

    doc.moveDown(0.5);

    // Dibujar una línea horizontal
    doc
      .moveTo(doc.page.margins.left + logoSize + 10, doc.y)
      .lineTo(500, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Texto del reporte con mes y año
    const monthName = moment(yearMonth).locale("es").format("MMMM");
    const capitalizedMonthName =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    doc
      .fontSize(12)
      .text(
        `Reporte Mensual de Salidas - ${capitalizedMonthName} ${year}`,
        0,
        doc.y,
        {
          align: "center",
          width: doc.page.width,
        }
      );

    // **Agregar espacio antes del QR**
    doc.moveDown(1); // Ajusta este valor si el QR se sobrepone al contenido

    // Agregar código QR al PDF
    const qrSize = 80;
    doc.image(qrImage, doc.page.width - doc.page.margins.right - qrSize, 30, {
      width: qrSize,
      height: qrSize,
    });

    doc.moveDown(2); // Mueve hacia abajo antes de comenzar la tabla

    // Configuración de la tabla
    const tableTop = doc.y;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Definir proporciones de las columnas
    const columnProportions = [7, 12, 12, 13, 8, 8, 12, 12, 10, 11];
    const columnWidths = columnProportions.map((proportion) =>
      Math.floor((pageWidth * proportion) / 100)
    );

    const headers = [
      "Código",
      "Nivel",
      "Material",
      "Producto",
      "Unidad",
      "Cantidad",
      "Responsable",
      "Rumpero",
      "Trabajador",
      "Fecha",
    ];
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
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    let yPosition = doc.y + 10;
    const rowHeight = 30;
    salidas.forEach((s, index) => {
      // Comprobar si se alcanzó el final de la página
      if (yPosition + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); // Agregar nueva página
        yPosition = doc.y; // Resetear la posición
      }

      doc.fontSize(8);

      const writeCell = (text, x, width) => {
        doc.text(text || "-", x, yPosition, {
          width: width,
          height: rowHeight,
          ellipsis: true,
        });
      };

      writeCell(s.codigo, getXPosition(0), columnWidths[0]);
      writeCell(s.nivel, getXPosition(1), columnWidths[1]);
      writeCell(s.material, getXPosition(2), columnWidths[2]);
      writeCell(s.producto, getXPosition(3), columnWidths[3]);
      writeCell(s.unidad, getXPosition(4), columnWidths[4]);
      writeCell(s.cantidad.toString(), getXPosition(5), columnWidths[5]);
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

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte mensual" });
  }
};

const generateMonthlyReportTotal = async (req, res) => {
  try {
    const yearMonth = req.params.yearMonth;

    if (!moment(yearMonth, "YYYY-MM", true).isValid()) {
      return res
        .status(400)
        .json({ message: "Formato de fecha inválido. Use YYYY-MM" });
    }

    const [year, month] = yearMonth.split("-");

    // Consultar las salidas agrupadas por material, nivel, producto y unidad con totales
    const result = await db.query(
      `SELECT 
          s.nivel, 
          m.nombre AS material, 
          p.nombre AS producto, 
          p.unidad, 
          SUM(s.cantidad) AS total_cantidad
      FROM salidas s 
      JOIN materiales m ON s.material_id = m.id 
      JOIN productos p ON s.producto_id = p.id  
      WHERE TO_CHAR(s.fecha_salida, 'YYYY-MM') = $1
      GROUP BY s.nivel, m.nombre, p.nombre, p.unidad  
      ORDER BY s.nivel, m.nombre DESC;`,
      [yearMonth]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el mes ${month} del año ${year}`,
      });
    }

    // Crear contenido del QR con formato de tabla
    let qrData = `Reporte Mensual de Salidas - ${yearMonth}\n\n`;

    // Encabezados
    qrData += `Nivel | Material | Producto | Unidad | Total Cantidad\n`;
    qrData += `-----------------------------------------------------------\n`;

    // Filas con los datos de la tabla
    salidas.forEach((s) => {
      qrData += `${s.nivel} | ${s.material} | ${s.producto} | ${s.unidad} | ${s.total_cantidad}\n`;
    });

    // Generar código QR
    const qrImage = await QRCode.toDataURL(qrData);

    // Crear el PDF
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 50, left: 40, right: 40 },
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_mensual_${yearMonth}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    // Agregar logo y encabezado
    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
    const logoSize = 80;
    doc.image(logoPath, doc.page.margins.left, 30, {
      width: logoSize,
      height: logoSize,
    });
    doc.text(
      "EMPRESA MINERA HUANUNI\nASISTENCIA SUPERINTENDENCIA MINA",
      0,
      45,
      {
        align: "center",
        width: doc.page.width,
      }
    );

    doc.moveDown(0.5);
    doc
      .moveTo(doc.page.margins.left + logoSize + 10, doc.y)
      .lineTo(500, doc.y)
      .stroke();

    doc.moveDown(0.5);
    const monthName = moment(yearMonth).locale("es").format("MMMM");
    const capitalizedMonthName =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    doc
      .fontSize(12)
      .text(
        `Reporte Mensual de Salidas Totales - ${capitalizedMonthName} ${year}`,
        0,
        doc.y,
        {
          align: "center",
          width: doc.page.width,
        }
      );

    // Agregar código QR al PDF
    doc.moveDown(1);
    const qrSize = 80;
    doc.image(qrImage, doc.page.width - doc.page.margins.right - qrSize, 30, {
      width: qrSize,
      height: qrSize,
    });
    doc.moveDown(2);

    // Configuración de la tabla
    const tableTop = doc.y;
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnProportions = [20, 25, 25, 15, 15]; // Nivel, Material, Producto, Unidad, Total Cantidad
    const columnWidths = columnProportions.map((proportion) =>
      Math.floor((pageWidth * proportion) / 100)
    );

    const headers = [
      "Nivel",
      "Material",
      "Producto",
      "Unidad",
      "Total Cantidad",
    ];
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
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    let yPosition = doc.y + 10;
    const rowHeight = 30;
    salidas.forEach((s, index) => {
      // Comprobar si se alcanzó el final de la página
      if (yPosition + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage(); // Agregar nueva página
        yPosition = doc.y; // Resetear la posición
      }

      doc.fontSize(8);

      const writeCell = (text, x, width) => {
        doc.text(text || "-", x, yPosition, {
          width: width,
          height: rowHeight,
          ellipsis: true,
        });
      };

      writeCell(s.nivel, getXPosition(0), columnWidths[0]);
      writeCell(s.material, getXPosition(1), columnWidths[1]);
      writeCell(s.producto, getXPosition(2), columnWidths[2]);
      writeCell(s.unidad, getXPosition(3), columnWidths[3]);
      writeCell(s.total_cantidad.toString(), getXPosition(4), columnWidths[4]);

      yPosition += rowHeight;
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte mensual" });
  }
};

module.exports = {
  generateReport,
  generateMonthlyReport,
  generateMonthlyReportTotal,
};
