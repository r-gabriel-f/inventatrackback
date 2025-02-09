const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const moment = require("moment");
const db = require("../db");

// Función para generar el reporte del día
const generateReport = async (req, res) => {
    try {
        const fechaHoy = moment().format("YYYY-MM-DD");

        // Consulta las salidas del día
        const result = await db.query(
            `SELECT s.id, m.nombre AS material, p.nombre AS producto, s.nivel, s.responsable_nombre, s.fecha_salida
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

        // Crear contenido del QR (resumen del reporte)
        let qrData = `Reporte del ${fechaHoy}\n`;
        salidas.forEach((s) => {
            qrData += `ID: ${s.id}, Material: ${s.material}, Producto: ${s.producto}, Responsable: ${s.responsable_nombre}\n`;
        });

        // Generar código QR
        const qrImage = await QRCode.toDataURL(qrData);

        // Crear el PDF
        const doc = new PDFDocument({
            margins: {
                top: 50,
                bottom: 50,
                left: 40,
                right: 40
            }
        });
        
        res.setHeader("Content-Disposition", `attachment; filename=reporte_${fechaHoy}.pdf`);
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);

        // Encabezado
        doc.fontSize(18).text(`Reporte de Salidas - ${fechaHoy}`, { align: "center" });
        doc.moveDown(1);

        // Configurar tabla de salidas
        const tableTop = doc.y + 60;
        // Ajustar anchos de columnas para que sumen aproximadamente el ancho útil de la página (515 puntos en PDFKit)
        const columnWidths = [40, 100, 100, 60, 100, 95]; // Total: 495 puntos
        const headers = ["ID", "Material", "Producto", "Nivel", "Responsable", "Fecha"];
        const headerColor = '#0066cc';

        // Función helper para calcular la posición X de cada columna
        const getXPosition = (index) => {
            let x = 40; // Nuevo margen inicial
            for (let i = 0; i < index; i++) {
                x += columnWidths[i];
            }
            return x;
        };

        // Agregar encabezados de la tabla con color azul
        headers.forEach((header, i) => {
            doc.fillColor(headerColor)
               .fontSize(12)
               .text(header, getXPosition(i), tableTop, {
                   width: columnWidths[i],
                   align: 'left'
               });
        });

        // Restaurar color negro para el contenido
        doc.fillColor('black');
        
        doc.moveDown(0.5);

        // Dibujar línea después del encabezado
        const lineStart = 40; // Nuevo margen inicial
        const lineEnd = 535; // Nuevo fin de línea (40 + 495)
        doc.moveTo(lineStart, doc.y)
           .lineTo(lineEnd, doc.y)
           .stroke();

        // Agregar filas de la tabla
        let yPosition = doc.y + 10;
        
        salidas.forEach((s) => {
            doc.fontSize(10);
            doc.text(s.id.toString(), 40, yPosition, { width: columnWidths[0] });
            doc.text(s.material, getXPosition(1), yPosition, { width: columnWidths[1] });
            doc.text(s.producto, getXPosition(2), yPosition, { width: columnWidths[2] });
            doc.text(s.nivel, getXPosition(3), yPosition, { width: columnWidths[3] });
            doc.text(s.responsable_nombre, getXPosition(4), yPosition, { width: columnWidths[4] });
            doc.text(moment(s.fecha_salida).format('DD/MM/YYYY HH:mm'), getXPosition(5), yPosition, { width: columnWidths[5] });
            
            yPosition += 40;
        });

        // Agregar QR al PDF
        const marginRight = 40; // Ajustado al nuevo margen
        const marginTop = 50;
        const qrSize = 100;
        doc.image(qrImage, doc.page.width - marginRight - qrSize, marginTop, { width: qrSize, height: qrSize });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error al generar el reporte" });
    }
};

module.exports = { generateReport };