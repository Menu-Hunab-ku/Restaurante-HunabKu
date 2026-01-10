// ============================================
// SISTEMA HUNAB KU - JavaScript (MENÚ DEL CLIENTE)
// VERSIÓN COMPLETA CON FIREBASE - CORREGIDA
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const CONFIG = {
    RESTAURANT_NAME: 'Hunab Ku',
    DEFAULT_TABLE: '01'
};

// ============================================
// VARIABLES GLOBALES
// ============================================
let cart = [];
let currentOrder = null;
let currentTable = CONFIG.DEFAULT_TABLE;
let currentCategory = 'all';
let orderInProgress = false;
let currentLanguage = localStorage.getItem('language') || 'es';
let PRODUCTS_FROM_FIREBASE = [];
let currentOrderListener = null;

// Traducciones
const translations = {
    es: {
        'restaurant.title': 'Menú Hunab Ku',
        'restaurant.subtitle': 'Experiencia gastronómica premium • Menú digital interactivo',
        'open.hours': 'Abierto: 11:00 AM - 11:00 PM',
        'reservations': 'Reservas: (123) 456-7890',
        'address': 'Dirección: Av. Gourmet 123',
        'table.number': 'MESA',
        'table.scan': 'Escanea el código QR o introduce el número de mesa',
        'table.ready': 'LISTA PARA ORDENAR',
        'table.qr': 'Código QR:',
        'cart.title': 'Tu Orden Actual',
        'cart.active': 'PEDIDO ACTIVO',
        'cart.empty.title': 'Tu carrito está vacío',
        'cart.empty.message': 'Agrega productos desde el menú para comenzar',
        'cart.total': 'Total a pagar:',
        'cart.clear': 'Vaciar',
        'cart.confirm': 'Enviar Pedido',
        'tracking.title': 'Seguimiento de Pedido',
        'tracking.subtitle': 'Tu pedido está en proceso',
        'tracking.orderId': 'ID de Pedido:',
        'invoice.title': '¡Pedido Completado!',
        'invoice.subtitle': 'Gracias por tu preferencia',
        'invoice.table': 'Mesa',
        'invoice.orderId': 'ID Pedido',
        'invoice.time': 'Hora',
        'invoice.code': 'Código',
        'invoice.total': 'TOTAL',
        'invoice.thanks': '⭐ ¡Esperamos verte pronto!',
        'invoice.satisfaction': 'Tu satisfacción es nuestra prioridad',
        'invoice.newOrder': 'Nuevo Pedido'
    },
    en: {
        'restaurant.title': 'Hunab Ku Menu',
        'restaurant.subtitle': 'Premium gastronomic experience • Interactive digital menu',
        'open.hours': 'Open: 11:00 AM - 11:00 PM',
        'reservations': 'Reservations: (123) 456-7890',
        'address': 'Address: Gourmet Ave 123',
        'table.number': 'TABLE',
        'table.scan': 'Scan the QR code or enter the table number',
        'table.ready': 'READY TO ORDER',
        'table.qr': 'QR Code:',
        'cart.title': 'Your Current Order',
        'cart.active': 'ACTIVE ORDER',
        'cart.empty.title': 'Your cart is empty',
        'cart.empty.message': 'Add products from the menu to get started',
        'cart.total': 'Total to pay:',
        'cart.clear': 'Clear',
        'cart.confirm': 'Send Order',
        'tracking.title': 'Order Tracking',
        'tracking.subtitle': 'Your order is being processed',
        'tracking.orderId': 'Order ID:',
        'invoice.title': 'Order Completed!',
        'invoice.subtitle': 'Thank you for your preference',
        'invoice.table': 'Table',
        'invoice.orderId': 'Order ID',
        'invoice.time': 'Time',
        'invoice.code': 'Code',
        'invoice.total': 'TOTAL',
        'invoice.thanks': '⭐ We hope to see you soon!',
        'invoice.satisfaction': 'Your satisfaction is our priority',
        'invoice.newOrder': 'New Order'
    }
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
async function initialize() {
    console.log('🚀 Iniciando menú Hunab Ku...');
    
    // Configurar mesa desde URL
    const params = new URLSearchParams(window.location.search);
    const mesa = params.get('mesa');
    if (mesa) {
        currentTable = mesa.padStart(2, '0');
    }
    
    // Cargar carrito
    loadCart();
    
    // Configurar controles
    setupControls();
    
    // Aplicar traducciones
    applyTranslations();
    
    // Renderizar interfaz
    updateTableInfo();
    renderCategories();
    
    // Cargar productos
    await loadProductsFromFirebase();
    await renderProducts();
    
    // Inicializar tema
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    console.log('✅ Menú inicializado');
    showNotification('Sistema listo. ¡Bienvenido!', 'success');
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            const translation = translations[currentLanguage][key];
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    
    updateTableInfo();
}

function setupControls() {
    // Toggle tema
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Selector de idioma
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = currentLanguage;
        languageSelect.addEventListener('change', async (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            applyTranslations();
            updateTableInfo();
            await renderProducts();
        });
    }
    
    // Botón carrito
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }
    
    // Cerrar modal
    const modalOverlay = document.getElementById('cartModal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeCart();
            }
        });
    }
}

// ============================================
// FUNCIONES DE INTERFAZ
// ============================================
function updateTableInfo() {
    const tableLabel = currentLanguage === 'es' ? 'MESA' : 'TABLE';
    document.getElementById('tableNumber').textContent = `${tableLabel} ${currentTable}`;
    document.getElementById('cartTableNumber').textContent = `${tableLabel} ${currentTable}`;
    document.getElementById('qrCode').textContent = `HUNABKU-${currentTable}`;
}

const CATEGORIES = [
    { id: 'all', name: 'Todo', icon: 'fas fa-utensils', color: '#8B4513' },
    { id: 'appetizers', name: 'Entradas', icon: 'fas fa-seedling', color: '#2D5016' },
    { id: 'breakfasts', name: 'Desayunos', icon: 'fas fa-egg', color: '#D2691E' },
    { id: 'mains', name: 'Platos Principales', icon: 'fas fa-drumstick-bite', color: '#654321' },
    { id: 'drinks', name: 'Bebidas', icon: 'fas fa-glass-cheers', color: '#228B22' }
];

function renderCategories() {
    const container = document.getElementById('categoriesFilter');
    if (!container) return;
    
    let html = '';
    CATEGORIES.forEach(category => {
        const activeClass = currentCategory === category.id ? 'active' : '';
        html += `
            <button class="category-btn ${activeClass}" 
                    onclick="filterByCategory('${category.id}')"
                    style="border-color: ${category.color};">
                <i class="${category.icon}"></i>
                ${category.name}
            </button>
        `;
    });
    container.innerHTML = html;
}

async function loadProductsFromFirebase() {
    try {
        const snapshot = await db.collection('products').get();
        PRODUCTS_FROM_FIREBASE = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            PRODUCTS_FROM_FIREBASE.push({
                id: doc.id,
                name: data.name || '',
                nameEn: data.nameEn || '',
                description: data.description || '',
                descriptionEn: data.descriptionEn || '',
                price: parseFloat(data.price || 0),
                category: data.category || 'mains',
                image: data.image || '',
                available: data.available !== false,
                featured: data.featured === true
            });
        });
        
        console.log(`✅ ${PRODUCTS_FROM_FIREBASE.length} productos cargados`);
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        showNotification('Error cargando productos', 'error');
    }
}

async function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    if (PRODUCTS_FROM_FIREBASE.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i><p>Cargando...</p></div>`;
        return;
    }
    
    let html = '';
    const filteredProducts = PRODUCTS_FROM_FIREBASE.filter(p => {
        return (currentCategory === 'all' || p.category === currentCategory) && p.available !== false;
    });
    
    if (filteredProducts.length === 0) {
        html = `<div style="text-align: center; padding: 40px; color: #666;">No hay productos en esta categoría</div>`;
    } else {
        filteredProducts.forEach(product => {
            const badge = product.featured ? `<div class="product-badge">⭐ ESPECIAL</div>` : '';
            const itemInCart = cart.find(item => item.id === product.id);
            const quantity = itemInCart ? itemInCart.quantity : 0;
            
            const productName = (currentLanguage === 'en' && product.nameEn) ? product.nameEn : product.name;
            const productDescription = (currentLanguage === 'en' && product.descriptionEn) ? product.descriptionEn : (product.description || '');
            
            html += `
                <div class="product-card">
                    ${badge}
                    <img src="${product.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${productName}" class="product-image">
                    <div class="product-content">
                        <div class="product-header">
                            <h3 class="product-title">${productName}</h3>
                            <div class="product-price">$${parseFloat(product.price || 0).toFixed(2)}</div>
                        </div>
                        <p class="product-description">${productDescription}</p>
                        <div class="product-footer">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateProductQuantity('${product.id}', -1)" ${orderInProgress ? 'disabled' : ''}>
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span class="quantity-display" id="qty-${product.id}">${quantity}</span>
                                <button class="quantity-btn" onclick="updateProductQuantity('${product.id}', 1)" ${orderInProgress ? 'disabled' : ''}>
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')" ${orderInProgress ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus"></i> ${currentLanguage === 'en' ? 'Add' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================
function addToCart(productId) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const product = PRODUCTS_FROM_FIREBASE.find(p => p.id === productId);
    if (!product) {
        showNotification('Producto no encontrado', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: (currentLanguage === 'en' && product.nameEn) ? product.nameEn : product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${product.name} agregado`, 'success');
}

function updateProductQuantity(productId, change) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity < 1) item.quantity = 1;
        
        const display = document.getElementById(`qty-${productId}`);
        if (display) display.textContent = item.quantity;
        
        saveCart();
        updateCartUI();
    } else if (change > 0) {
        addToCart(productId);
    }
}

function removeFromCart(productId) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    if (confirm('¿Eliminar este producto del pedido?')) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
        showNotification('Producto eliminado', 'info');
    }
}

function clearCart() {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    if (cart.length === 0) {
        showNotification('El carrito ya está vacío', 'info');
        return;
    }
    
    if (confirm('¿Vaciar todo el carrito?')) {
        cart = [];
        saveCart();
        updateCartUI();
        showNotification('Carrito vaciado', 'info');
    }
}

function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => cartCount.style.transform = 'scale(1)', 300);
    }
    
    cart.forEach(item => {
        const display = document.getElementById(`qty-${item.id}`);
        if (display) display.textContent = item.quantity;
    });
    
    if (document.getElementById('cartModal').style.display === 'flex') {
        renderCartItems();
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos desde el menú para comenzar</p>
            </div>
        `;
        if (summary) summary.style.display = 'none';
        return;
    }
    
    let html = '<div class="cart-items">';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        html += `
            <div class="cart-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">$${item.price.toFixed(2)} c/u</div>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn" onclick="updateProductQuantity('${item.id}', -1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateProductQuantity('${item.id}', 1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar" ${orderInProgress ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    if (summary) summary.style.display = 'block';
    
    const total = subtotal;
    document.getElementById('cartTotalAmount').textContent = `$${total.toFixed(2)}`;
    
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.disabled = cart.length === 0 || orderInProgress;
        confirmBtn.innerHTML = orderInProgress 
            ? `<i class="fas fa-check"></i> ${currentLanguage === 'en' ? 'Order Sent' : 'Pedido Enviado'}`
            : `<i class="fas fa-paper-plane"></i> ${currentLanguage === 'en' ? 'Send Order' : 'Enviar Pedido'}`;
    }
}

// ============================================
// FUNCIONES DE PEDIDOS - VERSIÓN CORREGIDA
// ============================================
async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('Agrega productos al carrito primero', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const productsList = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    const confirmText = currentLanguage === 'en'
        ? `Send order to kitchen?\n\nTable: ${currentTable}\nProducts: ${productsList}\nTotal: $${subtotal.toFixed(2)}\n\nConfirm?`
        : `¿Enviar pedido a cocina?\n\nMesa: ${currentTable}\nProductos: ${productsList}\nTotal: $${subtotal.toFixed(2)}\n\n¿Confirmar?`;
    
    if (!confirm(confirmText)) return;
    
    try {
        showNotification('Enviando pedido a cocina...', 'info');
        
        const orderCode = Math.floor(100000 + Math.random() * 900000);
        const orderData = {
            table: currentTable,
            products: productsList,
            productsDetails: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: subtotal.toFixed(2),
            status: 'pending',
            code: orderCode,
            notes: 'Pedido desde menú digital',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('📤 Enviando a Firebase:', orderData);
        
        const docRef = await db.collection('orders').add(orderData);
        
        if (docRef.id) {
            currentOrder = {
                id: docRef.id,
                code: orderCode,
                table: currentTable,
                cart: [...cart],
                total: subtotal,
                status: 'pending',
                timestamp: new Date().toISOString()
            };
            
            orderInProgress = true;
            
            // Mostrar seguimiento
            showOrderTracking(docRef.id);
            
            // Configurar listener
            setupOrderStatusListener(docRef.id);
            
            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartUI();
            
            showNotification('¡Pedido enviado exitosamente!', 'success');
            
        } else {
            throw new Error('No se recibió ID del pedido');
        }
        
    } catch (error) {
        console.error('❌ Error enviando pedido:', error);
        showNotification('Error al enviar pedido. Intenta nuevamente.', 'error');
    }
}

function showOrderTracking(orderId) {
    const tracking = document.getElementById('orderTracking');
    const summary = document.getElementById('cartSummary');
    
    if (tracking) {
        tracking.style.display = 'block';
        document.getElementById('orderIdDisplay').textContent = orderId;
    }
    
    if (summary) {
        summary.style.display = 'none';
    }
    
    renderOrderTrackingSteps();
}

function renderOrderTrackingSteps() {
    const steps = [
        { id: 'pending', label: currentLanguage === 'en' ? 'Received' : 'Recibido', icon: 'fas fa-clipboard-check' },
        { id: 'preparing', label: currentLanguage === 'en' ? 'Preparing' : 'Preparando', icon: 'fas fa-utensils' },
        { id: 'cooking', label: currentLanguage === 'en' ? 'Cooking' : 'Cocinando', icon: 'fas fa-fire' },
        { id: 'ready', label: currentLanguage === 'en' ? 'Ready' : 'Listo', icon: 'fas fa-check-circle' },
        { id: 'delivered', label: currentLanguage === 'en' ? 'Delivered' : 'Entregado', icon: 'fas fa-concierge-bell' }
    ];
    
    const container = document.getElementById('trackingSteps');
    if (container) {
        let html = '';
        steps.forEach(step => {
            html += `
                <div class="tracking-step" id="step-${step.id}">
                    <div class="step-icon">
                        <i class="${step.icon}"></i>
                    </div>
                    <div class="step-label">${step.label}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        
        updateTrackingUI('pending');
    }
}

function setupOrderStatusListener(orderId) {
    console.log(`🔔 Configurando listener para: ${orderId}`);
    
    if (!orderId || typeof db === 'undefined') {
        console.error('No hay orderId o Firebase no disponible');
        return null;
    }
    
    // Detener listener anterior si existe
    if (currentOrderListener) {
        currentOrderListener();
    }
    
    // Configurar nuevo listener
    currentOrderListener = db.collection('orders').doc(orderId).onSnapshot(
        (doc) => {
            console.log(`📡 Evento recibido para: ${orderId}`);
            
            if (doc.exists) {
                const data = doc.data();
                const newStatus = data.status || 'pending';
                
                console.log(`🔄 Nuevo estado: ${newStatus}`);
                
                // Actualizar currentOrder
                if (currentOrder) {
                    currentOrder.status = newStatus;
                    currentOrder.table = data.table || currentTable;
                    currentOrder.code = data.code || '';
                    currentOrder.cart = data.productsDetails || [];
                    currentOrder.total = parseFloat(data.total || 0);
                }
                
                // Actualizar UI
                updateTrackingUI(newStatus);
                
                // Mostrar notificación
                const messages = {
                    'pending': 'Pedido recibido',
                    'preparing': 'Comenzando preparación',
                    'cooking': 'Cocinando tu pedido',
                    'ready': '¡Tu pedido está listo!',
                    'delivered': '¡Pedido entregado!'
                };
                
                showNotification(messages[newStatus] || `Estado: ${newStatus}`, 'success');
                
                // Si está entregado, mostrar factura
                if (newStatus === 'delivered') {
                    setTimeout(() => {
                        showInvoice();
                        if (currentOrderListener) {
                            currentOrderListener();
                            currentOrderListener = null;
                        }
                    }, 1000);
                }
            } else {
                console.warn('Pedido no encontrado en Firebase');
            }
        },
        (error) => {
            console.error('Error en listener:', error);
            showNotification('Error de conexión', 'error');
        }
    );
    
    return currentOrderListener;
}

function updateTrackingUI(status) {
    const steps = ['pending', 'preparing', 'cooking', 'ready', 'delivered'];
    
    steps.forEach(stepId => {
        const stepElement = document.getElementById(`step-${stepId}`);
        if (stepElement) {
            stepElement.classList.remove('step-active', 'step-completed');
        }
    });
    
    const statusOrder = ['pending', 'preparing', 'cooking', 'ready', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    
    if (currentIndex >= 0) {
        for (let i = 0; i < currentIndex; i++) {
            const stepElement = document.getElementById(`step-${statusOrder[i]}`);
            if (stepElement) {
                stepElement.classList.add('step-completed');
            }
        }
        
        const currentStepElement = document.getElementById(`step-${status}`);
        if (currentStepElement) {
            currentStepElement.classList.add('step-active');
        }
    }
}

function showInvoice() {
    if (!currentOrder) return;
    
    const tracking = document.getElementById('orderTracking');
    const invoice = document.getElementById('invoice');
    
    if (tracking) tracking.style.display = 'none';
    if (invoice) invoice.style.display = 'block';
    
    document.getElementById('invoiceTable').textContent = currentOrder.table;
    document.getElementById('invoiceOrderId').textContent = currentOrder.id;
    document.getElementById('invoiceTime').textContent = new Date(currentOrder.timestamp).toLocaleTimeString();
    document.getElementById('invoiceCode').textContent = currentOrder.code;
    
    let itemsHtml = '';
    let subtotal = 0;
    
    if (currentOrder.cart && currentOrder.cart.length > 0) {
        currentOrder.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            itemsHtml += `
                <div class="invoice-item">
                    <div>
                        <div style="font-weight: 600;">${item.quantity}x ${item.name}</div>
                        <div style="font-size: 0.875rem; color: #666;">$${item.price.toFixed(2)} c/u</div>
                    </div>
                    <div style="font-weight: 600;">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
    }
    
    document.getElementById('invoiceItems').innerHTML = itemsHtml;
    document.getElementById('invoiceTotal').textContent = `$${(currentOrder.total || subtotal).toFixed(2)}`;
    
    saveOrderToHistory();
    orderInProgress = false;
}

function newOrder() {
    orderInProgress = false;
    currentOrder = null;
    
    const invoice = document.getElementById('invoice');
    const tracking = document.getElementById('orderTracking');
    const summary = document.getElementById('cartSummary');
    
    if (invoice) invoice.style.display = 'none';
    if (tracking) tracking.style.display = 'none';
    if (summary) summary.style.display = 'block';
    
    renderCartItems();
    showNotification('Listo para nuevo pedido', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function filterByCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    await renderProducts();
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    showNotification(isDark ? 'Modo oscuro activado' : 'Modo claro activado', 'info');
}

function openCart() {
    document.getElementById('cartModal').style.display = 'flex';
    renderCartItems();
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

function closeCartOnOverlay(event) {
    if (event.target.id === 'cartModal') {
        closeCart();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function saveCart() {
    localStorage.setItem('restaurantCart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('restaurantCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartUI();
    }
}

function saveOrderToHistory() {
    if (!currentOrder) return;
    const history = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    history.push({ ...currentOrder, date: new Date().toISOString() });
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================
window.filterByCategory = filterByCategory;
window.addToCart = addToCart;
window.updateProductQuantity = updateProductQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.confirmOrder = confirmOrder;
window.newOrder = newOrder;
window.toggleTheme = toggleTheme;
window.openCart = openCart;
window.closeCart = closeCart;
window.closeCartOnOverlay = closeCartOnOverlay;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', initialize);