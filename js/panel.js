// ============================================
// PANEL DE CONTROL RESTAURANTE DELUXE - JavaScript
// VERSIÓN COMPLETA CON FIREBASE
// ============================================
//
// REGLAS ABSOLUTAS:
// 1. TODA la lógica y decisiones se hacen desde el PANEL
// 2. Firebase solo guarda y devuelve datos (almacenamiento)
// 3. NADA cambia automáticamente
// 4. NO simulaciones, NO contadores falsos, NO cambios automáticos
// 5. TODO cambio debe venir de un clic en el panel
//
// COLECCIONES FIREBASE:
// - orders: Pedidos (estados: pending, preparing, cooking, ready, delivered, cancelled)
// - products: Productos del menú
// - inventory: Inventario
// - tables: Mesas
// - employees/staff: Personal
// - reservations: Reservas
// - notifications: Notificaciones
//
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const PANEL_CONFIG = {
    UPDATE_INTERVAL: 10000, // 10 segundos
    MAX_TABLES: 12
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let activeOrders = [];
let tables = [];
let updateInterval;
let currentSection = 'dashboard';

// ============================================
// SISTEMA DE NAVEGACIÓN
// ============================================
function setupNavigation() {
    // Configurar todos los enlaces del menú lateral
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const section = href.substring(1); // Quitar el #
                navigateToSection(section);
            }
        });
    });
    
    // Actualizar título de página según sección
    updatePageTitle();
}

function navigateToSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.panel-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Actualizar título
        updatePageTitle();
        
        // Actualizar menú lateral
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionName}`) {
                link.classList.add('active');
            }
        });
        
        // Cargar datos de la sección
        loadSectionData(sectionName);
    }
}

function updatePageTitle() {
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Pedidos Activos',
        'tables': 'Mesas',
        'menu': 'Menú',
        'inventory': 'Inventario',
        'employees': 'Personal',
        'reservations': 'Reservas',
        'reports': 'Reportes',
        'settings': 'Ajustes',
        'qr': 'Códigos QR',
        'notifications': 'Notificaciones'
    };
    
    const titleEl = document.querySelector('.page-title');
    if (titleEl) {
        titleEl.textContent = titles[currentSection] || 'Panel de Control';
    }
}

function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            updateDashboardStats();
            loadDashboardOrders();
            break;
        case 'orders':
            // Ya se carga automáticamente con el listener
            break;
        case 'tables':
            loadTablesStatus();
            break;
        case 'menu':
            loadMenuProducts();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'employees':
            loadEmployees();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'reports':
            loadReports('day');
            break;
        case 'qr':
            loadQRCodes();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// Exportar para uso en onclick
window.navigateToSection = navigateToSection;

// ============================================
// INICIALIZACIÓN
// ============================================
function initializePanel() {
    console.log('🚀 Iniciando panel de control con Firebase...');
    
    // Inicializar arrays vacíos para evitar valores undefined
    activeOrders = [];
    tables = [];
    
    // Configurar eventos (setupNavigation se llama dentro de setupEventListeners)
    setupEventListeners();
    
    // Inicializar badges a 0
    updateOrdersBadge();
    updateTablesBadge();
    updateInventoryBadge();
    updateReservationsBadge();
    updateNotificationsBadge();
    
    // Mostrar sección Dashboard por defecto
    navigateToSection('dashboard');
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Iniciar listeners de solo lectura (sin lógica automática)
    startAutoUpdates();
    
    console.log('✅ Panel inicializado');
}

function setupEventListeners() {
    // Ya está configurado en initializePanel
    
    // Botón de menú
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Botón de actualizar
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadInitialData);
    }
    
    // Botón de actualizar mesas
    const refreshTablesBtn = document.getElementById('refreshTablesBtn');
    if (refreshTablesBtn) {
        refreshTablesBtn.addEventListener('click', loadTablesStatus);
    }
    
    // Botón nuevo pedido
    const newOrderBtn = document.getElementById('newOrderBtn');
    if (newOrderBtn) {
        newOrderBtn.addEventListener('click', () => {
            showNewOrderModal();
        });
    }
    
    // Modal nuevo pedido
    const newOrderModalClose = document.getElementById('newOrderModalClose');
    if (newOrderModalClose) {
        newOrderModalClose.addEventListener('click', () => {
            document.getElementById('newOrderModal').style.display = 'none';
        });
    }
    
    const cancelNewOrder = document.getElementById('cancelNewOrder');
    if (cancelNewOrder) {
        cancelNewOrder.addEventListener('click', () => {
            document.getElementById('newOrderModal').style.display = 'none';
        });
    }
    
    const createNewOrder = document.getElementById('createNewOrder');
    if (createNewOrder) {
        createNewOrder.addEventListener('click', handleCreateNewOrder);
    }
    
    // Botones de notificaciones y ayuda
    const notificationsBtn = document.getElementById('notificationsBtn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
            showNotification('No hay nuevas notificaciones', 'info');
        });
    }
    
    const helpBtn = document.getElementById('helpBtn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            showNotification('Para ayuda contacta al administrador', 'info');
        });
    }
    
    // Botones del modal
    const modalCancel = document.getElementById('modalCancel');
    if (modalCancel) {
        modalCancel.addEventListener('click', closeOrderModal);
    }
    
    const modalAction = document.getElementById('modalAction');
    if (modalAction) {
        modalAction.addEventListener('click', () => {
            // La acción se configura dinámicamente en viewOrderDetail
        });
    }
    
    // Cerrar modal al hacer clic fuera
    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
        orderModal.addEventListener('click', (e) => {
            if (e.target === orderModal) {
                closeOrderModal();
            }
        });
    }
    
    const newOrderModal = document.getElementById('newOrderModal');
    if (newOrderModal) {
        newOrderModal.addEventListener('click', (e) => {
            if (e.target === newOrderModal) {
                newOrderModal.style.display = 'none';
            }
        });
    }
    
    // Botón ver todas las mesas
    const viewAllTablesBtn = document.getElementById('viewAllTablesBtn');
    if (viewAllTablesBtn) {
        viewAllTablesBtn.addEventListener('click', () => {
            showNotification('Vista expandida de mesas (en desarrollo)', 'info');
        });
    }
    
    // Botón ordenar suministros
    const orderSuppliesBtn = document.getElementById('orderSuppliesBtn');
    if (orderSuppliesBtn) {
        orderSuppliesBtn.addEventListener('click', () => {
            showNotification('Funcionalidad de inventario (en desarrollo)', 'info');
        });
    }
    
    // Botones de agregar por sección
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => showAddProductModal());
    }
    
    const addInventoryItemBtn = document.getElementById('addInventoryItemBtn');
    if (addInventoryItemBtn) {
        addInventoryItemBtn.addEventListener('click', () => showAddInventoryModal());
    }
    
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => showAddEmployeeModal());
    }
    
    const addReservationBtn = document.getElementById('addReservationBtn');
    if (addReservationBtn) {
        addReservationBtn.addEventListener('click', () => showAddReservationModal());
    }
    
    // Filtros de pedidos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            filterOrders(filter);
        });
    });
    
    // Cerrar modal
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
        modalClose.addEventListener('click', closeOrderModal);
    }
}

// ============================================
// FUNCIONES DE DATOS CON FIREBASE
// ============================================
async function loadInitialData() {
    try {
        showNotification('Cargando datos desde Firebase...', 'info');
        
        // Inicializar arrays vacíos para evitar undefined
        if (!activeOrders) activeOrders = [];
        if (!tables) tables = [];
        
        await Promise.all([
            loadActiveOrders(), // Esto configura el listener en tiempo real
            loadTablesStatus()
        ]);
        
        // Actualizar todos los badges
        updateOrdersBadge();
        updateTablesBadge();
        await updateInventoryBadge();
        await updateReservationsBadge();
        await updateNotificationsBadge();
        
        await updateDashboardStats();
        showNotification('Sistema conectado en tiempo real', 'success');
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error al cargar datos', 'error');
        
        // Asegurar que los badges muestren 0 si hay error
        updateOrdersBadge();
        updateTablesBadge();
    }
}

// Variable para el listener de pedidos
let ordersListener = null;

async function loadActiveOrders() {
    // Si ya hay un listener activo, no crear otro
    if (ordersListener) {
        return;
    }
    
    try {
        console.log('Configurando listener en tiempo real de pedidos...');
        
        // REGLA: Listener de SOLO LECTURA - no ejecuta lógica, solo actualiza vista
        // Incluir todos los estados: pending, preparing, cooking, ready, delivered
        ordersListener = db.collection('orders')
            .where('status', 'in', ['pending', 'preparing', 'cooking', 'ready', 'delivered'])
            .orderBy('createdAt', 'desc')
            .onSnapshot((querySnapshot) => {
                console.log('📖 Lectura en tiempo real de pedidos (solo visualización)');
                
                // Solo actualizar datos visuales - NO lógica automática
                activeOrders = [];
                
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    activeOrders.push({
                        ID: doc.id,
                        Mesa: data.table || '',
                        Productos: data.products || '',
                        Total: data.total || 0,
                        Estado: data.status || 'pending',
                        Código: data.code || '000000',
                        Fecha: data.createdAt ? data.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
                        Hora: data.createdAt ? data.createdAt.toDate().toLocaleTimeString() : new Date().toLocaleTimeString(),
                        createdAt: data.createdAt
                    });
                });
                
                // Solo actualizar vista - NO cambios automáticos de estado
                renderOrdersTable();
                updateOrdersBadge();
                updateDashboardStats();
                
                // Actualizar estado de mesas (solo visual, sin lógica automática)
                updateTablesStatusFromOrders();
            }, (error) => {
                console.error('Error en listener de pedidos:', error);
                showNotification('Error escuchando pedidos', 'error');
            });
        
        return true;
        
    } catch (error) {
        console.error('Error configurando listener de pedidos:', error);
        showNotification('Error al cargar pedidos', 'error');
        return false;
    }
}

async function loadTablesStatus() {
    try {
        console.log('Cargando estado de mesas desde Firebase...');
        
        // Intentar cargar mesas desde Firebase
        try {
            const tablesSnapshot = await db.collection('tables').get();
            
            if (!tablesSnapshot.empty) {
                // Si hay mesas en Firebase, usarlas
                tables = [];
                tablesSnapshot.forEach(doc => {
                    const data = doc.data();
                    tables.push({
                        Mesa: data.number || doc.id,
                        Estado: data.status || 'available',
                        "Orden ID": data.orderId || '',
                        Capacidad: data.capacity || 4,
                        Ubicación: data.location || 'Sala Principal',
                        "Última Actualización": data.updatedAt ? data.updatedAt.toDate().toISOString() : new Date().toISOString()
                    });
                });
            } else {
                // Si no hay mesas en Firebase, crearlas automáticamente
                await createDefaultTables();
                // Luego calcular estado desde pedidos activos
                await updateTablesStatusFromOrders();
            }
        } catch (error) {
            console.log('No existe colección tables, creando mesas por defecto...');
            await createDefaultTables();
            await updateTablesStatusFromOrders();
        }
        
        updateTablesGrid();
        updateTablesBadge();
        return true;
        
    } catch (error) {
        console.error('Error cargando mesas:', error);
        // Si falla, calcular desde pedidos
        await updateTablesStatusFromOrders();
        updateTablesGrid();
        updateTablesBadge();
        return false;
    }
}

// Crear mesas por defecto si no existen y guardarlas en Firebase
// REGLA: Solo crear/guardar cuando no existen - no simulación, creación inicial de datos
async function createDefaultTables() {
    tables = [];
    
    // Crear array de mesas
    for (let i = 1; i <= PANEL_CONFIG.MAX_TABLES; i++) {
        const tableNum = i.toString().padStart(2, '0');
        tables.push({
            Mesa: tableNum,
            Estado: 'available',
            "Orden ID": '',
            Capacidad: 4,
            Ubicación: i <= 8 ? 'Sala Principal' : 'Terraza',
            "Última Actualización": new Date().toISOString()
        });
    }
    
    // Guardar mesas en Firebase si no existen
    try {
        const batch = db.batch();
        tables.forEach(table => {
            const tableRef = db.collection('tables').doc(table.Mesa);
            batch.set(tableRef, {
                number: table.Mesa,
                status: 'available',
                capacity: table.Capacidad,
                location: table.Ubicación,
                orderId: '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        await batch.commit();
        console.log('✅ Mesas creadas y guardadas en Firebase');
    } catch (error) {
        console.error('Error guardando mesas en Firebase:', error);
        // Continuar con mesas en memoria
    }
}

// Actualizar estado de mesas basado en pedidos activos
// REGLA: Solo lectura de datos - NO cambia estados automáticamente, solo refleja lo que está en Firebase
async function updateTablesStatusFromOrders() {
    try {
        // Leer pedidos activos desde Firebase (solo lectura)
        const activeOrdersSnapshot = await db.collection('orders')
            .where('status', 'in', ['pending', 'preparing', 'cooking', 'ready'])
            .get();
        
        const occupiedTables = new Set();
        const tableOrderMap = {};
        
        activeOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            const table = data.table || '';
            if (table) {
                occupiedTables.add(table);
                tableOrderMap[table] = doc.id;
            }
        });
        
        // Asegurar que las mesas existan
        if (tables.length === 0) {
            await createDefaultTables();
        }
        
        // Solo reflejar el estado actual desde Firebase - NO lógica automática
        tables.forEach(table => {
            if (occupiedTables.has(table.Mesa)) {
                table.Estado = 'occupied';
                table["Orden ID"] = tableOrderMap[table.Mesa] || '';
            } else {
                table.Estado = 'available';
                table["Orden ID"] = '';
            }
        });
        
        // Solo actualizar vista - NO cambios automáticos
        updateTablesGrid();
        updateTablesBadge();
        
    } catch (error) {
        console.error('Error leyendo estado de mesas desde Firebase:', error);
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (activeOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center" style="padding: 40px;">
                    <div style="font-size: 3rem; color: var(--panel-gray-300); margin-bottom: 16px;">
                        📭
                    </div>
                    <h3 style="color: var(--panel-gray-500); margin-bottom: 8px;">
                        No hay pedidos activos
                    </h3>
                    <p style="color: var(--panel-gray-400);">
                        Los pedidos aparecerán aquí cuando los clientes ordenen
                    </p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    activeOrders.forEach(order => {
        const status = getStatusBadge(order.Estado || 'pending');
        
        html += `
            <tr data-order-id="${order.ID}">
                <td>
                    <div class="font-semibold">${order.ID || ''}</div>
                    <div class="text-sm text-gray-500">${order.Código || ''}</div>
                </td>
                <td>
                    <div class="flex items-center gap-2">
                        <span class="text-lg">🪑</span>
                        <span class="font-semibold">${order.Mesa || ''}</span>
                    </div>
                </td>
                <td>
                    <div class="text-sm truncate max-w-xs" title="${order.Productos || ''}">
                        ${order.Productos || ''}
                    </div>
                </td>
                <td class="font-bold text-green-600">
                    $${parseFloat(order.Total || 0).toFixed(2)}
                </td>
                <td>
                    <span class="status-badge ${status.class}">
                        ${status.icon} ${status.text}
                    </span>
                </td>
                <td class="text-sm text-gray-500">
                    ${order.Hora || ''}
                </td>
                <td>
                    <div class="flex gap-2">
                        <button class="action-btn" onclick="viewOrderDetail('${order.ID}')" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.Estado === 'pending' ? `
                            <button class="action-btn btn-success" onclick="updateOrderStatus('${order.ID}', 'preparing')" title="Comenzar preparación">
                                <i class="fas fa-play"></i> Preparar
                            </button>
                        ` : ''}
                        ${order.Estado === 'preparing' ? `
                            <button class="action-btn btn-warning" onclick="updateOrderStatus('${order.ID}', 'cooking')" title="Poner en cocina">
                                <i class="fas fa-fire"></i> Cocinando
                            </button>
                        ` : ''}
                        ${order.Estado === 'cooking' ? `
                            <button class="action-btn btn-primary" onclick="updateOrderStatus('${order.ID}', 'ready')" title="Marcar como listo">
                                <i class="fas fa-check"></i> Listo
                            </button>
                        ` : ''}
                        ${order.Estado === 'ready' ? `
                            <button class="action-btn btn-success" onclick="updateOrderStatus('${order.ID}', 'delivered')" title="Marcar como entregado">
                                <i class="fas fa-truck"></i> Entregar
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function updateTablesGrid() {
    const grid = document.getElementById('tablesGrid');
    if (!grid) return;
    
    let html = '';
    
    tables.forEach(table => {
        const statusClass = table.Estado === 'available' ? 'available' : 
                          table.Estado === 'occupied' ? 'occupied' : 'reserved';
        
        const statusText = table.Estado === 'available' ? 'Disponible' : 
                          table.Estado === 'occupied' ? 'Ocupada' : 'Reservada';
        
        html += `
            <div class="table-item ${statusClass}" onclick="showTableInfo('${table.Mesa}')">
                <div class="table-number">${table.Mesa}</div>
                <div class="table-status">
                    ${statusText}
                </div>
                ${table["Orden ID"] ? `
                    <div class="text-xs mt-1">
                        📦 ${table["Orden ID"]}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

async function updateDashboardStats() {
    const stats = await calculateStats();
    const grid = document.getElementById('statsGrid');
    
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-receipt"></i>
                </div>
                <span class="stat-title">Pedidos Activos</span>
            </div>
            <div class="stat-value">${stats.activeOrders}</div>
            <div class="stat-change positive">
                <i class="fas fa-bell"></i>
                ${stats.pendingOrders} pendientes
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <span class="stat-title">Ventas Hoy</span>
            </div>
            <div class="stat-value">$${stats.todaySales.toFixed(2)}</div>
            <div class="stat-change positive">
                <i class="fas fa-chart-line"></i>
                ${stats.todayOrders} pedidos
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <span class="stat-title">Mesas Ocupadas</span>
            </div>
            <div class="stat-value">${stats.occupiedTables}/${PANEL_CONFIG.MAX_TABLES}</div>
            <div class="stat-change positive">
                <i class="fas fa-percentage"></i>
                ${stats.occupancyRate}% ocupación
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <span class="stat-title">Tiempo Promedio</span>
            </div>
            <div class="stat-value">${stats.avgTime} min</div>
            <div class="stat-change ${stats.avgTime > 0 ? 'positive' : 'neutral'}">
                <i class="fas fa-clock"></i>
                ${stats.avgTime > 0 ? `Promedio de hoy` : 'Sin datos aún'}
            </div>
        </div>
    `;
}

async function calculateStats() {
    const activeOrdersCount = activeOrders.length;
    const pendingOrders = activeOrders.filter(o => o.Estado === 'pending').length;
    const occupiedTables = tables.filter(t => t.Estado === 'occupied').length;
    const occupancyRate = Math.round((occupiedTables / PANEL_CONFIG.MAX_TABLES) * 100);
    
    // Calcular ventas del día desde Firestore
    let todaySales = 0;
    let todayOrdersCount = 0;
    let avgTime = 0;
    
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayOrdersSnapshot = await db.collection('orders')
            .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(today))
            .get();
        
        todayOrdersCount = todayOrdersSnapshot.size;
        
        todayOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            todaySales += parseFloat(data.total || 0);
            
            // Calcular tiempo promedio si el pedido fue entregado
            if (data.status === 'delivered' && data.createdAt && data.updatedAt) {
                const created = data.createdAt.toDate();
                const updated = data.updatedAt.toDate();
                const minutes = (updated - created) / (1000 * 60);
                if (minutes > 0) {
                    avgTime = (avgTime * (todayOrdersCount - 1) + minutes) / todayOrdersCount;
                }
            }
        });
    } catch (error) {
        console.error('Error calculando estadísticas:', error);
        // Usar solo pedidos activos como fallback
        todaySales = activeOrders.reduce((sum, order) => {
            return sum + parseFloat(order.Total || 0);
        }, 0);
        todayOrdersCount = activeOrdersCount;
    }
    
    return {
        activeOrders: activeOrdersCount,
        pendingOrders: pendingOrders,
        todaySales: todaySales,
        todayOrders: todayOrdersCount,
        occupiedTables: occupiedTables,
        occupancyRate: occupancyRate,
        avgTime: Math.round(avgTime) || 0
    };
}

// ============================================
// FUNCIONES DE PEDIDOS CON FIREBASE
// ============================================
async function updateOrderStatus(orderId, newStatus) {
    try {
        const order = activeOrders.find(o => o.ID === orderId);
        if (!order) {
            showNotification('Pedido no encontrado', 'error');
            return;
        }
        
        console.log(`Actualizando pedido ${orderId} a ${newStatus} en Firebase`);
        
        // Actualizar en Firebase
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Si se entregó o canceló, actualizar mesas
        if (newStatus === 'delivered' || newStatus === 'cancelled') {
            await updateTablesStatusFromOrders();
        }
        
        showNotification(`Pedido ${orderId} → ${newStatus}`, 'success');
        
        // No necesitamos recargar - el listener en tiempo real actualizará automáticamente
        
    } catch (error) {
        console.error('Error actualizando estado en Firebase:', error);
        showNotification('Error de conexión', 'error');
    }
}

function viewOrderDetail(orderId) {
    const order = activeOrders.find(o => o.ID === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const modalBody = document.getElementById('modalBody');
    const modalAction = document.getElementById('modalAction');
    
    if (!modal || !modalBody) return;
    
    const status = getStatusBadge(order.Estado || 'pending');
    
        // Configurar acción del botón según el estado
        // REGLA: Solo cambios manuales por clic
        if (modalAction) {
            if (order.Estado === 'pending') {
                modalAction.textContent = 'Iniciar Preparación';
                modalAction.className = 'btn-primary';
                modalAction.style.display = 'block';
                modalAction.onclick = () => {
                    updateOrderStatus(order.ID, 'preparing');
                    closeOrderModal();
                };
            } else if (order.Estado === 'preparing') {
                modalAction.textContent = 'Poner en Cocina';
                modalAction.className = 'btn-warning';
                modalAction.style.display = 'block';
                modalAction.onclick = () => {
                    updateOrderStatus(order.ID, 'cooking');
                    closeOrderModal();
                };
            } else if (order.Estado === 'cooking') {
                modalAction.textContent = 'Marcar como Listo';
                modalAction.className = 'btn-warning';
                modalAction.style.display = 'block';
                modalAction.onclick = () => {
                    updateOrderStatus(order.ID, 'ready');
                    closeOrderModal();
                };
            } else if (order.Estado === 'ready') {
                modalAction.textContent = 'Entregar Pedido';
                modalAction.className = 'btn-success';
                modalAction.style.display = 'block';
                modalAction.onclick = () => {
                    updateOrderStatus(order.ID, 'delivered');
                    closeOrderModal();
                };
            } else {
                modalAction.style.display = 'none';
            }
        }
    
    modalBody.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">ID Pedido</label>
                    <div class="mt-1 font-mono font-semibold">${order.ID}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Mesa</label>
                    <div class="mt-1 flex items-center gap-2">
                        <i class="fas fa-chair"></i>
                        <span class="font-semibold">${order.Mesa}</span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Estado</label>
                    <div class="mt-1">
                        <span class="status-badge ${status.class}">
                            ${status.icon} ${status.text}
                        </span>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray500">Código</label>
                    <div class="mt-1 font-mono font-semibold">${order.Código}</div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">Productos</label>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${(order.Productos || '').split(', ').map(product => `
                        <div class="flex justify-between py-2 border-b border-gray-200 last:border-0">
                            <span>${product}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-500">Hora</label>
                    <div class="mt-1">${order.Hora}</div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-500">Total</label>
                    <div class="mt-1 text-2xl font-bold text-green-600">
                        $${parseFloat(order.Total || 0).toFixed(2)}
                    </div>
                </div>
            </div>
            
            <div class="pt-4 border-t border-gray-200">
                <label class="block text-sm font-medium text-gray-500 mb-2">Cambiar Estado</label>
                <div class="flex gap-2 flex-wrap">
                    <!-- Estados permitidos: Recibido → Preparando → Cocinando → Listo → Entregado -->
                    ${order.Estado === 'pending' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'preparing')" 
                                class="btn-primary flex-1">
                            <i class="fas fa-utensils mr-2"></i> Iniciar Preparación
                        </button>
                    ` : ''}
                    ${order.Estado === 'preparing' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'cooking')" 
                                class="btn-warning flex-1">
                            <i class="fas fa-fire mr-2"></i> Poner en Cocina
                        </button>
                    ` : ''}
                    ${order.Estado === 'cooking' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'ready')" 
                                class="btn-warning flex-1">
                            <i class="fas fa-check-circle mr-2"></i> Marcar como Listo
                        </button>
                    ` : ''}
                    ${order.Estado === 'ready' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'delivered')" 
                                class="btn-success flex-1">
                            <i class="fas fa-truck mr-2"></i> Entregar Pedido
                        </button>
                    ` : ''}
                    ${order.Estado === 'delivered' ? `
                        <div style="padding: 1rem; background: var(--success-light); border-radius: var(--panel-radius); text-align: center;">
                            <i class="fas fa-check-circle" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <div style="font-weight: 600; color: var(--success);">Pedido Entregado</div>
                        </div>
                    ` : ''}
                    ${order.Estado !== 'delivered' && order.Estado !== 'cancelled' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'cancelled')" 
                                class="btn-danger flex-1">
                            <i class="fas fa-times mr-2"></i> Cancelar
                        </button>
                    ` : ''}
                    <button onclick="printOrderTicket('${order.ID}')" 
                            class="btn-secondary flex-1">
                        <i class="fas fa-print mr-2"></i> Imprimir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    modal.style.display = 'flex';
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function getStatusBadge(status) {
    const statusMap = {
        'pending': { 
            class: 'status-pending', 
            text: 'Recibido', 
            icon: '⏳' 
        },
        'preparing': { 
            class: 'status-preparing', 
            text: 'Preparando', 
            icon: '👨‍🍳' 
        },
        'cooking': { 
            class: 'status-cooking', 
            text: 'Cocinando', 
            icon: '🔥' 
        },
        'ready': { 
            class: 'status-ready', 
            text: 'Listo', 
            icon: '✅' 
        },
        'delivered': { 
            class: 'status-delivered', 
            text: 'Entregado', 
            icon: '🎉' 
        },
        'cancelled': {
            class: 'status-cancelled',
            text: 'Cancelado',
            icon: '❌'
        }
    };
    
    return statusMap[status] || statusMap.pending;
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? '#10B981' : 
                     type === 'error' ? '#EF4444' : 
                     type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
    `;
    
    const icon = type === 'success' ? '✅' : 
                 type === 'error' ? '❌' : 
                 type === 'warning' ? '⚠️' : 'ℹ️';
    
    notification.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function startAutoUpdates() {
    // REGLA: NO actualizaciones automáticas
    // Los listeners en tiempo real de Firestore actualizan la vista cuando hay cambios
    // Pero NO se ejecuta ninguna lógica automática - solo lectura de datos
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    
    // NO hay intervalos - todo es manual desde el panel o listeners de solo lectura
    console.log('✅ Actualizaciones automáticas deshabilitadas - solo lectura en tiempo real');
}

function updateOrdersBadge() {
    const badge = document.getElementById('ordersBadge');
    if (badge) {
        // Usar solo datos reales - si activeOrders no está inicializado, mostrar 0
        const count = (activeOrders && Array.isArray(activeOrders)) ? activeOrders.length : 0;
        badge.textContent = count;
        
        // Resaltar si hay pedidos pendientes
        if (count > 0 && Array.isArray(activeOrders)) {
            const pendingOrders = activeOrders.filter(o => o.Estado === 'pending');
            if (pendingOrders.length > 0) {
                badge.style.backgroundColor = '#EF4444';
                badge.style.animation = 'pulse 1s infinite';
            } else {
                badge.style.backgroundColor = '';
                badge.style.animation = '';
            }
        } else {
            badge.style.backgroundColor = '';
            badge.style.animation = '';
        }
    }
}

function updateTablesBadge() {
    const badge = document.getElementById('tablesBadge');
    if (badge) {
        // Usar solo datos reales
        const occupied = (tables && Array.isArray(tables)) 
            ? tables.filter(t => t.Estado === 'occupied').length 
            : 0;
        badge.textContent = `${occupied}/${PANEL_CONFIG.MAX_TABLES}`;
    }
}

// Actualizar badges de inventario, reservas y notificaciones (solo desde Firebase)
async function updateInventoryBadge() {
    const badge = document.getElementById('inventoryBadge');
    if (badge) {
        try {
            // Solo contar items con stock bajo desde Firebase
            const inventorySnapshot = await db.collection('inventory')
                .where('quantity', '<', 10) // Stock bajo
                .get();
            badge.textContent = inventorySnapshot.size;
            badge.style.display = inventorySnapshot.size > 0 ? '' : 'none';
        } catch (error) {
            // Si no existe la colección, mostrar 0
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

async function updateReservationsBadge() {
    const badge = document.getElementById('reservationsBadge');
    if (badge) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const reservationsSnapshot = await db.collection('reservations')
                .where('date', '>=', firebase.firestore.Timestamp.fromDate(today))
                .where('status', '==', 'pending')
                .get();
            badge.textContent = reservationsSnapshot.size;
            badge.style.display = reservationsSnapshot.size > 0 ? '' : 'none';
        } catch (error) {
            // Si no existe la colección, mostrar 0
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

async function updateNotificationsBadge() {
    const badge = document.getElementById('notificationsBadge');
    if (badge) {
        try {
            const notificationsSnapshot = await db.collection('notifications')
                .where('read', '==', false)
                .get();
            badge.textContent = notificationsSnapshot.size;
            badge.style.display = notificationsSnapshot.size > 0 ? '' : 'none';
        } catch (error) {
            // Si no existe la colección, mostrar 0
            badge.textContent = '0';
            badge.style.display = 'none';
        }
    }
}

function filterOrders(filter) {
    const rows = document.querySelectorAll('#ordersTableBody tr');
    
    rows.forEach(row => {
        const status = row.querySelector('.status-badge').textContent.toLowerCase();
        
        if (filter === 'all' || 
            (filter === 'pending' && (status.includes('recibido') || status.includes('pendiente'))) ||
            (filter === 'preparing' && status.includes('preparando')) ||
            (filter === 'ready' && status.includes('listo')) ||
            (filter === 'delivered' && status.includes('entregado'))) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function closeOrderModal() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function showTableInfo(tableNumber) {
    const table = tables.find(t => t.Mesa === tableNumber);
    if (!table) return;
    
    showNotification(`Mesa ${tableNumber}: ${table.Estado === 'available' ? 'Disponible' : 'Ocupada'}`, 'info');
}

function printOrderTicket(orderId) {
    showNotification('Imprimiendo ticket...', 'info');
    // Aquí iría la lógica real de impresión
}

function showNewOrderModal() {
    const modal = document.getElementById('newOrderModal');
    if (!modal) return;
    
    modal.style.display = 'flex';
    
    // Cargar mesas disponibles
    loadTablesForNewOrder();
    
    // Cargar productos
    loadProductsForNewOrder();
}

async function loadTablesForNewOrder() {
    const selectTable = document.getElementById('selectTable');
    if (!selectTable) return;
    
    selectTable.innerHTML = '<option value="">Seleccionar mesa...</option>';
    
    for (let i = 1; i <= PANEL_CONFIG.MAX_TABLES; i++) {
        const tableNum = i.toString().padStart(2, '0');
        const table = tables.find(t => t.Mesa === tableNum);
        const status = table && table.Estado === 'occupied' ? ' (Ocupada)' : '';
        
        const option = document.createElement('option');
        option.value = tableNum;
        option.textContent = `Mesa ${tableNum}${status}`;
        selectTable.appendChild(option);
    }
}

async function loadProductsForNewOrder() {
    const container = document.getElementById('newOrderProducts');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('products').get();
        let html = '';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.available !== false) {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border);">
                        <div>
                            <strong>${data.name || ''}</strong>
                            <div style="font-size: 0.875rem; color: var(--gray-500);">$${parseFloat(data.price || 0).toFixed(2)}</div>
                        </div>
                        <button onclick="addProductToNewOrder('${doc.id}', '${data.name || ''}', ${data.price || 0})" 
                                style="padding: 0.5rem 1rem; background: var(--panel-primary); color: white; border: none; border-radius: var(--panel-radius); cursor: pointer;">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html || '<p style="text-align: center; color: var(--gray-500);">No hay productos disponibles</p>';
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = '<p style="text-align: center; color: var(--panel-danger);">Error cargando productos</p>';
    }
}

let newOrderCart = [];

function addProductToNewOrder(productId, productName, price) {
    const existing = newOrderCart.find(item => item.id === productId);
    
    if (existing) {
        existing.quantity++;
    } else {
        newOrderCart.push({
            id: productId,
            name: productName,
            price: price,
            quantity: 1
        });
    }
    
    updateNewOrderSummary();
}

function updateNewOrderSummary() {
    const summary = document.getElementById('newOrderSummary');
    const items = document.getElementById('newOrderItems');
    const total = document.getElementById('newOrderTotal');
    
    if (!summary || !items || !total) return;
    
    if (newOrderCart.length === 0) {
        summary.style.display = 'none';
        return;
    }
    
    summary.style.display = 'block';
    
    let itemsHtml = '';
    let totalAmount = 0;
    
    newOrderCart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        
        itemsHtml += `
            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                <div>
                    <strong>${item.quantity}x ${item.name}</strong>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span>$${itemTotal.toFixed(2)}</span>
                    <button onclick="removeFromNewOrder('${item.id}')" style="background: var(--panel-danger); color: white; border: none; border-radius: 4px; padding: 0.25rem 0.5rem; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    items.innerHTML = itemsHtml;
    total.textContent = `$${totalAmount.toFixed(2)}`;
}

function removeFromNewOrder(productId) {
    newOrderCart = newOrderCart.filter(item => item.id !== productId);
    updateNewOrderSummary();
}

async function handleCreateNewOrder() {
    const selectTable = document.getElementById('selectTable');
    const table = selectTable ? selectTable.value : '';
    
    if (!table) {
        showNotification('Selecciona una mesa', 'warning');
        return;
    }
    
    if (newOrderCart.length === 0) {
        showNotification('Agrega productos al pedido', 'warning');
        return;
    }
    
    try {
        const productsList = newOrderCart.map(item => `${item.quantity}x ${item.name}`).join(', ');
        const total = newOrderCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // REGLA: Generar código único para el pedido (no es simulación, es identificación)
        const orderCode = Math.floor(100000 + Math.random() * 900000);
        
        const orderData = {
            table: table,
            products: productsList,
            productsDetails: newOrderCart,
            total: total.toFixed(2),
            status: 'pending', // Estado inicial siempre 'pending' - solo cambia por clic manual
            code: orderCode,
            notes: 'Pedido manual desde panel',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('orders').add(orderData);
        
        showNotification('Pedido creado exitosamente', 'success');
        
        // Limpiar y cerrar
        newOrderCart = [];
        document.getElementById('newOrderModal').style.display = 'none';
        updateNewOrderSummary();
        
        // Recargar pedidos
        setTimeout(() => {
            loadActiveOrders();
        }, 1000);
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        showNotification('Error al crear pedido', 'error');
    }
}

// Exportar funciones para usar en onclick
window.addProductToNewOrder = addProductToNewOrder;
window.removeFromNewOrder = removeFromNewOrder;

// ============================================
// FUNCIONES DE SECCIONES DEL PANEL
// ============================================

// Dashboard - Pedidos rápidos
function loadDashboardOrders() {
    const tbody = document.getElementById('dashboardOrdersTableBody');
    if (!tbody) return;
    
    const limitedOrders = activeOrders.slice(0, 5); // Solo 5 para vista rápida
    
    if (limitedOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--panel-gray-500);">No hay pedidos activos</td></tr>';
        return;
    }
    
    let html = '';
    limitedOrders.forEach(order => {
        const status = getStatusBadge(order.Estado || 'pending');
        html += `
            <tr>
                <td><div class="font-semibold">${order.ID.substring(0, 8)}...</div></td>
                <td><span class="font-semibold">${order.Mesa || ''}</span></td>
                <td class="font-bold text-green-600">$${parseFloat(order.Total || 0).toFixed(2)}</td>
                <td><span class="status-badge ${status.class}">${status.icon} ${status.text}</span></td>
                <td>
                    <button class="action-btn" onclick="viewOrderDetail('${order.ID}')" title="Ver detalle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// Menú - Gestión de productos
async function loadMenuProducts() {
    const container = document.getElementById('menuProductsList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando productos...</p>';
        
        const snapshot = await db.collection('products').get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--panel-gray-500);">
                    <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>No hay productos</h3>
                    <p>Agrega productos al menú desde el botón "Agregar Producto"</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="editable-list">';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="editable-item">
                    <div class="editable-item-content" style="grid-template-columns: 2fr 1fr 1fr 1fr auto;">
                        <div>
                            <label style="font-size: 0.75rem; color: var(--panel-gray-500);">Nombre (ES)</label>
                            <input type="text" value="${data.name || ''}" id="product-name-${doc.id}" 
                                   style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius); margin-top: 0.25rem;">
                            <input type="text" value="${data.nameEn || ''}" placeholder="Nombre (EN)" id="product-nameEn-${doc.id}" 
                                   style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius); margin-top: 0.5rem; font-size: 0.875rem;">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--panel-gray-500);">Precio</label>
                            <input type="number" step="0.01" value="${data.price || 0}" id="product-price-${doc.id}" 
                                   style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius); margin-top: 0.25rem;">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; color: var(--panel-gray-500);">Categoría</label>
                            <select id="product-category-${doc.id}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius); margin-top: 0.25rem;">
                                <option value="appetizers" ${data.category === 'appetizers' ? 'selected' : ''}>Entradas</option>
                                <option value="mains" ${data.category === 'mains' ? 'selected' : ''}>Principales</option>
                                <option value="desserts" ${data.category === 'desserts' ? 'selected' : ''}>Postres</option>
                                <option value="drinks" ${data.category === 'drinks' ? 'selected' : ''}>Bebidas</option>
                                <option value="specials" ${data.category === 'specials' ? 'selected' : ''}>Especiales</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
                                <input type="checkbox" ${data.available !== false ? 'checked' : ''} id="product-available-${doc.id}">
                                Disponible
                            </label>
                        </div>
                    </div>
                    <div class="editable-item-actions">
                        <button class="btn btn-small btn-primary" onclick="saveProduct('${doc.id}')">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteProduct('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando productos</p>';
    }
}

async function saveProduct(productId) {
    try {
        const name = document.getElementById(`product-name-${productId}`).value;
        if (!name) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }
        
        const price = parseFloat(document.getElementById(`product-price-${productId}`).value);
        if (isNaN(price) || price <= 0) {
            showNotification('Precio inválido', 'error');
            return;
        }
        
        const available = document.getElementById(`product-available-${productId}`).checked;
        const nameEn = document.getElementById(`product-nameEn-${productId}`)?.value || '';
        const description = document.getElementById(`product-description-${productId}`)?.value || '';
        const descriptionEn = document.getElementById(`product-descriptionEn-${productId}`)?.value || '';
        const category = document.getElementById(`product-category-${productId}`)?.value || 'mains';
        
        await db.collection('products').doc(productId).update({
            name: name,
            nameEn: nameEn,
            price: price,
            available: available,
            description: description,
            descriptionEn: descriptionEn,
            category: category,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Producto actualizado', 'success');
        loadMenuProducts();
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification('Error al guardar', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    try {
        await db.collection('products').doc(productId).delete();
        showNotification('Producto eliminado', 'success');
        loadMenuProducts();
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Inventario
async function loadInventory() {
    const container = document.getElementById('inventoryList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando inventario...</p>';
        
        const snapshot = await db.collection('inventory').get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--panel-gray-500);">
                    <i class="fas fa-boxes" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>No hay productos en inventario</h3>
                    <p>Agrega productos desde el botón "Agregar Producto"</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="editable-list">';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="editable-item">
                    <div class="editable-item-content">
                        <div>
                            <strong>${data.name || ''}</strong>
                            <div style="font-size: 0.875rem; color: var(--panel-gray-500); margin-top: 0.25rem;">
                                ${data.unit || 'piezas'}
                            </div>
                        </div>
                        <div>
                            <label>Cantidad:</label>
                            <input type="number" value="${data.quantity || 0}" id="inventory-qty-${doc.id}" 
                                   style="width: 100px; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                        </div>
                        <div>
                            <label>Unidad:</label>
                            <select id="inventory-unit-${doc.id}" style="width: 120px; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                                <option value="kg" ${data.unit === 'kg' ? 'selected' : ''}>kg</option>
                                <option value="piezas" ${data.unit === 'piezas' ? 'selected' : ''}>piezas</option>
                                <option value="litros" ${data.unit === 'litros' ? 'selected' : ''}>litros</option>
                            </select>
                        </div>
                    </div>
                    <div class="editable-item-actions">
                        <button class="btn btn-small btn-success" onclick="adjustInventory('${doc.id}', 1)">
                            <i class="fas fa-plus"></i> +1
                        </button>
                        <button class="btn btn-small btn-warning" onclick="adjustInventory('${doc.id}', -1)">
                            <i class="fas fa-minus"></i> -1
                        </button>
                        <button class="btn btn-small btn-primary" onclick="saveInventory('${doc.id}')">
                            <i class="fas fa-save"></i>
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteInventory('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando inventario:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando inventario</p>';
    }
}

async function adjustInventory(itemId, change) {
    try {
        const input = document.getElementById(`inventory-qty-${itemId}`);
        const current = parseFloat(input.value) || 0;
        const newValue = Math.max(0, current + change);
        input.value = newValue;
        
        await db.collection('inventory').doc(itemId).update({
            quantity: newValue,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification(`Stock ajustado: ${change > 0 ? '+' : ''}${change}`, 'success');
    } catch (error) {
        console.error('Error ajustando inventario:', error);
        showNotification('Error al ajustar', 'error');
    }
}

async function saveInventory(itemId) {
    try {
        const quantity = parseFloat(document.getElementById(`inventory-qty-${itemId}`).value) || 0;
        const unit = document.getElementById(`inventory-unit-${itemId}`).value;
        
        await db.collection('inventory').doc(itemId).update({
            quantity: quantity,
            unit: unit,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Inventario guardado', 'success');
    } catch (error) {
        console.error('Error guardando inventario:', error);
        showNotification('Error al guardar', 'error');
    }
}

async function deleteInventory(itemId) {
    if (!confirm('¿Eliminar este producto del inventario?')) return;
    
    try {
        await db.collection('inventory').doc(itemId).delete();
        showNotification('Producto eliminado', 'success');
        loadInventory();
    } catch (error) {
        console.error('Error eliminando:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Personal
async function loadEmployees() {
    const container = document.getElementById('employeesList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando personal...</p>';
        
        const snapshot = await db.collection('employees').get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--panel-gray-500);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>No hay empleados registrados</h3>
                    <p>Agrega empleados desde el botón "Agregar Empleado"</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="editable-list">';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="editable-item">
                    <div class="editable-item-content">
                        <div>
                            <input type="text" value="${data.name || ''}" id="employee-name-${doc.id}" 
                                   style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                        </div>
                        <div>
                            <select id="employee-role-${doc.id}" style="width: 100%; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                                <option value="cocina" ${data.role === 'cocina' ? 'selected' : ''}>Cocina</option>
                                <option value="mesero" ${data.role === 'mesero' ? 'selected' : ''}>Mesero</option>
                                <option value="caja" ${data.role === 'caja' ? 'selected' : ''}>Caja</option>
                            </select>
                        </div>
                    </div>
                    <div class="editable-item-actions">
                        <button class="btn btn-small btn-primary" onclick="saveEmployee('${doc.id}')">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button class="btn btn-small btn-danger" onclick="deleteEmployee('${doc.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando empleados:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando personal</p>';
    }
}

async function saveEmployee(employeeId) {
    try {
        const name = document.getElementById(`employee-name-${employeeId}`).value;
        const role = document.getElementById(`employee-role-${employeeId}`).value;
        
        await db.collection('employees').doc(employeeId).update({
            name: name,
            role: role,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Empleado actualizado', 'success');
        loadEmployees();
    } catch (error) {
        console.error('Error guardando empleado:', error);
        showNotification('Error al guardar', 'error');
    }
}

async function deleteEmployee(employeeId) {
    if (!confirm('¿Eliminar este empleado?')) return;
    
    try {
        await db.collection('employees').doc(employeeId).delete();
        showNotification('Empleado eliminado', 'success');
        loadEmployees();
    } catch (error) {
        console.error('Error eliminando empleado:', error);
        showNotification('Error al eliminar', 'error');
    }
}

// Reservas
async function loadReservations() {
    const container = document.getElementById('reservationsList');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando reservas...</p>';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const snapshot = await db.collection('reservations')
            .where('date', '>=', firebase.firestore.Timestamp.fromDate(today))
            .orderBy('date', 'asc')
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--panel-gray-500);">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>No hay reservas</h3>
                    <p>Agrega reservas desde el botón "Nueva Reserva"</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="editable-list">';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.date ? data.date.toDate() : new Date();
            html += `
                <div class="editable-item">
                    <div class="editable-item-content">
                        <div><strong>${data.customerName || ''}</strong></div>
                        <div>${date.toLocaleDateString()}</div>
                        <div>${data.time || ''}</div>
                        <div>Mesa ${data.table || ''}</div>
                    </div>
                    <div class="editable-item-actions">
                        <button class="btn btn-small btn-danger" onclick="cancelReservation('${doc.id}')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando reservas</p>';
    }
}

async function cancelReservation(reservationId) {
    if (!confirm('¿Cancelar esta reserva?')) return;
    
    try {
        await db.collection('reservations').doc(reservationId).update({
            status: 'cancelled',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Reserva cancelada', 'success');
        loadReservations();
    } catch (error) {
        console.error('Error cancelando reserva:', error);
        showNotification('Error al cancelar', 'error');
    }
}

// Reportes
async function loadReports(period) {
    const container = document.getElementById('reportsContent');
    if (!container) return;
    
    try {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Calculando reportes...</p>';
        
        const now = new Date();
        let startDate = new Date();
        
        switch(period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }
        
        const snapshot = await db.collection('orders')
            .where('createdAt', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('status', '==', 'delivered')
            .get();
        
        let totalSales = 0;
        let orderCount = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            totalSales += parseFloat(data.total || 0);
            orderCount++;
        });
        
        const periodLabel = period === 'day' ? 'Hoy' : period === 'week' ? 'Semana' : 'Mes';
        
        container.innerHTML = `
            <div class="stats-grid" style="margin-bottom: var(--panel-space-8);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-money-bill-wave"></i></div>
                        <span class="stat-title">Ventas ${periodLabel}</span>
                    </div>
                    <div class="stat-value">$${totalSales.toFixed(2)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-receipt"></i></div>
                        <span class="stat-title">Pedidos</span>
                    </div>
                    <div class="stat-value">${orderCount}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon"><i class="fas fa-calculator"></i></div>
                        <span class="stat-title">Ticket Promedio</span>
                    </div>
                    <div class="stat-value">$${orderCount > 0 ? (totalSales / orderCount).toFixed(2) : '0.00'}</div>
                </div>
            </div>
        `;
        
        // Configurar botones de período
        document.querySelectorAll('#section-reports .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === period) {
                btn.classList.add('active');
                btn.addEventListener('click', () => loadReports(period));
            } else {
                btn.addEventListener('click', function() {
                    loadReports(this.dataset.period);
                });
            }
        });
        
    } catch (error) {
        console.error('Error cargando reportes:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando reportes</p>';
    }
}

// Códigos QR
async function loadQRCodes() {
    const container = document.getElementById('qrContent');
    if (!container) return;
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--panel-space-6);">';
    
    for (let i = 1; i <= PANEL_CONFIG.MAX_TABLES; i++) {
        const tableNum = i.toString().padStart(2, '0');
        html += `
            <div style="text-align: center; padding: var(--panel-space-6); background: var(--panel-light); border-radius: var(--panel-radius-lg); border: 1px solid var(--panel-border);">
                <div style="margin-bottom: var(--panel-space-4);">
                    <div style="width: 150px; height: 150px; background: white; border: 2px solid var(--panel-border); border-radius: var(--panel-radius); margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 3rem; font-weight: 700;">${tableNum}</span>
                    </div>
                </div>
                <h3 style="margin-bottom: var(--panel-space-2);">Mesa ${tableNum}</h3>
                <p style="font-size: 0.875rem; color: var(--panel-gray-500); margin-bottom: var(--panel-space-4);">HUNABKU-${tableNum}</p>
                <button class="btn btn-secondary btn-small" onclick="window.print()">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Notificaciones
async function loadNotifications() {
    const container = document.getElementById('notificationsContent');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--panel-gray-500);">
                    <i class="fas fa-bell" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <h3>No hay notificaciones</h3>
                </div>
            `;
            return;
        }
        
        let html = '<div class="editable-list">';
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? data.createdAt.toDate() : new Date();
            html += `
                <div class="editable-item ${data.read ? '' : 'style="border-left: 4px solid var(--panel-primary);"'}">
                    <div class="editable-item-content">
                        <div>
                            <strong>${data.title || ''}</strong>
                            <div style="font-size: 0.875rem; color: var(--panel-gray-500); margin-top: 0.25rem;">
                                ${data.message || ''}
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--panel-gray-500);">
                            ${date.toLocaleString()}
                        </div>
                    </div>
                    <div class="editable-item-actions">
                        ${!data.read ? `
                            <button class="btn btn-small btn-primary" onclick="markNotificationRead('${doc.id}')">
                                <i class="fas fa-check"></i> Marcar leída
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        container.innerHTML = '<p style="color: var(--panel-danger);">Error cargando notificaciones</p>';
    }
}

async function markNotificationRead(notificationId) {
    try {
        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        loadNotifications();
        updateNotificationsBadge();
    } catch (error) {
        console.error('Error marcando notificación:', error);
    }
}

// Modales para agregar elementos
function showAddProductModal() {
    // Crear modal más completo
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Agregar Producto</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre (Español) *</label>
                        <input type="text" id="newProductName" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);" required>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Nombre (English)</label>
                        <input type="text" id="newProductNameEn" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Precio *</label>
                        <input type="number" step="0.01" id="newProductPrice" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);" required>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Categoría *</label>
                        <select id="newProductCategory" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);" required>
                            <option value="appetizers">Entradas</option>
                            <option value="mains">Platos Principales</option>
                            <option value="desserts">Postres</option>
                            <option value="drinks">Bebidas</option>
                            <option value="specials">Especiales</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción</label>
                        <textarea id="newProductDescription" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);"></textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Descripción (English)</label>
                        <textarea id="newProductDescriptionEn" rows="2" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);"></textarea>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">URL de Imagen</label>
                        <input type="url" id="newProductImage" style="width: 100%; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: var(--panel-radius);">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
                <button class="btn-primary" onclick="createProduct()">Agregar Producto</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Cerrar al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function createProduct() {
    const name = document.getElementById('newProductName').value;
    if (!name) {
        showNotification('El nombre es obligatorio', 'error');
        return;
    }
    
    const price = parseFloat(document.getElementById('newProductPrice').value);
    if (isNaN(price) || price <= 0) {
        showNotification('Precio inválido', 'error');
        return;
    }
    
    const category = document.getElementById('newProductCategory').value;
    const description = document.getElementById('newProductDescription').value || '';
    const descriptionEn = document.getElementById('newProductDescriptionEn').value || '';
    const nameEn = document.getElementById('newProductNameEn').value || '';
    const image = document.getElementById('newProductImage').value || '';
    
    db.collection('products').add({
        name: name,
        nameEn: nameEn,
        price: price,
        category: category,
        description: description,
        descriptionEn: descriptionEn,
        image: image,
        available: true,
        featured: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showNotification('Producto agregado', 'success');
        document.querySelector('.modal-overlay').remove();
        loadMenuProducts();
    }).catch(error => {
        console.error('Error:', error);
        showNotification('Error al agregar producto', 'error');
    });
}

function showAddInventoryModal() {
    const name = prompt('Nombre del producto/insumo:');
    if (!name) return;
    
    const quantity = parseFloat(prompt('Cantidad inicial:'));
    if (isNaN(quantity)) {
        showNotification('Cantidad inválida', 'error');
        return;
    }
    
    const unit = prompt('Unidad (kg, piezas, litros):') || 'piezas';
    
    db.collection('inventory').add({
        name: name,
        quantity: quantity,
        unit: unit,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showNotification('Producto agregado al inventario', 'success');
        loadInventory();
    }).catch(error => {
        console.error('Error:', error);
        showNotification('Error al agregar', 'error');
    });
}

function showAddEmployeeModal() {
    const name = prompt('Nombre del empleado:');
    if (!name) return;
    
    const role = prompt('Rol (cocina, mesero, caja):') || 'mesero';
    
    if (!['cocina', 'mesero', 'caja'].includes(role)) {
        showNotification('Rol inválido', 'error');
        return;
    }
    
    db.collection('employees').add({
        name: name,
        role: role,
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showNotification('Empleado agregado', 'success');
        loadEmployees();
    }).catch(error => {
        console.error('Error:', error);
        showNotification('Error al agregar empleado', 'error');
    });
}

function showAddReservationModal() {
    const customerName = prompt('Nombre del cliente:');
    if (!customerName) return;
    
    const dateStr = prompt('Fecha (YYYY-MM-DD):');
    if (!dateStr) return;
    
    const time = prompt('Hora (HH:MM):');
    if (!time) return;
    
    const table = prompt('Número de mesa:');
    if (!table) return;
    
    const date = new Date(dateStr + ' ' + time);
    
    db.collection('reservations').add({
        customerName: customerName,
        date: firebase.firestore.Timestamp.fromDate(date),
        time: time,
        table: table,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        showNotification('Reserva agregada', 'success');
        loadReservations();
    }).catch(error => {
        console.error('Error:', error);
        showNotification('Error al agregar reserva', 'error');
    });
}

// Exportar funciones
window.saveProduct = saveProduct;
window.deleteProduct = deleteProduct;
window.adjustInventory = adjustInventory;
window.saveInventory = saveInventory;
window.deleteInventory = deleteInventory;
window.saveEmployee = saveEmployee;
window.deleteEmployee = deleteEmployee;
window.cancelReservation = cancelReservation;
window.markNotificationRead = markNotificationRead;

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.updateOrderStatus = updateOrderStatus;
window.viewOrderDetail = viewOrderDetail;
window.toggleSidebar = toggleSidebar;
window.showTableInfo = showTableInfo;
window.printOrderTicket = printOrderTicket;
window.closeOrderModal = closeOrderModal;
window.filterOrders = filterOrders;
window.addProductToNewOrder = addProductToNewOrder;
window.removeFromNewOrder = removeFromNewOrder;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', initializePanel);

// Añadir estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);