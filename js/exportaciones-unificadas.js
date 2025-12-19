// js/exportaciones-unificadas.js - VERSIÓN CORREGIDA

// ============================================
// SISTEMA UNIFICADO DE EXPORTACIONES
// ============================================

class ExportadorUnificado {
    constructor() {
        this.extensiones = {
            excel: 'xlsx',
            csv: 'csv',
            pdf: 'pdf'
        };
    }

    /**
     * Exportar tabla HTML visible a Excel
     * @param {string} tablaId - ID del tbody de la tabla
     * @param {string} nombreBase - Nombre base del archivo
     * @param {Object} opciones - Opciones adicionales
     */
    async exportarTablaVisibleExcel(tablaId, nombreBase, opciones = {}) {
        try {
            console.log(`📊 Exportando tabla visible ${tablaId} a Excel...`);

            // Verificar dependencias
            if (typeof XLSX === 'undefined') {
                throw new Error('La biblioteca SheetJS no está cargada');
            }

            // Obtener el tbody
            const tbody = document.getElementById(tablaId);
            if (!tbody) {
                throw new Error(`Tabla con ID "${tablaId}" no encontrada`);
            }

            // Obtener la tabla completa
            const tablaCompleta = tbody.closest('table');
            if (!tablaCompleta) {
                throw new Error('No se encontró la tabla completa');
            }

            // Clonar la tabla para no modificar la original
            const tablaClon = tablaCompleta.cloneNode(true);

            // Limpiar botones de acción (editar/eliminar)
            this.limpiarBotonesAccion(tablaClon);

            // Ocultar temporalmente para evitar efectos visuales
            tablaClon.style.display = 'none';
            document.body.appendChild(tablaClon);

            // Crear hoja desde tabla HTML
            const ws = XLSX.utils.table_to_sheet(tablaClon, {
                raw: true,
                cellDates: true,
                cellStyles: true
            });

            // Limpiar tabla clonada
            tablaClon.remove();

            // Aplicar estilos
            this.aplicarEstilosExcel(ws, opciones);

            // Agregar metadata si se proporciona
            const wb = XLSX.utils.book_new();
            if (opciones.metadata) {
                this.agregarMetadataExcel(wb, ws, opciones.metadata);
            }

            // Agregar hoja al libro
            XLSX.utils.book_append_sheet(wb, ws, opciones.nombreHoja || 'Datos');

            // Generar nombre de archivo
            const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const nombreArchivo = `${nombreBase}_${fecha}.${this.extensiones.excel}`;

            // Guardar archivo
            XLSX.writeFile(wb, nombreArchivo);

            this.mostrarNotificacion(`✅ Exportado: ${nombreArchivo}`, 'success');

            return nombreArchivo;

        } catch (error) {
            console.error('❌ Error al exportar tabla a Excel:', error);
            this.mostrarNotificacion(`Error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Limpiar botones de acción de la tabla
     */
    limpiarBotonesAccion(tabla) {
        // Buscar y limpiar botones de editar/eliminar
        const botonesAccion = tabla.querySelectorAll('button, .btn, [onclick*="editar"], [onclick*="eliminar"], .badge');

        botonesAccion.forEach(boton => {
            const texto = boton.textContent.trim();

            // Si es un badge de estado, mantener el texto
            if (boton.classList.contains('badge')) {
                const span = document.createElement('span');
                span.textContent = texto;
                span.style.margin = '0 5px';
                boton.parentNode.replaceChild(span, boton);
            }
            // Si es un botón con iconos, extraer solo el texto útil
            else if (boton.tagName === 'BUTTON' || boton.classList.contains('btn')) {
                // Extraer texto útil (eliminar emojis y espacios)
                let textoUtil = texto.replace(/[✏️🗑️🔍🔄📋]/g, '').trim();
                if (textoUtil) {
                    const span = document.createElement('span');
                    span.textContent = textoUtil;
                    boton.parentNode.replaceChild(span, boton);
                } else {
                    boton.remove();
                }
            }
        });
    }

    /**
     * Exportar tabla específica con formato mejorado
     */
    async exportarTablaConFormato(tablaId, nombreBase, tipo = 'registros') {
        try {
            console.log(`📊 Exportando ${tipo} a Excel...`);

            const tbody = document.getElementById(tablaId);
            if (!tbody || tbody.rows.length === 0) {
                this.mostrarNotificacion('⚠️ No hay datos para exportar', 'warning');
                return;
            }

            // Obtener metadatos específicos según el tipo
            const metadata = this.obtenerMetadatosPorTipo(tipo);

            // Exportar
            await this.exportarTablaVisibleExcel(tablaId, nombreBase, {
                nombreHoja: this.getNombreHoja(tipo),
                metadata: metadata,
                formatoMoneda: tipo.includes('inventario') || tipo.includes('valor')
            });

        } catch (error) {
            console.error(`❌ Error al exportar ${tipo}:`, error);
            this.mostrarNotificacion(`Error al exportar ${tipo}`, 'error');
        }
    }

    /**
     * Obtener metadatos según el tipo de tabla
     */
    obtenerMetadatosPorTipo(tipo) {
        const fechaActual = new Date().toLocaleString('es-PE');

        switch (tipo) {
            case 'registros':
                const fechaReg = document.getElementById('buscarFecha')?.value;
                return {
                    titulo: 'REPORTE DE INGRESOS - AVICRUZ SAC',
                    fecha: fechaReg ? new Date(fechaReg).toLocaleDateString('es-PE') : 'Todas las fechas',
                    tipo: 'Ingresos de Pollo Vivo',
                    fechaExportacion: fechaActual
                };

            case 'salidas':
                const fechaSal = document.getElementById('buscarFechaSalidas')?.value;
                return {
                    titulo: 'REPORTE DE SALIDAS - AVICRUZ SAC',
                    fecha: fechaSal ? new Date(fechaSal).toLocaleDateString('es-PE') : 'Todas las fechas',
                    tipo: 'Salidas de Pollo Beneficiado',
                    fechaExportacion: fechaActual
                };

            case 'inventario':
                const fechaInv = document.getElementById('fechaInventario')?.value;
                const precio = document.getElementById('precioActual')?.textContent || '8.50';
                return {
                    titulo: 'INVENTARIO DIARIO - AVICRUZ SAC',
                    fecha: fechaInv ? new Date(fechaInv).toLocaleDateString('es-PE') : 'Hoy',
                    precioKg: `S/ ${precio}`,
                    tipo: 'Inventario de Pollos',
                    fechaExportacion: fechaActual
                };

            case 'reporte_tiendas':
                const fechaRep = document.getElementById('reporteFecha')?.value;
                const tienda = document.getElementById('reporteTienda')?.value || 'TODAS';
                return {
                    titulo: 'REPORTE POR TIENDA - AVICRUZ SAC',
                    fecha: fechaRep ? new Date(fechaRep).toLocaleDateString('es-PE') : 'Todas las fechas',
                    tienda: tienda,
                    tipo: 'Distribución por Tienda',
                    fechaExportacion: fechaActual
                };

            default:
                return {
                    titulo: 'REPORTE - AVICRUZ SAC',
                    fecha: fechaActual,
                    tipo: 'Reporte General',
                    fechaExportacion: fechaActual
                };
        }
    }

    /**
     * Métodos auxiliares (mantener los existentes con pequeñas mejoras)
     */
    aplicarEstilosExcel(ws, opciones) {
        // Ajustar ancho de columnas
        const range = XLSX.utils.decode_range(ws['!ref']);
        const wscols = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxLength = 0;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = ws[XLSX.utils.encode_cell({ c: C, r: R })];
                if (cell && cell.v) {
                    const length = cell.v.toString().length;
                    if (length > maxLength) maxLength = length;
                }
            }
            // Ancho mínimo de 10, máximo de 40 caracteres
            wscols.push({ wch: Math.min(Math.max(maxLength + 2, 10), 40) });
        }

        ws['!cols'] = wscols;

        // Aplicar formato de moneda si se solicita
        if (opciones.formatoMoneda) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ c: C, r: 0 });
                const headerCell = ws[cellAddress];
                if (headerCell && headerCell.v) {
                    const headerText = headerCell.v.toString().toUpperCase();
                    if (headerText.includes('VALOR') || headerText.includes('PRECIO') ||
                        headerText.includes('MONTO') || headerText.includes('S/')) {

                        for (let R = 1; R <= range.e.r; ++R) {
                            const cell = ws[XLSX.utils.encode_cell({ c: C, r: R })];
                            if (cell && !isNaN(cell.v)) {
                                cell.z = '"S/"#,##0.00';
                            }
                        }
                    }
                }
            }
        }
    }

    agregarMetadataExcel(wb, ws, metadata) {
        // Datos de metadata
        const datosMetadata = [];

        if (metadata.titulo) {
            datosMetadata.push([metadata.titulo]);
        }

        if (metadata.fecha) {
            datosMetadata.push(['Fecha:', metadata.fecha]);
        }

        if (metadata.tienda && metadata.tienda !== 'TODAS') {
            datosMetadata.push(['Tienda:', metadata.tienda]);
        }

        if (metadata.precioKg) {
            datosMetadata.push(['Precio por kg:', metadata.precioKg]);
        }

        if (metadata.tipo) {
            datosMetadata.push(['Tipo:', metadata.tipo]);
        }

        if (metadata.fechaExportacion) {
            datosMetadata.push(['Exportado:', metadata.fechaExportacion]);
        }

        datosMetadata.push(['']); // Línea en blanco

        // Insertar metadata al inicio
        XLSX.utils.sheet_add_aoa(ws, datosMetadata, { origin: 'A1' });

        // Ajustar rango de celdas
        const range = XLSX.utils.decode_range(ws['!ref']);
        range.e.r += datosMetadata.length;
        ws['!ref'] = XLSX.utils.encode_range(range);

        // Combinar celdas del título
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({
            s: { r: 0, c: 0 },
            e: { r: 0, c: range.e.c }
        });
    }

    getNombreHoja(tipo) {
        const nombres = {
            'registros': 'Ingresos',
            'salidas': 'Salidas',
            'inventario': 'Inventario',
            'reporte_tiendas': 'Reporte_Tiendas'
        };
        return nombres[tipo] || 'Datos';
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        // Eliminar notificaciones anteriores
        const notificacionesAnteriores = document.querySelectorAll('.export-notification');
        notificacionesAnteriores.forEach(n => n.remove());

        const alerta = document.createElement('div');
        alerta.className = `export-notification alert alert-${tipo} alert-dismissible fade show position-fixed`;
        alerta.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        `;

        // Agregar estilos CSS para animación
        if (!document.getElementById('export-styles')) {
            const style = document.createElement('style');
            style.id = 'export-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        const iconos = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        alerta.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2 fs-5">${iconos[tipo] || 'ℹ️'}</span>
                <span class="flex-grow-1">${mensaje}</span>
                <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(alerta);

        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.classList.remove('show');
                setTimeout(() => alerta.remove(), 300);
            }
        }, 5000);
    }
}

// ============================================
// FUNCIONES ESPECÍFICAS PARA CADA TABLA
// ============================================

// Instancia global
const exportador = new ExportadorUnificado();

// 1. Exportar Registros (Ingresos)
async function exportarRegistrosAXLS() {
    await exportador.exportarTablaConFormato('tablaRegistros', 'registros_ingresos', 'registros');
}

// 2. Exportar Salidas
async function exportarSalidasAXLS() {
    await exportador.exportarTablaConFormato('tablaSalidas', 'registros_salidas', 'salidas');
}

// 3. Exportar Inventario
async function exportarInventarioFechaExcel() {
    await exportador.exportarTablaConFormato('tablaInventario', 'inventario_diario', 'inventario');
}

// 4. Exportar Reporte Tiendas
async function exportarReporteTiendasExcel() {
    await exportador.exportarTablaConFormato('tablaReporteTiendas', 'reporte_tiendas', 'reporte_tiendas');
}

// ============================================
// FUNCIÓN DE EMERGENCIA: Exportar tabla exacta
// ============================================
function exportarTablaExacta(tablaId, nombreArchivo) {
    try {
        // Obtener tabla completa
        const tabla = document.getElementById(tablaId).closest('table');
        if (!tabla) {
            alert('No se encontró la tabla');
            return;
        }

        // Clonar tabla
        const tablaClon = tabla.cloneNode(true);

        // Limpiar botones
        const botones = tablaClon.querySelectorAll('button');
        botones.forEach(btn => {
            const texto = btn.textContent.trim();
            const span = document.createElement('span');
            span.textContent = texto.replace(/[✏️🗑️]/g, '').trim();
            btn.parentNode.replaceChild(span, btn);
        });

        // Convertir a Excel
        const ws = XLSX.utils.table_to_sheet(tablaClon);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Datos');

        // Descargar
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);

        // Mostrar notificación simple
        alert(`✅ Exportado: ${nombreArchivo}_${fecha}.xlsx`);

    } catch (error) {
        console.error('Error exportando:', error);
        alert('❌ Error al exportar');
    }
}

// ============================================
// FUNCIONES DE CONVENIENCIA RÁPIDAS
// ============================================
function exportarRegistrosRapido() {
    exportarTablaExacta('tablaRegistros', 'registros');
}

function exportarSalidasRapido() {
    exportarTablaExacta('tablaSalidas', 'salidas');
}

function exportarInventarioRapido() {
    exportarTablaExacta('tablaInventario', 'inventario');
}

function exportarReporteTiendasRapido() {
    exportarTablaExacta('tablaReporteTiendas', 'reporte_tiendas');
}

// ============================================
// EXPORTAR AL OBJETO GLOBAL
// ============================================

// Usar las funciones principales
window.exportador = exportador;
window.exportarRegistrosAXLS = exportarRegistrosAXLS;
window.exportarSalidasAXLS = exportarSalidasAXLS;
window.exportarInventarioFechaExcel = exportarInventarioFechaExcel;
window.exportarReporteTiendasExcel = exportarReporteTiendasExcel;

// También exportar las funciones rápidas por si acaso
window.exportarRegistrosRapido = exportarRegistrosRapido;
window.exportarSalidasRapido = exportarSalidasRapido;
window.exportarInventarioRapido = exportarInventarioRapido;
window.exportarReporteTiendasRapido = exportarReporteTiendasRapido;

console.log('✅ Sistema de exportaciones (tablas visibles) cargado');