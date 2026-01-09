// ============================================
// PANEL DE CONTROL RESTAURANTE DELUXE - JavaScript
// VERSIÓN COMPLETA CON FIREBASE
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

// ============================================
// INICIALIZACIÓN
// ============================================
function initializePanel() {
    console.log('🚀 Iniciando panel de control con Firebase...');
    
    // Inicializar arrays vacíos para evitar valores undefined
    activeOrders = [];
    tables = [];
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar badges a 0
    updateOrdersBadge();
    updateTablesBadge();
    updateInventoryBadge();
    updateReservationsBadge();
    updateNotificationsBadge();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Iniciar actualizaciones automáticas
    startAutoUpdates();
    
    console.log('✅ Panel inicializado');
}

function setupEventListeners() {
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
        
        // Usar onSnapshot para actualizaciones en tiempo real
        ordersListener = db.collection('orders')
            .where('status', 'in', ['pending', 'preparing', 'ready', 'cancelled'])
            .orderBy('createdAt', 'desc')
            .onSnapshot((querySnapshot) => {
                console.log('🔄 Actualización en tiempo real de pedidos');
                
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
                
                renderOrdersTable();
                updateOrdersBadge();
                updateDashboardStats();
                updateTablesStatusFromOrders(); // Actualizar mesas basado en pedidos
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

// Crear mesas por defecto si no existen
async function createDefaultTables() {
    tables = [];
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
}

// Actualizar estado de mesas basado en pedidos activos
async function updateTablesStatusFromOrders() {
    try {
        // Obtener todos los pedidos activos
        const activeOrdersSnapshot = await db.collection('orders')
            .where('status', 'in', ['pending', 'preparing', 'ready'])
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
        
        // Actualizar estado de mesas
        if (tables.length === 0) {
            await createDefaultTables();
        }
        
        tables.forEach(table => {
            if (occupiedTables.has(table.Mesa)) {
                table.Estado = 'occupied';
                table["Orden ID"] = tableOrderMap[table.Mesa] || '';
            } else {
                table.Estado = 'available';
                table["Orden ID"] = '';
            }
        });
        
        updateTablesGrid();
        updateTablesBadge();
        
    } catch (error) {
        console.error('Error actualizando estado de mesas:', error);
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
                                <i class="fas fa-play"></i>
                            </button>
                        ` : ''}
                        ${order.Estado === 'preparing' ? `
                            <button class="action-btn btn-warning" onclick="updateOrderStatus('${order.ID}', 'ready')" title="Marcar como listo">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${order.Estado === 'ready' ? `
                            <button class="action-btn btn-primary" onclick="updateOrderStatus('${order.ID}', 'delivered')" title="Marcar como entregado">
                                <i class="fas fa-truck"></i>
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
            <div class="stat-change negative">
                <i class="fas fa-arrow-up"></i>
                5% más rápido
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
    if (modalAction) {
        if (order.Estado === 'pending') {
            modalAction.textContent = 'Comenzar Preparación';
            modalAction.className = 'btn-primary';
            modalAction.onclick = () => {
                updateOrderStatus(order.ID, 'preparing');
                closeOrderModal();
            };
        } else if (order.Estado === 'preparing') {
            modalAction.textContent = 'Marcar como Listo';
            modalAction.className = 'btn-warning';
            modalAction.onclick = () => {
                updateOrderStatus(order.ID, 'ready');
                closeOrderModal();
            };
        } else if (order.Estado === 'ready') {
            modalAction.textContent = 'Entregar Pedido';
            modalAction.className = 'btn-success';
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
                <label class="block text-sm font-medium text-gray-500 mb-2">Acciones</label>
                <div class="flex gap-2">
                    ${order.Estado === 'pending' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'preparing')" 
                                class="btn-primary flex-1">
                            <i class="fas fa-play mr-2"></i> Comenzar Preparación
                        </button>
                    ` : ''}
                    ${order.Estado === 'preparing' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'ready')" 
                                class="btn-warning flex-1">
                            <i class="fas fa-check mr-2"></i> Marcar como Listo
                        </button>
                    ` : ''}
                    ${order.Estado === 'ready' ? `
                        <button onclick="updateOrderStatus('${order.ID}', 'delivered')" 
                                class="btn-success flex-1">
                            <i class="fas fa-truck mr-2"></i> Entregar Pedido
                        </button>
                    ` : ''}
                    <button onclick="printOrderTicket('${order.ID}')" 
                            class="btn-secondary flex-1">
                        <i class="fas fa-print mr-2"></i> Imprimir Ticket
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
            text: 'Pendiente', 
            icon: '⏳' 
        },
        'preparing': { 
            class: 'status-preparing', 
            text: 'Preparando', 
            icon: '👨‍🍳' 
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
    // Ya no necesitamos intervalos - los listeners en tiempo real actualizan automáticamente
    // Solo actualizamos las mesas cada cierto tiempo por si hay cambios
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    
    updateInterval = setInterval(() => {
        console.log('🔄 Actualizando estado de mesas...');
        updateTablesStatusFromOrders();
        updateDashboardStats();
    }, PANEL_CONFIG.UPDATE_INTERVAL);
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
                .where('stock', '<', 10) // Stock bajo
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
            (filter === 'pending' && status.includes('pendiente')) ||
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
        
        const orderData = {
            table: table,
            products: productsList,
            productsDetails: newOrderCart,
            total: total.toFixed(2),
            status: 'pending',
            code: Math.floor(100000 + Math.random() * 900000),
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