// js/auth-system.js - SISTEMA COMPLETO DE AUTENTICACIÓN Y PERMISOS

class SistemaAutenticacionAvanzado {
    constructor() {
        this.usuarioActual = null;
        this.usuarioData = null;
        this.permisos = {};
        this.tabs = [
            { id: 'registros', nombre: 'Registros', icono: '📝' },
            { id: 'salidas', nombre: 'Salidas', icono: '🚚' },
            { id: 'reporteTiendas', nombre: 'ReporteTiendas', icono: '📊' },
            { id: 'eliminados', nombre: 'Eliminados', icono: '🗑️' },
            { id: 'tiendas', nombre: '🏪 Tiendas', icono: '🏪' },
            { id: 'inventario', nombre: '📦 Inventario', icono: '📦' }
        ];

        this.inicializar();
    }

    /**
     * Inicializar sistema
     */
    async inicializar() {
        console.log('🔐 Inicializando sistema de autenticación avanzado...');

        // Agregar estilos dinámicamente
        this.agregarEstilosDinamicos();

        // Escuchar cambios en autenticación
        auth.onAuthStateChanged(async (usuario) => {
            await this.manejarCambioEstado(usuario);
        });

        // Verificar sesión previa
        this.verificarSesionPrevia();
    }

    /**
     * Agregar estilos dinámicos
     */
    agregarEstilosDinamicos() {
        if (!document.getElementById('auth-styles-dynamic')) {
            const style = document.createElement('style');
            style.id = 'auth-styles-dynamic';
            style.textContent = `
                .tab-disabled {
                    opacity: 0.5;
                    pointer-events: none;
                    filter: grayscale(100%);
                }
                
                .tab-permission-badge {
                    font-size: 10px;
                    padding: 2px 6px;
                    margin-left: 5px;
                    vertical-align: middle;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Manejar cambio de estado de autenticación
     */
    async manejarCambioEstado(usuario) {
        if (usuario) {
            console.log('✅ Usuario autenticado:', usuario.email);
            this.usuarioActual = usuario;

            // Obtener datos del usuario desde Firestore
            await this.cargarDatosUsuario(usuario.uid);

            // Guardar sesión
            this.guardarSesion();

            // Mostrar interfaz principal
            this.mostrarInterfazPrincipal();

            // Aplicar permisos a las pestañas
            this.aplicarPermisosTabs();

        } else {
            console.log('🚪 Usuario no autenticado');
            this.usuarioActual = null;
            this.usuarioData = null;
            this.permisos = {};

            // Limpiar sesión
            this.limpiarSesion();

            // Mostrar pantalla de login
            this.mostrarPantallaLogin();
        }
    }

    /**
     * Cargar datos del usuario desde Firestore
     */
    async cargarDatosUsuario(uid) {
        try {
            const doc = await db.collection('usuarios').doc(uid).get();

            if (doc.exists) {
                this.usuarioData = doc.data();
                this.permisos = this.usuarioData.permisos || this.generarPermisosPorDefecto();
                console.log('📋 Permisos cargados:', this.permisos);
            } else {
                // Crear documento si no existe
                this.usuarioData = this.crearUsuarioDataPorDefecto();
                this.permisos = this.usuarioData.permisos;

                await db.collection('usuarios').doc(uid).set(this.usuarioData);
                console.log('📋 Usuario creado en Firestore');
            }

        } catch (error) {
            console.error('❌ Error al cargar datos de usuario:', error);
            this.usuarioData = this.crearUsuarioDataPorDefecto();
            this.permisos = this.usuarioData.permisos;
        }
    }

    /**
     * Generar permisos por defecto
     */
    generarPermisosPorDefecto() {
        const permisos = {};
        this.tabs.forEach(tab => {
            permisos[tab.id] = {
                ver: true,
                editar: tab.id !== 'eliminados' // Por defecto no pueden editar eliminados
            };
        });
        return permisos;
    }

    /**
     * Crear datos de usuario por defecto
     */
    crearUsuarioDataPorDefecto() {
        return {
            email: this.usuarioActual.email,
            nombre: this.usuarioActual.email.split('@')[0],
            rol: 'operador',
            fechaRegistro: new Date(),
            ultimoAcceso: new Date(),
            activo: true,
            permisos: this.generarPermisosPorDefecto()
        };
    }

    /**
     * Aplicar permisos a las pestañas
     */
    aplicarPermisosTabs() {
        const tabMenu = document.getElementById('tabMenu');
        if (!tabMenu) return;

        const tabButtons = tabMenu.querySelectorAll('.nav-link');

        tabButtons.forEach(button => {
            const tabId = button.getAttribute('data-bs-target')?.replace('#', '');

            if (tabId && this.permisos[tabId]) {
                const permiso = this.permisos[tabId];

                if (!permiso.ver) {
                    button.classList.add('tab-disabled');
                    button.title = 'No tiene permiso para ver esta pestaña';
                } else {
                    button.classList.remove('tab-disabled');

                    // Agregar badge si tiene permiso de editar
                    if (permiso.editar) {
                        if (!button.querySelector('.permission-badge')) {
                            const badge = document.createElement('span');
                            badge.className = 'badge bg-success tab-permission-badge';
                            badge.textContent = 'Editar';
                            button.appendChild(badge);
                        }
                    } else {
                        if (!button.querySelector('.permission-badge')) {
                            const badge = document.createElement('span');
                            badge.className = 'badge bg-secondary tab-permission-badge';
                            badge.textContent = 'Solo ver';
                            button.appendChild(badge);
                        }
                    }
                }
            }
        });
    }

    /**
     * Verificar si tiene permiso para una acción específica
     */
    tienePermiso(tabId, accion = 'ver') {
        if (this.usuarioData?.rol === 'admin') return true;

        if (this.permisos[tabId]) {
            return this.permisos[tabId][accion] || false;
        }

        return false;
    }

    /**
     * Verificar sesión previa
     */
    verificarSesionPrevia() {
        const sesionGuardada = localStorage.getItem('avicruz_sesion');

        if (sesionGuardada) {
            try {
                const sesion = JSON.parse(sesionGuardada);
                const ahora = new Date();
                const ultimoAcceso = new Date(sesion.ultimoAcceso);
                const diferenciaDias = (ahora - ultimoAcceso) / (1000 * 60 * 60 * 24);

                // La sesión expira después de 30 días
                if (diferenciaDias < 30) {
                    console.log('🔄 Sesión guardada encontrada');
                    // Firebase manejará la reautenticación automáticamente
                } else {
                    console.log('⏰ Sesión expirada');
                    this.limpiarSesion();
                }
            } catch (error) {
                console.error('❌ Error al verificar sesión:', error);
                this.limpiarSesion();
            }
        }
    }

    /**
     * Guardar sesión en localStorage
     */
    guardarSesion() {
        try {
            const datosSesion = {
                uid: this.usuarioActual.uid,
                email: this.usuarioActual.email,
                ultimoAcceso: new Date().toISOString(),
                permisos: this.permisos
            };

            localStorage.setItem('avicruz_sesion', JSON.stringify(datosSesion));
            console.log('💾 Sesión guardada');
        } catch (error) {
            console.error('❌ Error al guardar sesión:', error);
        }
    }

    /**
     * Limpiar sesión
     */
    limpiarSesion() {
        localStorage.removeItem('avicruz_sesion');
        console.log('🧹 Sesión limpiada');
    }

    /**
     * Mostrar pantalla de login
     */
    mostrarPantallaLogin() {
        // Ocultar contenido principal
        document.getElementById('appContent')?.classList.add('d-none');

        // Mostrar pantalla de login si no existe
        if (!document.getElementById('loginScreen')) {
            this.crearPantallaLogin();
        } else {
            document.getElementById('loginScreen').classList.remove('d-none');
        }
    }

    /**
     * Crear pantalla de login
     */
    crearPantallaLogin() {
        const loginHTML = `
            <div id="loginScreen" class="login-screen">
                <div class="login-card">
                    <div class="login-header">
                        <div class="logo">🔐</div>
                        <h1>AVICRUZ SAC</h1>
                        <p class="subtitle">Sistema de Gestión Avícola</p>
                    </div>
                    
                    <div class="login-body">
                        <form id="loginForm">
                            <div class="form-group">
                                <label for="loginEmail" class="form-label">Correo Electrónico</label>
                                <input type="email" id="loginEmail" class="form-control form-control-lg" 
                                       placeholder="usuario@avicruz.com" required autofocus>
                            </div>
                            
                            <div class="form-group">
                                <label for="loginPassword" class="form-label">Contraseña</label>
                                <input type="password" id="loginPassword" class="form-control form-control-lg" 
                                       placeholder="••••••••" required>
                            </div>
                            
                            <div class="form-check">
                                <input type="checkbox" class="form-check-input" id="rememberSession" checked>
                                <label class="form-check-label" for="rememberSession">Recordar mi sesión</label>
                            </div>
                            
                            <button type="submit" class="btn btn-primary btn-block mt-4" id="btnLogin">
                                <span id="loginText">Iniciar Sesión</span>
                                <span id="loginSpinner" class="spinner-border spinner-border-sm d-none ms-2"></span>
                            </button>
                            
                            <div id="loginError" class="alert alert-danger d-none mt-3" role="alert"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', loginHTML);

        // Configurar eventos
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.procesarLogin();
        });
    }

    /**
     * Procesar inicio de sesión
     */
    async procesarLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btnLogin = document.getElementById('btnLogin');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');
        const errorDiv = document.getElementById('loginError');

        // Mostrar loading
        btnLogin.disabled = true;
        loginText.textContent = 'Verificando...';
        loginSpinner.classList.remove('d-none');
        errorDiv.classList.add('d-none');

        try {
            await this.iniciarSesion(email, password);
        } catch (error) {
            // Mostrar error
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');

            // Animación de error
            document.getElementById('loginScreen').classList.add('shake-animation');
            setTimeout(() => {
                document.getElementById('loginScreen').classList.remove('shake-animation');
            }, 500);
        } finally {
            // Restaurar botón
            btnLogin.disabled = false;
            loginText.textContent = 'Iniciar Sesión';
            loginSpinner.classList.add('d-none');
        }
    }

    /**
     * Iniciar sesión con Firebase
     */
    async iniciarSesion(email, password) {
        try {
            const credencial = await auth.signInWithEmailAndPassword(email, password);

            // Actualizar último acceso en Firestore
            await db.collection('usuarios').doc(credencial.user.uid).update({
                ultimoAcceso: firebase.firestore.FieldValue.serverTimestamp()
            });

            return credencial.user;

        } catch (error) {
            let mensaje = 'Error al iniciar sesión';

            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    mensaje = 'Email o contraseña incorrectos';
                    break;
                case 'auth/user-disabled':
                    mensaje = 'Cuenta deshabilitada';
                    break;
                case 'auth/too-many-requests':
                    mensaje = 'Demasiados intentos. Intente más tarde';
                    break;
                case 'auth/invalid-email':
                    mensaje = 'Email no válido';
                    break;
                default:
                    mensaje = error.message;
            }

            throw new Error(mensaje);
        }
    }

    /**
     * Mostrar interfaz principal
     */
    mostrarInterfazPrincipal() {
        // Ocultar login
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.classList.add('d-none');
        }

        // Mostrar contenido principal
        document.getElementById('appContent')?.classList.remove('d-none');

        // Actualizar navbar con info de usuario
        this.actualizarNavbarUsuario();

        // Inicializar módulos según permisos
        this.inicializarModulos();
    }

    /**
     * Actualizar navbar con información del usuario
     */
    actualizarNavbarUsuario() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        // Limpiar info anterior
        const oldUserInfo = navbar.querySelector('.user-menu');
        if (oldUserInfo) oldUserInfo.remove();

        // Crear nuevo menú de usuario
        const userMenu = document.createElement('div');
        userMenu.className = 'user-menu';

        const iniciales = this.usuarioData.nombre.substring(0, 2).toUpperCase();
        const esAdmin = this.usuarioData.rol === 'admin';

        userMenu.innerHTML = `
            <div class="user-avatar">${iniciales}</div>
            <div class="user-info">
                <div class="user-name">${this.usuarioData.nombre}</div>
                <div class="user-email">${this.usuarioActual.email}</div>
            </div>
            <div class="dropdown">
                <button class="btn btn-link text-white dropdown-toggle" type="button" 
                        data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-chevron-down"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <div class="dropdown-item-text">
                            <small class="text-muted">Rol: ${esAdmin ? 'Administrador' : 'Operador'}</small>
                        </div>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    ${esAdmin ? `
                    <li>
                        <a class="dropdown-item" href="#" onclick="authSystem.mostrarPanelUsuarios()">
                            <span class="me-2">👥</span>Gestionar Usuarios
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    ` : ''}
                    <li>
                        <a class="dropdown-item text-danger" href="#" onclick="authSystem.cerrarSesion()">
                            <span class="me-2">🚪</span>Cerrar Sesión
                        </a>
                    </li>
                </ul>
            </div>
        `;

        navbar.appendChild(userMenu);
    }

    /**
     * Inicializar módulos según permisos
     */
    inicializarModulos() {
        // Inicializar inventario si tiene permiso
        if (this.tienePermiso('inventario', 'ver') && typeof inicializarInventario === 'function') {
            inicializarInventario();
        }

        // Inicializar otros módulos según sea necesario
        console.log('🚀 Módulos inicializados según permisos');
    }

    /**
     * Mostrar panel de gestión de usuarios (solo admin)
     */
    mostrarPanelUsuarios() {
        if (this.usuarioData.rol !== 'admin') {
            alert('Solo administradores pueden acceder a esta función');
            return;
        }

        this.crearModalGestionUsuarios();
    }

    /**
     * Crear modal de gestión de usuarios
     */
    async crearModalGestionUsuarios() {
        // Cargar todos los usuarios
        const usuarios = await this.obtenerTodosUsuarios();

        const modalHTML = `
            <div class="modal fade auth-modal" id="usuariosModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">👥 Gestión de Usuarios</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="admin-panel">
                                <h6>Crear Nuevo Usuario</h6>
                                <form id="formNuevoUsuario" class="row g-3">
                                    <div class="col-md-4">
                                        <input type="email" class="form-control" placeholder="Email" required>
                                    </div>
                                    <div class="col-md-3">
                                        <input type="text" class="form-control" placeholder="Nombre" required>
                                    </div>
                                    <div class="col-md-3">
                                        <select class="form-select" required>
                                            <option value="operador">Operador</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <button type="submit" class="btn btn-primary w-100">Crear</button>
                                    </div>
                                </form>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="users-table">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Email</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Permisos</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${usuarios.map(usuario => this.crearFilaUsuario(usuario)).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal anterior si existe
        const modalExistente = document.getElementById('usuariosModal');
        if (modalExistente) modalExistente.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('usuariosModal'));
        modal.show();

        // Configurar eventos
        this.configurarEventosGestionUsuarios();
    }

    /**
     * Crear fila de usuario para la tabla
     */
    crearFilaUsuario(usuario) {
        const esAdmin = usuario.rol === 'admin';
        const esActivo = usuario.activo !== false;

        return `
            <tr>
                <td>
                    <strong>${usuario.nombre}</strong>
                </td>
                <td>${usuario.email}</td>
                <td>
                    <span class="badge ${esAdmin ? 'badge-admin' : 'badge-operador'}">
                        ${esAdmin ? 'Administrador' : 'Operador'}
                    </span>
                </td>
                <td>
                    <span class="badge ${esActivo ? 'badge-activo' : 'badge-inactivo'}">
                        ${esActivo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="authSystem.editarPermisosUsuario('${usuario.uid}')">
                        Configurar Permisos
                    </button>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-warning" 
                                onclick="authSystem.editarUsuario('${usuario.uid}')">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-outline-danger" 
                                onclick="authSystem.eliminarUsuario('${usuario.uid}')">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Obtener todos los usuarios
     */
    async obtenerTodosUsuarios() {
        try {
            const snapshot = await db.collection('usuarios').get();
            const usuarios = [];

            snapshot.forEach(doc => {
                usuarios.push({
                    uid: doc.id,
                    ...doc.data()
                });
            });

            return usuarios;
        } catch (error) {
            console.error('❌ Error al obtener usuarios:', error);
            return [];
        }
    }

    /**
     * Editar permisos de un usuario
     */
    async editarPermisosUsuario(uid) {
        try {
            const usuarioRef = db.collection('usuarios').doc(uid);
            const usuarioDoc = await usuarioRef.get();

            if (!usuarioDoc.exists) {
                alert('Usuario no encontrado');
                return;
            }

            const usuario = usuarioDoc.data();
            const permisosActuales = usuario.permisos || this.generarPermisosPorDefecto();

            // Crear modal de permisos
            const modalHTML = `
                <div class="modal fade auth-modal" id="permisosModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">🔐 Permisos: ${usuario.nombre}</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="permission-group">
                                    <h6>Permisos por Pestaña</h6>
                                    ${this.tabs.map(tab => `
                                        <div class="permission-item">
                                            <label>
                                                ${tab.icono} ${tab.nombre}
                                            </label>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="permiso_ver_${tab.id}" 
                                                       ${permisosActuales[tab.id]?.ver ? 'checked' : ''}>
                                                <label class="form-check-label" for="permiso_ver_${tab.id}">
                                                    Ver
                                                </label>
                                            </div>
                                            <div class="form-check form-check-inline">
                                                <input class="form-check-input" type="checkbox" 
                                                       id="permiso_editar_${tab.id}"
                                                       ${permisosActuales[tab.id]?.editar ? 'checked' : ''}>
                                                <label class="form-check-label" for="permiso_editar_${tab.id}">
                                                    Editar
                                                </label>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" onclick="authSystem.guardarPermisos('${uid}')">
                                    Guardar Permisos
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Eliminar modal anterior si existe
            const modalExistente = document.getElementById('permisosModal');
            if (modalExistente) modalExistente.remove();

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            const modal = new bootstrap.Modal(document.getElementById('permisosModal'));
            modal.show();

        } catch (error) {
            console.error('❌ Error al editar permisos:', error);
            alert('Error al cargar permisos del usuario');
        }
    }

    /**
     * Guardar permisos modificados
     */
    async guardarPermisos(uid) {
        try {
            const nuevosPermisos = {};

            this.tabs.forEach(tab => {
                const verCheckbox = document.getElementById(`permiso_ver_${tab.id}`);
                const editarCheckbox = document.getElementById(`permiso_editar_${tab.id}`);

                nuevosPermisos[tab.id] = {
                    ver: verCheckbox?.checked || false,
                    editar: editarCheckbox?.checked || false
                };
            });

            await db.collection('usuarios').doc(uid).update({
                permisos: nuevosPermisos
            });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('permisosModal'));
            if (modal) modal.hide();

            // Recargar panel de usuarios
            setTimeout(() => {
                this.mostrarPanelUsuarios();
            }, 500);

            alert('✅ Permisos actualizados correctamente');

        } catch (error) {
            console.error('❌ Error al guardar permisos:', error);
            alert('Error al guardar permisos');
        }
    }

    /**
     * Cerrar sesión
     */
    async cerrarSesion() {
        try {
            await auth.signOut();
            console.log('✅ Sesión cerrada');
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            alert('Error al cerrar sesión');
        }
    }

    /**
     * Configurar eventos de gestión de usuarios
     */
    configurarEventosGestionUsuarios() {
        // Configurar formulario de nuevo usuario
        document.getElementById('formNuevoUsuario')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.crearNuevoUsuario(e.target);
        });
    }

    /**
     * Crear nuevo usuario
     */
    async crearNuevoUsuario(form) {
        const email = form[0].value;
        const nombre = form[1].value;
        const rol = form[2].value;

        try {
            // Generar contraseña temporal
            const passwordTemp = this.generarPasswordTemporal();

            // Crear usuario en Firebase Auth
            const credencial = await auth.createUserWithEmailAndPassword(email, passwordTemp);

            // Crear documento en Firestore
            await db.collection('usuarios').doc(credencial.user.uid).set({
                email: email,
                nombre: nombre,
                rol: rol,
                activo: true,
                fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
                ultimoAcceso: null,
                permisos: this.generarPermisosPorDefecto()
            });

            alert(`✅ Usuario creado\nEmail: ${email}\nContraseña temporal: ${passwordTemp}`);

            // Recargar panel
            this.mostrarPanelUsuarios();

        } catch (error) {
            console.error('❌ Error al crear usuario:', error);
            alert('Error al crear usuario: ' + error.message);
        }
    }

    /**
     * Generar contraseña temporal
     */
    generarPasswordTemporal() {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';

        for (let i = 0; i < 8; i++) {
            password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }

        return password + '1!'; // Agregar un número y símbolo para cumplir requisitos
    }

    /**
     * Verificar si está autenticado
     */
    estaAutenticado() {
        return this.usuarioActual !== null;
    }

    /**
     * Es administrador
     */
    esAdmin() {
        return this.usuarioData?.rol === 'admin';
    }

    /**
     * Obtener datos del usuario actual
     */
    obtenerUsuarioActual() {
        return {
            ...this.usuarioData,
            email: this.usuarioActual?.email,
            uid: this.usuarioActual?.uid
        };
    }
}

// ============================================
// INICIALIZACIÓN Y EXPORTACIÓN
// ============================================

// Crear instancia global
const authSystem = new SistemaAutenticacionAvanzado();

// Hacer disponible globalmente
window.authSystem = authSystem;

// Funciones auxiliares globales
window.cerrarSesion = () => authSystem.cerrarSesion();
window.mostrarPanelUsuarios = () => authSystem.mostrarPanelUsuarios();

console.log('✅ Sistema de autenticación avanzado cargado');