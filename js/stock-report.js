// En reporte-tiendas.js o crear nuevo archivo stock-report.js
async function generarReporteStockActual() {
    const stockSnap = await db.collection('stock').get();

    const stockData = [];
    stockSnap.forEach(doc => {
        const data = doc.data();
        stockData.push({
            producto: data.producto,
            pollos: data.cantidadPollos || 0,
            peso: data.pesoNeto || 0,
            ultimaActualizacion: data.ultimaActualizacion || new Date()
        });
    });

    // Mostrar en una nueva pestaña o modal
}

//? pruebaaaaaaaaaaaaaaaaaaaa