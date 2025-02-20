const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const QRCode = require("qrcode");
const moment = require("moment");
const db = require("../db");
const path = require("path");
const fs = require('fs');

const generateReport = async (req, res) => {
  try {
    const fechaHoy = moment().format("YYYY-MM-DD");

    const result = await db.query(
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, s.nivel, 
              s.responsable_nombre, s.fecha_salida, p.unidad, s.rumpero, 
              s.trabajador, s.cantidad
       FROM salidas s
       JOIN materiales m ON s.material_id = m.id
       JOIN productos p ON s.producto_id = p.id
       WHERE DATE(s.fecha_salida) = DATE(?)
       AND m.status = 1
       AND s.status = 1
       ORDER BY s.nivel, m.nombre, s.fecha_salida DESC`,
      [fechaHoy]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay salidas registradas hoy" });
    }

        let qrData = `Reporte de Salidas - ${fechaHoy}\n\n`;
        qrData += `Código | Material | Producto | Unidad | Nivel | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
        qrData += `----------------------------------------------------------------------------------------------\n`;

        salidas.forEach((s) => {
          qrData += `${s.codigo} | ${s.material} | ${s.producto} | ${s.unidad} | ${
            s.nivel
          } | ${s.cantidad} | ${s.responsable_nombre} | ${s.rumpero || "-"} | ${
            s.trabajador || "-"
          } | ${moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")}\n`;
        });

        const qrImage = await QRCode.toDataURL(qrData);

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        res.setHeader(
          "Content-Disposition",
          `attachment; filename=reporte_${fechaHoy}.pdf`
        );
        res.setHeader("Content-Type", "application/pdf");

        const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
        const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });

        // Función para dibujar la cabecera (solo se usará en la primera página)
        const drawHeader = () => {
          doc.addImage(logoData, 'JPEG', 20, 15, 35, 35);
          doc.addImage(qrImage, 'PNG', doc.internal.pageSize.width - 50, 15, 35, 35);
          
          doc.setFontSize(12);
          doc.setTextColor(0);
          doc.text("EMPRESA MINERA HUANUNI", doc.internal.pageSize.width / 2, 25, { align: "center" });
          doc.text("ASISTENCIA SUPERINTENDENCIA MINA", doc.internal.pageSize.width / 2, 32, { align: "center" });
          
          doc.setLineWidth(0.5);
          doc.line(65, 35, doc.internal.pageSize.width - 65, 35);
          
          doc.setFontSize(11);
          doc.text(`Reporte de Salidas - ${fechaHoy}`, doc.internal.pageSize.width / 2, 45, { align: "center" });
        };

        // Dibujar la cabecera en la primera página
        drawHeader();

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
          "Fecha"
        ];

        const data = salidas.map(s => [
          s.codigo,
          s.nivel,
          s.material,
          s.producto,
          s.unidad,
          s.cantidad.toString(),
          s.responsable_nombre,
          s.rumpero || "-",
          s.trabajador || "-",
          moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")
        ]);

        doc.autoTable({
          startY: 55,
          margin: { left: 10, right: 10 },
          head: [headers],
          body: data,
          theme: 'plain',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: false,
            textColor: [0, 102, 204],
            fontSize: 8,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 17 },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 15 },
            5: { cellWidth: 17 },
            6: { cellWidth: 25 },
            7: { cellWidth: 20 },
            8: { cellWidth: 20 },
            9: { cellWidth: 'auto' }
          },
          didDrawCell: function (data) {
            doc.setDrawColor(0); // Color negro
            doc.setLineWidth(0.2); // Grosor de la línea
        
            // Dibujar línea debajo de los encabezados
            if (data.section === 'head') {
              doc.line(
                data.cell.x,
                data.cell.y + data.cell.height, // Posición Y al final de la celda
                data.cell.x + data.cell.width,
                data.cell.y + data.cell.height
              );
            }
        
            // Dibujar líneas entre filas
            if (data.section === 'body') {
              doc.line(
                data.cell.x,
                data.cell.y + data.cell.height,
                data.cell.x + data.cell.width,
                data.cell.y + data.cell.height
              );
            }
          }
        });
        
        
        const pdfBuffer = doc.output();
        res.end(Buffer.from(pdfBuffer, 'binary'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte" });
  }
};
const generateMonthlyReport = async (req, res) => {
  try {
    const yearMonth = req.params.yearMonth;

    if (!moment(yearMonth, "YYYY-MM", true).isValid()) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Use YYYY-MM (ejemplo: 2022-01)",
      });
    }

    const [year, month] = yearMonth.split("-");

    const result = await db.query(
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, 
              s.fecha_salida, p.unidad, s.rumpero, s.trabajador, s.cantidad
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE strftime('%Y-%m', s.fecha_salida) = ?
       AND m.status = 1
       AND s.status = 1
       ORDER BY s.nivel, m.nombre DESC`,
      [yearMonth]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el mes ${month} del año ${year}`,
      });
    }

    let qrData = `Reporte Mensual de Salidas - ${yearMonth}\n\n`;
    qrData += `Código | Material | Producto | Unidad | Nivel | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
    qrData += `-------------------------------------------------------------------------------------------\n`;

    salidas.forEach((s) => {
      qrData += `${s.id} | ${s.material} | ${s.producto} | ${s.unidad} | ${
        s.nivel
      } | ${s.cantidad} | ${s.responsable_nombre} | ${s.rumpero || "-"} | ${
        s.trabajador || "-"
      } | ${moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")}\n`;
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_mensual_${yearMonth}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
    const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });

    // Función para dibujar la cabecera (solo se usará en la primera página)
    const drawHeader = () => {
      doc.addImage(logoData, 'JPEG', 20, 15, 35, 35);
      doc.addImage(qrImage, 'PNG', doc.internal.pageSize.width - 50, 15, 35, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("EMPRESA MINERA HUANUNI", doc.internal.pageSize.width / 2, 25, { align: "center" });
      doc.text("ASISTENCIA SUPERINTENDENCIA MINA", doc.internal.pageSize.width / 2, 32, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(65, 35, doc.internal.pageSize.width - 65, 35);
      
      const monthName = moment(yearMonth).locale("es").format("MMMM");
      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      doc.setFontSize(11);
      doc.text(`Reporte Mensual de Salidas - ${capitalizedMonthName} ${year}`, doc.internal.pageSize.width / 2, 45, { align: "center" });
    };

    // Dibujar la cabecera en la primera página
    drawHeader();

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

    const data = salidas.map(s => [
      s.codigo,
      s.nivel,
      s.material,
      s.producto,
      s.unidad,
      s.cantidad.toString(),
      s.responsable_nombre,
      s.rumpero || "-",
      s.trabajador || "-",
      moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")
    ]);

    doc.autoTable({
      startY: 55,
      margin: { left: 10, right: 10 },
      head: [headers],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 102, 204],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 17 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 17 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 },
        9: { cellWidth: 'auto' }
      },
      didDrawCell: function (data) {
        doc.setDrawColor(0); // Color negro
        doc.setLineWidth(0.2); // Grosor de la línea
    
        // Dibujar línea debajo de los encabezados
        if (data.section === 'head') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height, // Posición Y al final de la celda
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
    
        // Dibujar líneas entre filas
        if (data.section === 'body') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      }
    });

    const pdfBuffer = doc.output();
    res.end(Buffer.from(pdfBuffer, 'binary'));

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

    const result = await db.query(
      `SELECT 
          s.nivel, 
          m.nombre AS material, 
          p.nombre AS producto, 
          p.unidad, 
          ROUND(SUM(s.cantidad), 2) AS total_cantidad
      FROM salidas s 
      JOIN materiales m ON s.material_id = m.id 
      JOIN productos p ON s.producto_id = p.id  
      WHERE substr(datetime(s.fecha_salida, 'localtime'), 1, 7) = ?
      AND m.status = 1
      AND s.status = 1
      GROUP BY s.nivel, m.nombre, p.nombre, p.unidad  
      ORDER BY s.nivel ASC, m.nombre ASC`,
      [yearMonth]
    );

    const salidas = result.rows;

    if (!salidas || salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el mes ${month} del año ${year}`,
      });
    }

    let qrData = `Reporte Mensual de Salidas - ${yearMonth}\n\n`;
    qrData += `Nivel | Material | Producto | Unidad | Total Cantidad\n`;
    qrData += `-----------------------------------------------------------\n`;

    salidas.forEach((s) => {
      qrData += `${s.nivel} | ${s.material} | ${s.producto} | ${s.unidad} | ${s.total_cantidad}\n`;
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    res.setHeader('Content-Disposition', `attachment; filename=reporte_mensual_total_${yearMonth}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
    const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });

    // Función para dibujar la cabecera (solo se usará en la primera página)
    const drawHeader = () => {
      doc.addImage(logoData, 'JPEG', 20, 15, 35, 35);
      doc.addImage(qrImage, 'PNG', doc.internal.pageSize.width - 50, 15, 35, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("EMPRESA MINERA HUANUNI", doc.internal.pageSize.width / 2, 25, { align: "center" });
      doc.text("ASISTENCIA SUPERINTENDENCIA MINA", doc.internal.pageSize.width / 2, 32, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(65, 35, doc.internal.pageSize.width - 65, 35);
      
      const monthName = moment(yearMonth).locale("es").format("MMMM");
      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      doc.setFontSize(11);
      doc.text(`Reporte Mensual de Salidas Totales - ${capitalizedMonthName} ${year}`, doc.internal.pageSize.width / 2, 45, { align: "center" });
    };

    // Dibujar la cabecera en la primera página
    drawHeader();

    const headers = ["Nivel", "Material", "Producto", "Unidad", "Total Cantidad"];

    const data = salidas.map(s => [
      s.nivel,
      s.material,
      s.producto,
      s.unidad,
      s.total_cantidad.toString()
    ]);

    doc.autoTable({
      startY: 55,
      margin: { left: 10, right: 10 },
      head: [headers],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 102, 204],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 45 },
        2: { cellWidth: 45 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 }
      },
      didDrawCell: function (data) {
        doc.setDrawColor(0); // Color negro
        doc.setLineWidth(0.2); // Grosor de la línea
    
        // Dibujar línea debajo de los encabezados
        if (data.section === 'head') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height, // Posición Y al final de la celda
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
    
        // Dibujar líneas entre filas
        if (data.section === 'body') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      }
    });

    const pdfBuffer = doc.output();
    res.end(Buffer.from(pdfBuffer, 'binary'));

  } catch (err) {
    console.error('Error en generateMonthlyReportTotal:', err);
    res.status(500).json({ 
      message: "Error al generar el reporte mensual",
      error: err.message 
    });
  }
};


const generateMonthlyLevelReport = async (req, res) => {
  try {
    const { yearMonth, nivel } = req.params;

    if (!moment(yearMonth, "YYYY-MM", true).isValid()) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Use YYYY-MM (ejemplo: 2022-01)",
      });
    }

    if (!nivel) {
      return res.status(400).json({
        message: "El nivel es requerido",
      });
    }

    const [year, month] = yearMonth.split("-");

    const result = await db.query(
      `SELECT s.id, s.codigo, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, 
              s.fecha_salida, p.unidad, s.rumpero, s.trabajador, s.cantidad
       FROM salidas s 
       JOIN materiales m ON s.material_id = m.id 
       JOIN productos p ON s.producto_id = p.id
       WHERE strftime('%Y-%m', s.fecha_salida) = ?
       AND s.nivel = ?
       AND m.status = 1
       AND s.status = 1
       ORDER BY m.nombre DESC`,
      [yearMonth, nivel]
    );

    const salidas = result.rows;

    if (salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el nivel ${nivel} en el mes ${month} del año ${year}`,
      });
    }

    let qrData = `Reporte Mensual de Salidas - Nivel ${nivel} - ${yearMonth}\n\n`;
    qrData += `Código | Material | Producto | Unidad | Cantidad | Responsable | Rumpero | Trabajador | Fecha\n`;
    qrData += `-------------------------------------------------------------------------------------------\n`;

    salidas.forEach((s) => {
      qrData += `${s.id} | ${s.material} | ${s.producto} | ${s.unidad} | ${
        s.cantidad
      } | ${s.responsable_nombre} | ${s.rumpero || "-"} | ${
        s.trabajador || "-"
      } | ${moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")}\n`;
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=reporte_mensual_nivel_${nivel}_${yearMonth}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
    const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });

    // Función para dibujar la cabecera
    const drawHeader = () => {
      doc.addImage(logoData, 'JPEG', 20, 15, 35, 35);
      doc.addImage(qrImage, 'PNG', doc.internal.pageSize.width - 50, 15, 35, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("EMPRESA MINERA HUANUNI", doc.internal.pageSize.width / 2, 25, { align: "center" });
      doc.text("ASISTENCIA SUPERINTENDENCIA MINA", doc.internal.pageSize.width / 2, 32, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(65, 35, doc.internal.pageSize.width - 65, 35);
      
      const monthName = moment(yearMonth).locale("es").format("MMMM");
      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      doc.setFontSize(11);
      doc.text(`Reporte Mensual de Salidas - Nivel ${nivel} - ${capitalizedMonthName} ${year}`, doc.internal.pageSize.width / 2, 45, { align: "center" });
    };

    // Dibujar la cabecera en la primera página
    drawHeader();

    const headers = [
      "Código",
      "Material",
      "Producto",
      "Unidad",
      "Cantidad",
      "Responsable",
      "Rumpero",
      "Trabajador",
      "Fecha",
    ];

    const data = salidas.map(s => [
      s.codigo,
      s.material,
      s.producto,
      s.unidad,
      s.cantidad.toString(),
      s.responsable_nombre,
      s.rumpero || "-",
      s.trabajador || "-",
      moment(s.fecha_salida).format("DD/MM/YYYY HH:mm")
    ]);

    doc.autoTable({
      startY: 55,
      margin: { left: 10, right: 10 },
      head: [headers],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 102, 204],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 17 },
        5: { cellWidth: 25 },
        6: { cellWidth: 20 },
        7: { cellWidth: 20 },
        8: { cellWidth: 'auto' }
      },
      didDrawCell: function (data) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
    
        if (data.section === 'head') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
    
        if (data.section === 'body') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      }
    });

    const pdfBuffer = doc.output();
    res.end(Buffer.from(pdfBuffer, 'binary'));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al generar el reporte mensual por nivel" });
  }
};

const generateMonthlyLevelReportTotal = async (req, res) => {
  try {
    const { yearMonth, nivel } = req.params;

    if (!moment(yearMonth, "YYYY-MM", true).isValid()) {
      return res
        .status(400)
        .json({ message: "Formato de fecha inválido. Use YYYY-MM" });
    }

    if (!nivel) {
      return res.status(400).json({
        message: "El nivel es requerido",
      });
    }

    const [year, month] = yearMonth.split("-");

    const result = await db.query(
      `SELECT 
          m.nombre AS material, 
          p.nombre AS producto, 
          p.unidad, 
          ROUND(SUM(s.cantidad), 2) AS total_cantidad
      FROM salidas s 
      JOIN materiales m ON s.material_id = m.id 
      JOIN productos p ON s.producto_id = p.id  
      WHERE substr(datetime(s.fecha_salida, 'localtime'), 1, 7) = ?
      AND s.nivel = ?
      AND m.status = 1
      AND s.status = 1
      GROUP BY m.nombre, p.nombre, p.unidad  
      ORDER BY m.nombre ASC`,
      [yearMonth, nivel]
    );

    const salidas = result.rows;

    if (!salidas || salidas.length === 0) {
      return res.status(404).json({
        message: `No hay salidas registradas para el nivel ${nivel} en el mes ${month} del año ${year}`,
      });
    }

    let qrData = `Reporte Mensual de Salidas - Nivel ${nivel} - ${yearMonth}\n\n`;
    qrData += `Material | Producto | Unidad | Total Cantidad\n`;
    qrData += `-----------------------------------------------------------\n`;

    salidas.forEach((s) => {
      qrData += `${s.material} | ${s.producto} | ${s.unidad} | ${s.total_cantidad}\n`;
    });

    const qrImage = await QRCode.toDataURL(qrData);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    res.setHeader('Content-Disposition', `attachment; filename=reporte_mensual_total_nivel_${nivel}_${yearMonth}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');

    const logoPath = path.join(__dirname, "../assets/empresa.jpeg");
    const logoData = fs.readFileSync(logoPath, { encoding: 'base64' });

    // Función para dibujar la cabecera
    const drawHeader = () => {
      doc.addImage(logoData, 'JPEG', 20, 15, 35, 35);
      doc.addImage(qrImage, 'PNG', doc.internal.pageSize.width - 50, 15, 35, 35);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("EMPRESA MINERA HUANUNI", doc.internal.pageSize.width / 2, 25, { align: "center" });
      doc.text("ASISTENCIA SUPERINTENDENCIA MINA", doc.internal.pageSize.width / 2, 32, { align: "center" });
      
      doc.setLineWidth(0.5);
      doc.line(65, 35, doc.internal.pageSize.width - 65, 35);
      
      const monthName = moment(yearMonth).locale("es").format("MMMM");
      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      doc.setFontSize(11);
      doc.text(`Reporte Mensual de Salidas Totales - Nivel ${nivel} - ${capitalizedMonthName} ${year}`, doc.internal.pageSize.width / 2, 45, { align: "center" });
    };

    // Dibujar la cabecera en la primera página
    drawHeader();

    const headers = ["Material", "Producto", "Unidad", "Total Cantidad"];

    const data = salidas.map(s => [
      s.material,
      s.producto,
      s.unidad,
      s.total_cantidad.toString()
    ]);

    doc.autoTable({
      startY: 55,
      margin: { left: 10, right: 10 },
      head: [headers],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 102, 204],
        fontSize: 8,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      },
      didDrawCell: function (data) {
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
    
        if (data.section === 'head') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
    
        if (data.section === 'body') {
          doc.line(
            data.cell.x,
            data.cell.y + data.cell.height,
            data.cell.x + data.cell.width,
            data.cell.y + data.cell.height
          );
        }
      }
    });

    const pdfBuffer = doc.output();
    res.end(Buffer.from(pdfBuffer, 'binary'));

  } catch (err) {
    console.error('Error en generateMonthlyLevelReportTotal:', err);
    res.status(500).json({ 
      message: "Error al generar el reporte mensual por nivel",
      error: err.message 
    });
  }
};

module.exports = {
  generateReport,
  generateMonthlyReport,
  generateMonthlyReportTotal,
  generateMonthlyLevelReport,
  generateMonthlyLevelReportTotal
};
