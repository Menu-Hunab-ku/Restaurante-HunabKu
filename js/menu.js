// ============================================
// SISTEMA RESTAURANTE DELUXE - JavaScript
// VERSIÓN COMPLETA CON FIREBASE
// ============================================

// ============================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================
const CONFIG = {
    RESTAURANT_NAME: 'Hunab Ku',
    TAX_RATE: 0.16,
    SERVICE_FEE: 0.10,
    AUTO_UPDATE_INTERVAL: 30000,
    DEFAULT_TABLE: '01'
};

// ============================================
// DATOS DEL MENÚ - SE CARGAN DESDE FIREBASE
// ============================================
// Los productos y categorías se cargan desde Firebase en initialize()

// ============================================
// VARIABLES GLOBALES
// ============================================
let cart = [];
let currentOrder = null;
let currentTable = CONFIG.DEFAULT_TABLE;
let currentCategory = 'all';
let orderInProgress = false;
let PRODUCTS = [];
let CATEGORIES = [];
let currentLanguage = localStorage.getItem('language') || 'es';

// Traducciones
const translations = {
    es: {
        'restaurant.title': 'Hunab Ku',
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
        'restaurant.title': 'Hunab Ku',
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
    console.log('🚀 Iniciando sistema restaurante con Firebase...');
    
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
    
    // Aplicar traducciones primero
    applyTranslations();
    
    // Renderizar interfaz básica
    updateTableInfo();
    
    // Renderizar categorías iniciales (aunque estén vacías)
    renderCategories();
    
    // Renderizar productos iniciales (aunque estén vacíos - mostrará mensaje)
    renderProducts();
    
    // Cargar datos desde Firebase
    try {
        // Verificar que Firebase esté disponible
        if (typeof db === 'undefined') {
            throw new Error('Firebase no está disponible. Verifica que el archivo de configuración esté cargado.');
        }
        
        await loadMenuFromFirebase();
        await loadCategoriesFromFirebase();
        
        // Configurar listeners en tiempo real DESPUÉS de cargar datos iniciales
        setupRealtimeListeners();
        
    } catch (error) {
        console.error('Error cargando menú desde Firebase:', error);
        showNotification(currentLanguage === 'es' 
            ? 'Error cargando menú desde Firebase. Verifica tu conexión.' 
            : 'Error loading menu from Firebase. Check your connection.', 'error');
        
        // Asegurar que se renderice algo aunque haya error
        renderProducts();
        renderCategories();
    }
    
    // Inicializar tema
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    
    // Probar conexión Firebase
    testFirebaseConnection();
    
    console.log('✅ Sistema inicializado');
    showNotification(currentLanguage === 'es' ? 'Sistema listo. ¡Bienvenido!' : 'System ready. Welcome!', 'success');
}

async function loadMenuFromFirebase() {
    try {
        console.log('Cargando productos desde Firebase...');
        const snapshot = await db.collection('products').get();
        
        PRODUCTS = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            PRODUCTS.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                price: parseFloat(data.price) || 0,
                category: data.category || 'mains',
                image: data.image || 'https://via.placeholder.com/400x300?text=Sin+Imagen',
                featured: data.featured || false,
                available: data.available !== false
            });
        });
        
        console.log(`✅ ${PRODUCTS.length} productos cargados desde Firebase`);
        renderProducts(); // Renderizar productos después de cargar
        return true;
    } catch (error) {
        console.error('Error cargando productos:', error);
        throw error;
    }
}

// Listener en tiempo real para productos
function setupRealtimeListeners() {
    // Verificar que db esté disponible
    if (typeof db === 'undefined') {
        console.error('Firebase db no está disponible para listeners');
        return;
    }
    
    // Listener para productos - actualizar cuando cambien
    db.collection('products').onSnapshot((snapshot) => {
        console.log('🔄 Actualización en tiempo real de productos');
        PRODUCTS = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            PRODUCTS.push({
                id: doc.id,
                name: data.name || '',
                description: data.description || '',
                price: parseFloat(data.price) || 0,
                category: data.category || 'mains',
                image: data.image || 'https://via.placeholder.com/400x300?text=Sin+Imagen',
                featured: data.featured || false,
                available: data.available !== false
            });
        });
        
        console.log(`📦 ${PRODUCTS.length} productos en tiempo real`);
        renderProducts();
    }, (error) => {
        console.error('Error en listener de productos:', error);
    });
    
    // Listener para categorías
    db.collection('categories').onSnapshot((snapshot) => {
        console.log('🔄 Actualización en tiempo real de categorías');
        CATEGORIES = [];
        CATEGORIES.push({ id: 'all', name: currentLanguage === 'es' ? 'Todo' : 'All', icon: 'fas fa-utensils', color: '#667eea' });
        
        snapshot.forEach(doc => {
            const data = doc.data();
            CATEGORIES.push({
                id: doc.id,
                name: data.name || '',
                icon: data.icon || 'fas fa-utensils',
                color: data.color || '#667eea'
            });
        });
        
        renderCategories();
    }, (error) => {
        console.error('Error en listener de categorías:', error);
    });
}

async function loadCategoriesFromFirebase() {
    try {
        console.log('Cargando categorías desde Firebase...');
        const snapshot = await db.collection('categories').get();
        
        CATEGORIES = [];
        // Siempre agregar "Todo"
        CATEGORIES.push({ id: 'all', name: currentLanguage === 'es' ? 'Todo' : 'All', icon: 'fas fa-utensils', color: '#667eea' });
        
        snapshot.forEach(doc => {
            const data = doc.data();
            CATEGORIES.push({
                id: doc.id,
                name: data.name || '',
                icon: data.icon || 'fas fa-utensils',
                color: data.color || '#667eea'
            });
        });
        
        console.log(`✅ ${CATEGORIES.length} categorías cargadas desde Firebase`);
        renderCategories(); // Renderizar categorías después de cargar
        return true;
    } catch (error) {
        console.error('Error cargando categorías:', error);
        // Si no hay categorías en Firebase, solo mostrar "Todo"
        CATEGORIES = [
            { id: 'all', name: currentLanguage === 'es' ? 'Todo' : 'All', icon: 'fas fa-utensils', color: '#667eea' }
        ];
        renderCategories();
        return false;
    }
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translations[currentLanguage][key];
            } else {
                el.textContent = translations[currentLanguage][key];
            }
        }
    });
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
        languageSelect.addEventListener('change', (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            applyTranslations();
            // Recargar categorías con nuevos nombres
            if (CATEGORIES.length === 0) {
                loadCategoriesFromFirebase().then(() => renderCategories());
            } else {
                renderCategories();
            }
            console.log('Idioma cambiado a:', currentLanguage);
            showNotification(currentLanguage === 'es' ? 'Idioma cambiado a español' : 'Language changed to English', 'success');
        });
    }
    
    // Botón carrito flotante
    const cartButton = document.querySelector('.cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', openCart);
    }
    
    // Cerrar modal al hacer clic fuera
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

function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) {
        console.warn('Container productsGrid no encontrado');
        return;
    }
    
    // Verificar si db está disponible
    if (typeof db === 'undefined') {
        console.error('Firebase db no está disponible');
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>${currentLanguage === 'es' ? 'Error de conexión' : 'Connection error'}</h3>
                <p>${currentLanguage === 'es' ? 'No se pudo conectar con Firebase. Verifica tu conexión.' : 'Could not connect to Firebase. Check your connection.'}</p>
            </div>
        `;
        return;
    }
    
    if (PRODUCTS.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="fas fa-utensils" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>${currentLanguage === 'es' ? 'No hay productos disponibles' : 'No products available'}</h3>
                <p>${currentLanguage === 'es' ? 'No se encontraron productos en la base de datos. Agrega productos desde el panel de control.' : 'No products found in database. Add products from the control panel.'}</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    const filteredProducts = currentCategory === 'all' 
        ? PRODUCTS.filter(p => p.available !== false)
        : PRODUCTS.filter(p => (p.category === currentCategory || p.category === String(currentCategory)) && p.available !== false);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <i class="fas fa-search" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>${currentLanguage === 'es' ? 'No hay productos en esta categoría' : 'No products in this category'}</h3>
            </div>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const badge = product.featured ? `<div class="product-badge">⭐ ${currentLanguage === 'es' ? 'ESPECIAL' : 'SPECIAL'}</div>` : '';
        const itemInCart = cart.find(item => item.id === product.id || item.id === String(product.id));
        const quantity = itemInCart ? itemInCart.quantity : 0;
        const productIdStr = typeof product.id === 'string' ? `'${product.id}'` : product.id;
        const addText = currentLanguage === 'es' ? 'Agregar' : 'Add';
        
        html += `
            <div class="product-card" ${!product.available ? 'style="opacity: 0.6;"' : ''}>
                ${badge}
                <img src="${product.image || 'https://via.placeholder.com/400x300?text=Sin+Imagen'}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
                <div class="product-content">
                    <div class="product-header">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    </div>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-footer">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateProductQuantity(${productIdStr}, -1)" ${orderInProgress || !product.available ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity-display" id="qty-${product.id}">${quantity}</span>
                            <button class="quantity-btn" onclick="updateProductQuantity(${productIdStr}, 1)" ${orderInProgress || !product.available ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="add-to-cart-btn" onclick="addToCart(${productIdStr})" ${orderInProgress || !product.available ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> ${addText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================
function addToCart(productId) {
    if (orderInProgress) {
        const msg = currentLanguage === 'es' ? 'No puedes modificar el pedido en progreso' : 'Cannot modify order in progress';
        showNotification(msg, 'error');
        return;
    }
    
    const product = PRODUCTS.find(p => p.id === productId || p.id === String(productId));
    if (!product) {
        const msg = currentLanguage === 'es' ? 'Producto no encontrado' : 'Product not found';
        showNotification(msg, 'error');
        return;
    }
    
    if (!product.available) {
        const msg = currentLanguage === 'es' ? 'Este producto no está disponible' : 'This product is not available';
        showNotification(msg, 'warning');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId || item.id === String(productId));
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category
        });
    }
    
    saveCart();
    updateCartUI();
    const msg = currentLanguage === 'es' ? `${product.name} agregado` : `${product.name} added`;
    showNotification(msg, 'success');
}

function updateProductQuantity(productId, change) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        
        saveCart();
        updateCartUI();
    }
}

function removeFromCart(productId) {
    if (orderInProgress) {
        showNotification('No puedes modificar el pedido en progreso', 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
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
        
        // Animación
        cartCount.style.transform = 'scale(1.3)';
        setTimeout(() => {
            cartCount.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Actualizar cantidades en productos
    cart.forEach(item => {
        const display = document.getElementById(`qty-${item.id}`);
        if (display) {
            display.textContent = item.quantity;
        }
    });
    
    // Si el carrito está abierto, renderizar items
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
                <h3 style="margin-bottom: 10px;">Tu carrito está vacío</h3>
                <p>Agrega productos desde el menú para comenzar</p>
            </div>
        `;
        summary.style.display = 'none';
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
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, -1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-minus"></i>
                    </button>
                    <span style="font-weight: 600; min-width: 30px; text-align: center;">
                        ${item.quantity}
                    </span>
                    <button class="quantity-btn" onclick="updateProductQuantity(${item.id}, 1)" ${orderInProgress ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="item-total">$${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeFromCart(${item.id})" title="Eliminar" ${orderInProgress ? 'disabled' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    summary.style.display = 'block';
    
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    document.getElementById('cartTotalAmount').textContent = `$${total.toFixed(2)}`;
    
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.disabled = cart.length === 0 || orderInProgress;
        confirmBtn.innerHTML = orderInProgress 
            ? `<i class="fas fa-check"></i> Pedido Enviado`
            : `<i class="fas fa-paper-plane"></i> Enviar Pedido`;
    }
}

// ============================================
// FUNCIONES DEL PEDIDO CON FIREBASE
// ============================================
async function confirmOrder() {
    if (cart.length === 0) {
        const msg = currentLanguage === 'es' ? 'Agrega productos al carrito primero' : 'Add products to cart first';
        showNotification(msg, 'error');
        return;
    }
    
    // Verificar conexión con Firebase primero
    try {
        await db.collection('test').limit(1).get();
    } catch (error) {
        console.error('Error de conexión con Firebase:', error);
        const msg = currentLanguage === 'es' 
            ? 'Error al conectar con Firebase. Verifica tu conexión a internet.' 
            : 'Error connecting to Firebase. Please check your internet connection.';
        showNotification(msg, 'error');
        return;
    }
    
    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    // Preparar lista de productos con detalles completos
    const productsList = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    const productsDetails = cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
    }));
    
    // Confirmación
    const confirmationMsg = currentLanguage === 'es'
        ? `¿Enviar pedido a la cocina?\n\nMesa: ${currentTable}\nProductos: ${productsList}\nTotal: $${total.toFixed(2)}\n\n¿Confirmar?`
        : `Send order to kitchen?\n\nTable: ${currentTable}\nProducts: ${productsList}\nTotal: $${total.toFixed(2)}\n\nConfirm?`;
    
    if (!confirm(confirmationMsg)) return;
    
    try {
        const sendingMsg = currentLanguage === 'es' ? 'Enviando pedido a cocina...' : 'Sending order to kitchen...';
        showNotification(sendingMsg, 'info');
        
        // Preparar datos para Firebase
        const orderData = {
            table: currentTable,
            products: productsList,
            productsDetails: productsDetails,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            service: service.toFixed(2),
            total: total.toFixed(2),
            status: 'pending',
            code: Math.floor(100000 + Math.random() * 900000),
            notes: currentLanguage === 'es' ? 'Pedido desde menú digital' : 'Order from digital menu',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Enviando a Firebase:', orderData);
        
        // Enviar a Firebase con timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
        );
        
        const orderPromise = db.collection('orders').add(orderData);
        const docRef = await Promise.race([orderPromise, timeoutPromise]);
        
        if (docRef && docRef.id) {
            // Crear orden local
            const orderId = docRef.id;
            const code = orderData.code;
            
            currentOrder = {
                id: orderId,
                code: code,
                table: currentTable,
                cart: [...cart],
                subtotal: subtotal,
                tax: tax,
                service: service,
                total: total,
                timestamp: new Date().toISOString()
            };
            
            orderInProgress = true;
            
            // Mostrar seguimiento
            showOrderTracking(orderId);
            const successMsg = currentLanguage === 'es' ? '¡Pedido enviado exitosamente!' : 'Order sent successfully!';
            showNotification(successMsg, 'success');
            
            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartUI();
            
            // NO simular preparación - el panel actualizará el estado
            // El seguimiento se actualizará cuando el panel cambie el estado
            
        } else {
            throw new Error('Error al crear pedido en Firebase');
        }
        
    } catch (error) {
        console.error('Error al enviar pedido a Firebase:', error);
        const errorMsg = currentLanguage === 'es'
            ? 'Error al enviar pedido. Por favor, intenta nuevamente.'
            : 'Error sending order. Please try again.';
        showNotification(errorMsg, 'error');
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
    
    // Escuchar cambios en tiempo real del pedido
    setupOrderTrackingListener(orderId);
}

function setupOrderTrackingListener(orderId) {
    const steps = [
        { id: 'pending', label: currentLanguage === 'es' ? 'Pendiente' : 'Pending', icon: 'fas fa-clock' },
        { id: 'preparing', label: currentLanguage === 'es' ? 'Preparando' : 'Preparing', icon: 'fas fa-utensils' },
        { id: 'ready', label: currentLanguage === 'es' ? 'Listo' : 'Ready', icon: 'fas fa-check-circle' },
        { id: 'delivered', label: currentLanguage === 'es' ? 'Entregado' : 'Delivered', icon: 'fas fa-concierge-bell' }
    ];
    
    const container = document.getElementById('trackingSteps');
    if (container) {
        let html = '';
        steps.forEach((step) => {
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
    }
    
    // Listener en tiempo real para el estado del pedido
    const unsubscribe = db.collection('orders').doc(orderId).onSnapshot((doc) => {
        if (doc.exists()) {
            const data = doc.data();
            const status = data.status || 'pending';
            
            // Actualizar pasos según el estado
            steps.forEach(step => {
                const stepElement = document.getElementById(`step-${step.id}`);
                if (stepElement) {
                    stepElement.classList.remove('step-active');
                }
            });
            
            // Activar el paso correspondiente al estado actual
            const currentStepElement = document.getElementById(`step-${status}`);
            if (currentStepElement) {
                currentStepElement.classList.add('step-active');
            }
            
            // Si el pedido fue entregado, mostrar factura después de un momento
            if (status === 'delivered' && currentOrder) {
                setTimeout(() => {
                    showInvoice();
                    if (unsubscribe) unsubscribe(); // Dejar de escuchar cuando se entregue
                }, 2000);
            }
            
            // Si fue cancelado, ocultar seguimiento
            if (status === 'cancelled') {
                const tracking = document.getElementById('orderTracking');
                if (tracking) {
                    tracking.style.display = 'none';
                }
                if (unsubscribe) unsubscribe();
            }
        }
    }, (error) => {
        console.error('Error escuchando estado del pedido:', error);
    });
}

function showInvoice() {
    if (!currentOrder) return;
    
    // Ocultar seguimiento
    const tracking = document.getElementById('orderTracking');
    if (tracking) {
        tracking.style.display = 'none';
    }
    
    // Mostrar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'block';
        
        // Llenar datos
        document.getElementById('invoiceTable').textContent = currentOrder.table;
        document.getElementById('invoiceOrderId').textContent = currentOrder.id;
        document.getElementById('invoiceTime').textContent = new Date(currentOrder.timestamp).toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('invoiceCode').textContent = currentOrder.code;
        document.getElementById('invoiceTotal').textContent = `$${currentOrder.total.toFixed(2)}`;
        
        // Items de la factura
        let itemsHtml = '';
        currentOrder.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            itemsHtml += `
                <div class="invoice-item">
                    <div>${item.quantity}x ${item.name}</div>
                    <div style="font-weight: 600;">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        // Agregar subtotales
        itemsHtml += `
            <div class="invoice-item" style="border-top: 2px solid var(--border); padding-top: 20px;">
                <div>Subtotal</div>
                <div>$${currentOrder.subtotal.toFixed(2)}</div>
            </div>
            <div class="invoice-item">
                <div>IVA (${(CONFIG.TAX_RATE * 100)}%)</div>
                <div>$${currentOrder.tax.toFixed(2)}</div>
            </div>
            <div class="invoice-item">
                <div>Servicio (${(CONFIG.SERVICE_FEE * 100)}%)</div>
                <div>$${currentOrder.service.toFixed(2)}</div>
            </div>
        `;
        
        document.getElementById('invoiceItems').innerHTML = itemsHtml;
    }
    
    // Guardar en historial
    saveOrderToHistory();
}

function newOrder() {
    orderInProgress = false;
    currentOrder = null;
    
    // Ocultar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'none';
    }
    
    // Mostrar resumen vacío
    const summary = document.getElementById('cartSummary');
    if (summary) {
        summary.style.display = 'block';
    }
    
    renderCartItems();
    showNotification('Listo para nuevo pedido', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function filterByCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    renderProducts();
}

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const message = isDark 
        ? (currentLanguage === 'es' ? 'Modo oscuro activado' : 'Dark mode activated')
        : (currentLanguage === 'es' ? 'Modo claro activado' : 'Light mode activated');
    showNotification(message, 'info');
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
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                         type === 'error' ? 'exclamation-circle' : 
                         type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 4 segundos
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
    history.push({
        ...currentOrder,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('orderHistory', JSON.stringify(history));
}

async function testFirebaseConnection() {
    try {
        console.log('Probando conexión con Firebase...');
        
        // Verificar que Firebase esté inicializado
        if (typeof db === 'undefined' || !db) {
            throw new Error('Firebase no inicializado');
        }
        
        // Intentar leer una colección (products) en lugar de 'test'
        await db.collection('products').limit(1).get();
        console.log('✅ Conexión a Firebase exitosa');
        
        // No mostrar notificación de éxito para no molestar al usuario
        return true;
    } catch (error) {
        console.log('⚠️ Error de conexión con Firebase:', error);
        // No mostrar notificación de error al iniciar, solo log
        return false;
    }
}

// ============================================
// EXPORTAR FUNCIONES AL GLOBAL SCOPE
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