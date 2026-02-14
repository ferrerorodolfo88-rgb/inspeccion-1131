// ========================================
// APLICACIÓN PRINCIPAL - INSPECCIÓN 1131
// Sistema de Registro Documental con Firebase
// ========================================

(function() {
    'use strict';

    // ========================================
    // ESTADO DE LA APLICACIÓN
    // ========================================
    
    let currentUser = null;
    let registrosListener = null;
    let allRegistros = [];
    let filteredRegistros = [];
    let pendingAttachments = [];
    let editPendingAttachments = [];

    // ========================================
    // INICIALIZACIÓN
    // ========================================
    
    function init() {
        setupAuthListener();
        setupEventListeners();
        setDefaultDate();
    }

    function setupAuthListener() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                loadUserData(user);
            } else {
                currentUser = null;
                showScreen('login');
                if (registrosListener) {
                    registrosListener();
                }
            }
        });
    }

    async function loadUserData(user) {
        try {
            showLoading('Cargando datos...');
            
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (userDoc.exists) {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    ...userDoc.data()
                };
            } else {
                currentUser = {
                    uid: user.uid,
                    email: user.email,
                    name: user.email.split('@')[0],
                    role: 'user',
                    createdAt: new Date().toISOString()
                };
                
                await db.collection('usuarios').doc(user.uid).set(currentUser);
            }

            updateUI();
            showScreen('main');
            setupRegistrosListener();
            hideLoading();
        } catch (error) {
            console.error('Error al cargar datos:', error);
            showMessage('Error al cargar datos del usuario', 'error');
            hideLoading();
        }
    }

    function setupRegistrosListener() {
        if (registrosListener) {
            registrosListener();
        }

        registrosListener = db.collection('registros')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                allRegistros = [];
                snapshot.forEach((doc) => {
                    allRegistros.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                applyFilters();
            }, (error) => {
                console.error('Error en listener:', error);
                showMessage('Error al sincronizar datos', 'error');
            });
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    
    function setupEventListeners() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        
        // Register Form
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        
        // New Record Form
        document.getElementById('new-registro-form').addEventListener('submit', handleNewRegistro);
        
        // Edit Record Form
        document.getElementById('edit-registro-form').addEventListener('submit', handleEditRegistro);
        
        // File Upload
        document.getElementById('new-adjuntos').addEventListener('change', (e) => {
            handleFileSelect(e, pendingAttachments, 'file-list-container');
        });
        
        // Back button handling
        window.addEventListener('popstate', handleBackButton);
    }

    function setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('new-fecha').value = today;
    }

    // ========================================
    // AUTENTICACIÓN
    // ========================================
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            showMessage('Por favor complete todos los campos', 'error');
            return;
        }

        showLoading('Iniciando sesión...');

        try {
            await auth.signInWithEmailAndPassword(email, password);
            showMessage('Bienvenido!', 'success');
        } catch (error) {
            console.error('Error login:', error);
            let errorMsg = 'Error al iniciar sesión';
            
            if (error.code === 'auth/user-not-found') {
                errorMsg = 'Usuario no encontrado';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Contraseña incorrecta';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Email inválido';
            } else if (error.code === 'auth/user-disabled') {
                errorMsg = 'Usuario deshabilitado';
            }
            
            showMessage(errorMsg, 'error');
            hideLoading();
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;

        if (!name || !email || !password) {
            showMessage('Por favor complete todos los campos', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        showLoading('Creando cuenta...');

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            
            await db.collection('usuarios').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                role: role,
                createdAt: new Date().toISOString()
            });

            showMessage('Cuenta creada exitosamente!', 'success');
        } catch (error) {
            console.error('Error registro:', error);
            let errorMsg = 'Error al crear cuenta';
            
            if (error.code === 'auth/email-already-in-use') {
                errorMsg = 'El email ya está registrado';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Email inválido';
            } else if (error.code === 'auth/weak-password') {
                errorMsg = 'Contraseña muy débil';
            }
            
            showMessage(errorMsg, 'error');
            hideLoading();
        }
    }

    function logout() {
        if (confirm('¿Está seguro que desea cerrar sesión?')) {
            showLoading('Cerrando sesión...');
            auth.signOut()
                .then(() => {
                    showMessage('Sesión cerrada', 'success');
                    hideLoading();
                })
                .catch((error) => {
                    console.error('Error logout:', error);
                    showMessage('Error al cerrar sesión', 'error');
                    hideLoading();
                });
        }
    }

    // ========================================
    // MANEJO DE REGISTROS
    // ========================================
    
    async function handleNewRegistro(e) {
        e.preventDefault();
        
        const tipo = document.getElementById('new-tipo').value;
        const fecha = document.getElementById('new-fecha').value;
        const destinatario = document.getElementById('new-destinatario').value.trim();
        const asunto = document.getElementById('new-asunto').value.trim();
        const numero = document.getElementById('new-numero').value.trim();
        const observaciones = document.getElementById('new-observaciones').value.trim();

        if (!tipo || !fecha || !destinatario || !asunto) {
            showMessage('Complete los campos obligatorios', 'error');
            return;
        }

        showLoading('Guardando registro...');

        try {
            const registro = {
                tipo: tipo,
                fecha: fecha,
                destinatario: destinatario,
                asunto: asunto,
                numero: numero || '',
                observaciones: observaciones || '',
                createdBy: currentUser.uid,
                createdByName: currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('registros').add(registro);
            
            showMessage('Registro guardado exitosamente', 'success');
            closeNewRegistroModal();
            
            document.getElementById('new-registro-form').reset();
            setDefaultDate();
            pendingAttachments = [];
            
        } catch (error) {
            console.error('Error al guardar:', error);
            showMessage('Error al guardar el registro', 'error');
        }
        
        hideLoading();
    }

    async function handleEditRegistro(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const tipo = document.getElementById('edit-tipo').value;
        const fecha = document.getElementById('edit-fecha').value;
        const destinatario = document.getElementById('edit-destinatario').value.trim();
        const asunto = document.getElementById('edit-asunto').value.trim();
        const numero = document.getElementById('edit-numero').value.trim();
        const observaciones = document.getElementById('edit-observaciones').value.trim();

        if (!tipo || !fecha || !destinatario || !asunto) {
            showMessage('Complete los campos obligatorios', 'error');
            return;
        }

        showLoading('Actualizando registro...');

        try {
            await db.collection('registros').doc(id).update({
                tipo: tipo,
                fecha: fecha,
                destinatario: destinatario,
                asunto: asunto,
                numero: numero || '',
                observaciones: observaciones || '',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showMessage('Registro actualizado exitosamente', 'success');
            closeEditRegistroModal();
            
        } catch (error) {
            console.error('Error al actualizar:', error);
            showMessage('Error al actualizar el registro', 'error');
        }
        
        hideLoading();
    }

    async function deleteRegistro(id) {
        if (!confirm('¿Está seguro de eliminar este registro?')) {
            return;
        }

        showLoading('Eliminando registro...');

        try {
            await db.collection('registros').doc(id).delete();
            showMessage('Registro eliminado', 'success');
        } catch (error) {
            console.error('Error al eliminar:', error);
            showMessage('Error al eliminar el registro', 'error');
        }
        
        hideLoading();
    }

    function editRegistro(id) {
        const registro = allRegistros.find(r => r.id === id);
        if (!registro) return;

        document.getElementById('edit-id').value = id;
        document.getElementById('edit-tipo').value = registro.tipo;
        document.getElementById('edit-fecha').value = registro.fecha;
        document.getElementById('edit-destinatario').value = registro.destinatario;
        document.getElementById('edit-asunto').value = registro.asunto;
        document.getElementById('edit-numero').value = registro.numero || '';
        document.getElementById('edit-observaciones').value = registro.observaciones || '';

        document.getElementById('edit-registro-modal').classList.add('active');
    }

    function showDetail(id) {
        const registro = allRegistros.find(r => r.id === id);
        if (!registro) return;

        const content = `
            <div class="detail-section">
                <h4>Tipo de Documento</h4>
                <p><span class="registro-type-badge" style="background:${getDocTypeColor(registro.tipo)}">${getDocTypeName(registro.tipo)}</span></p>
            </div>
            <div class="detail-section">
                <h4>Fecha</h4>
                <p>📅 ${formatDate(registro.fecha)}</p>
            </div>
            <div class="detail-section">
                <h4>Destinatario</h4>
                <p>👤 ${registro.destinatario}</p>
            </div>
            <div class="detail-section">
                <h4>Asunto</h4>
                <p>${registro.asunto}</p>
            </div>
            ${registro.numero ? `
            <div class="detail-section">
                <h4>Nº Expediente/Nota</h4>
                <p>📄 ${registro.numero}</p>
            </div>
            ` : ''}
            ${registro.observaciones ? `
            <div class="detail-section">
                <h4>Observaciones</h4>
                <p>${registro.observaciones}</p>
            </div>
            ` : ''}
            <div class="detail-section">
                <h4>Creado por</h4>
                <p>👤 ${registro.createdByName || 'Usuario'}</p>
            </div>
            <div class="detail-section">
                <h4>Fecha de Creación</h4>
                <p>🕒 ${registro.createdAt ? formatDateTime(registro.createdAt.toDate()) : 'N/A'}</p>
            </div>
        `;

        document.getElementById('detail-content').innerHTML = content;
        document.getElementById('detail-modal').classList.add('active');
    }

    // ========================================
    // RENDERIZADO
    // ========================================
    
    function renderRegistros() {
        const container = document.getElementById('registros-container');
        
        if (filteredRegistros.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No hay registros</h3>
                    <p>Comienza agregando tu primer documento</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredRegistros.map(reg => `
            <div class="registro-card" style="border-left-color:${getDocTypeColor(reg.tipo)}" onclick="showDetail('${reg.id}')">
                <div class="registro-header">
                    <span class="registro-type-badge" style="background:${getDocTypeColor(reg.tipo)}">
                        ${getDocTypeShort(reg.tipo)}
                    </span>
                    <div class="registro-actions" onclick="event.stopPropagation()">
                        <button class="btn-icon-small" onclick="editRegistro('${reg.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="btn-icon-small" onclick="deleteRegistro('${reg.id}')" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="registro-content">
                    <h3>${reg.asunto}</h3>
                    <div class="registro-meta">
                        <span>📅 ${formatDate(reg.fecha)}</span>
                        <span>👤 ${reg.destinatario}</span>
                        ${reg.numero ? `<span>📄 ${reg.numero}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ========================================
    // BÚSQUEDA Y FILTROS
    // ========================================
    
    function applyFilters() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const filterType = document.getElementById('filter-type').value;

        filteredRegistros = allRegistros.filter(reg => {
            const matchesSearch = !searchTerm || 
                reg.asunto.toLowerCase().includes(searchTerm) ||
                reg.destinatario.toLowerCase().includes(searchTerm) ||
                (reg.numero && reg.numero.toLowerCase().includes(searchTerm)) ||
                (reg.observaciones && reg.observaciones.toLowerCase().includes(searchTerm));
            
            const matchesType = !filterType || reg.tipo === filterType;

            return matchesSearch && matchesType;
        });

        renderRegistros();
    }

    // ========================================
    // ESTADÍSTICAS
    // ========================================
    
    function showStats() {
        const stats = calculateStats();
        
        const content = Object.entries(stats.porTipo).map(([tipo, count]) => `
            <div class="stat-card" style="border-top-color:${getDocTypeColor(tipo)}">
                <div class="stat-value">${count}</div>
                <div class="stat-label">${getDocTypeName(tipo)}</div>
            </div>
        `).join('');

        document.getElementById('stats-content').innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Total Registros</div>
            </div>
            ${content}
        `;

        document.getElementById('stats-modal').classList.add('active');
    }

    function closeStatsModal() {
        document.getElementById('stats-modal').classList.remove('active');
    }

    function calculateStats() {
        const stats = {
            total: allRegistros.length,
            porTipo: {}
        };

        allRegistros.forEach(reg => {
            stats.porTipo[reg.tipo] = (stats.porTipo[reg.tipo] || 0) + 1;
        });

        return stats;
    }

    function updateProfileStats() {
        const userRegistros = allRegistros.filter(r => r.createdBy === currentUser.uid);
        const stats = {
            total: userRegistros.length,
            porTipo: {}
        };

        userRegistros.forEach(reg => {
            stats.porTipo[reg.tipo] = (stats.porTipo[reg.tipo] || 0) + 1;
        });

        const content = `
            <div class="stat-card">
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Mis Registros</div>
            </div>
            ${Object.entries(stats.porTipo).map(([tipo, count]) => `
                <div class="stat-card" style="border-top-color:${getDocTypeColor(tipo)}">
                    <div class="stat-value">${count}</div>
                    <div class="stat-label">${getDocTypeName(tipo)}</div>
                </div>
            `).join('')}
        `;

        document.getElementById('profile-stats').innerHTML = content;
    }

    // ========================================
    // EXPORTACIÓN
    // ========================================
    
    function exportToCSV() {
        if (filteredRegistros.length === 0) {
            showMessage('No hay datos para exportar', 'error');
            return;
        }

        showLoading('Generando CSV...');

        setTimeout(() => {
            const headers = ['Tipo', 'Fecha', 'Destinatario', 'Asunto', 'Nº Documento', 'Observaciones', 'Creado por'];
            const rows = filteredRegistros.map(reg => [
                getDocTypeName(reg.tipo),
                formatDate(reg.fecha),
                reg.destinatario,
                reg.asunto,
                reg.numero || '',
                reg.observaciones || '',
                reg.createdByName || 'N/A'
            ]);

            let csv = headers.join(',') + '\n';
            rows.forEach(row => {
                csv += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const fecha = new Date().toISOString().split('T')[0];
            
            link.setAttribute('href', url);
            link.setAttribute('download', `registros_${fecha}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showMessage('CSV exportado exitosamente', 'success');
            hideLoading();
        }, 500);
    }

    function exportToPDF() {
        if (filteredRegistros.length === 0) {
            showMessage('No hay datos para exportar', 'error');
            return;
        }

        showLoading('Generando PDF...');

        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF('l', 'mm', 'a4');

                doc.setFontSize(16);
                doc.text('Inspección 1131 - Registro Documental', 14, 15);
                
                doc.setFontSize(10);
                doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, 14, 22);

                const tableData = filteredRegistros.map(reg => [
                    formatDate(reg.fecha),
                    getDocTypeShort(reg.tipo),
                    reg.destinatario.substring(0, 25),
                    reg.asunto.substring(0, 50),
                    reg.numero || '-',
                    reg.createdByName || 'N/A'
                ]);

                doc.autoTable({
                    startY: 28,
                    head: [['Fecha', 'Tipo', 'Destinatario', 'Asunto', 'Nº Doc', 'Usuario']],
                    body: tableData,
                    styles: {
                        fontSize: 8,
                        cellPadding: 2
                    },
                    headStyles: {
                        fillColor: [0, 69, 130],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    }
                });

                const fecha = new Date().toISOString().split('T')[0];
                doc.save(`registros_${fecha}.pdf`);

                showMessage('PDF exportado exitosamente', 'success');
            } catch (error) {
                console.error('Error al generar PDF:', error);
                showMessage('Error al generar PDF', 'error');
            }
            hideLoading();
        }, 500);
    }

    // ========================================
    // TABS Y NAVEGACIÓN
    // ========================================
    
    function switchTab(tab) {
        const loginTab = document.querySelectorAll('.login-tab')[0];
        const registerTab = document.querySelectorAll('.login-tab')[1];
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        }
    }

    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`${screenName}-screen`).classList.add('active');
        
        if (screenName === 'main') {
            renderRegistros();
            updateActiveNav('nav-home');
        } else if (screenName === 'profile') {
            updateProfileInfo();
            updateProfileStats();
            updateActiveNav('nav-profile');
        }
    }

    function updateActiveNav(activeId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const navItem = document.getElementById(activeId);
        if (navItem) navItem.classList.add('active');
    }

    function updateUI() {
        if (!currentUser) return;
        document.getElementById('user-name-header').textContent = currentUser.name;
        renderRegistros();
    }

    function updateProfileInfo() {
        if (!currentUser) return;
        
        const initials = currentUser.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        
        document.getElementById('profile-initials').textContent = initials;
        document.getElementById('profile-name').textContent = currentUser.name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-role').textContent = getRoleName(currentUser.role);
    }

    // ========================================
    // MODALES
    // ========================================
    
    function openNewRegistroModal() {
        pendingAttachments = [];
        renderFileList(pendingAttachments, 'file-list-container');
        document.getElementById('new-registro-modal').classList.add('active');
    }

    function closeNewRegistroModal() {
        document.getElementById('new-registro-modal').classList.remove('active');
        pendingAttachments = [];
        renderFileList(pendingAttachments, 'file-list-container');
    }

    function closeEditRegistroModal() {
        document.getElementById('edit-registro-modal').classList.remove('active');
        editPendingAttachments = [];
    }

    function closeDetailModal() {
        document.getElementById('detail-modal').classList.remove('active');
    }

    // ========================================
    // MANEJO DE ARCHIVOS
    // ========================================
    
    function handleFileSelect(e, attachmentsArray, containerId) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                showMessage(`El archivo ${file.name} es muy grande (máx 10MB)`, 'error');
                return;
            }
            
            attachmentsArray.push({
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            });
        });

        renderFileList(attachmentsArray, containerId);
        e.target.value = '';
    }

    function renderFileList(attachmentsArray, containerId) {
        const container = document.getElementById(containerId);
        
        if (!attachmentsArray.length) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = attachmentsArray.map((att, index) => `
            <div class="file-item">
                <span>📎 ${att.name} (${formatFileSize(att.size)})</span>
                <button type="button" onclick="removeFile(${index}, '${containerId}')">Eliminar</button>
            </div>
        `).join('');
    }

    function removeFile(index, containerId) {
        const attachmentsArray = containerId === 'file-list-container' 
            ? pendingAttachments 
            : editPendingAttachments;
        
        attachmentsArray.splice(index, 1);
        renderFileList(attachmentsArray, containerId);
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ========================================
    // UTILIDADES
    // ========================================
    
    function showLoading(text = 'Cargando...') {
        document.getElementById('loading-text').textContent = text;
        document.getElementById('loading-screen').classList.add('active');
    }

    function hideLoading() {
        document.getElementById('loading-screen').classList.remove('active');
    }

    function showMessage(text, type = 'success') {
        const msg = document.getElementById(`message-${type}`);
        msg.textContent = text;
        msg.style.display = 'block';
        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
    }

    function getDocTypeName(type) {
        const names = {
            'nota': 'Nota',
            'informe': 'Informe',
            'expediente': 'Expediente',
            'acta': 'Acta',
            'circular': 'Circular',
            'cap': 'CAP',
            'otro': 'Otro'
        };
        return names[type] || type;
    }

    function getDocTypeShort(type) {
        const names = {
            'nota': 'NTA',
            'informe': 'INF',
            'expediente': 'EXP',
            'acta': 'ACT',
            'circular': 'CIR',
            'cap': 'CAP',
            'otro': 'OTR'
        };
        return names[type] || type;
    }

    function getDocTypeColor(type) {
        const colors = {
            'nota': '#009ADA',
            'informe': '#AF4178',
            'expediente': '#E2464C',
            'acta': '#EB7F27',
            'circular': '#F7BE2B',
            'cap': '#32A430',
            'otro': '#757575'
        };
        return colors[type] || '#757575';
    }

    function getRoleName(role) {
        const names = {
            'admin': 'Administrador',
            'supervisor': 'Supervisor',
            'user': 'Usuario'
        };
        return names[role] || role;
    }

    function formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    function formatDateTime(date) {
        try {
            return date.toLocaleString('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'N/A';
        }
    }

    function handleBackButton(e) {
        if (document.getElementById('detail-modal').classList.contains('active')) {
            closeDetailModal();
            e.preventDefault();
        } else if (document.getElementById('new-registro-modal').classList.contains('active')) {
            closeNewRegistroModal();
            e.preventDefault();
        } else if (document.getElementById('edit-registro-modal').classList.contains('active')) {
            closeEditRegistroModal();
            e.preventDefault();
        } else if (document.getElementById('stats-modal').classList.contains('active')) {
            closeStatsModal();
            e.preventDefault();
        } else if (document.getElementById('profile-screen').classList.contains('active')) {
            showScreen('main');
            e.preventDefault();
        }
    }

    // ========================================
    // EXPONER FUNCIONES GLOBALMENTE
    // ========================================
    
    window.switchTab = switchTab;
    window.closeNewRegistroModal = closeNewRegistroModal;
    window.closeEditRegistroModal = closeEditRegistroModal;
    window.closeDetailModal = closeDetailModal;
    window.closeStatsModal = closeStatsModal;
    window.showDetail = showDetail;
    window.deleteRegistro = deleteRegistro;
    window.editRegistro = editRegistro;
    window.logout = logout;
    window.showScreen = showScreen;
    window.showStats = showStats;
    window.exportToCSV = exportToCSV;
    window.exportToPDF = exportToPDF;
    window.applyFilters = applyFilters;
    window.openNewRegistroModal = openNewRegistroModal;
    window.removeFile = removeFile;

    // ========================================
    // INICIAR APLICACIÓN
    // ========================================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
