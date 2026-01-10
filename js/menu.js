// ============================================
// SISTEMA HUNAB KU - JavaScript (MENÚ DEL CLIENTE)
// VERSIÓN COMPLETA CON FIREBASE
// ============================================
//
// REGLAS ABSOLUTAS:
// 1. El menú SOLO LEE productos desde Firestore (collection: products)
// 2. NO modifica productos desde aquí
// 3. Crea pedidos en Firestore (collection: orders) con status: 'pending'
// 4. Escucha cambios de estado del pedido (solo lectura visual)
// 5. El estado del pedido SOLO cambia desde el PANEL
//
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
// DATOS DEL MENÚ (LOCAL - POR SI FALLA LA CONEXIÓN)
// ============================================
const CATEGORIES = [
    { id: 'all', name: 'Todo', nameEn: 'All', icon: 'fas fa-utensils', color: '#8B4513' },
    { id: 'appetizers', name: 'Entradas', nameEn: 'Appetizers', icon: 'fas fa-seedling', color: '#2D5016' },
    { id: 'breakfasts', name: 'Desayunos', nameEn: 'Breakfasts', icon: 'fas fa-egg', color: '#D2691E' },
    { id: 'mains', name: 'Platos Principales', nameEn: 'Main Dishes', icon: 'fas fa-drumstick-bite', color: '#654321' },
    { id: 'drinks', name: 'Bebidas', nameEn: 'Drinks', icon: 'fas fa-glass-cheers', color: '#228B22' }
];

const PRODUCTS = [
    // ENTRADAS
    { 
        id: 1, 
        name: "Empanadas Fritas (3)", 
        description: "Tres empanadas fritas rellenas de queso de bola, servidas calientes", 
        price: 60.00, 
        category: "appetizers", 
        image: "https://images.pexels.com/photos/1435907/pexels-photo-1435907.jpeg",
        featured: false 
    },
    { 
        id: 2, 
        name: "Salbutes Típicos (3)", 
        description: "Tres salbutes tradicionales yucatecos con pollo deshebrado, lechuga, tomate y cebolla", 
        price: 84.00, 
        category: "appetizers", 
        image: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg",
        featured: true 
    },
    { 
        id: 3, 
        name: "Panuchos Típicos (3)", 
        description: "Tres panuchos tradicionales con frijol, pollo deshebrado, lechuga, tomate y cebolla", 
        price: 84.00, 
        category: "appetizers", 
        image: "https://images.pexels.com/photos/461207/pexels-photo-461207.jpeg",
        featured: true 
    },
    { 
        id: 4, 
        name: "Sopes de Empanizado (3)", 
        description: "Tres sopes con milanesa de pollo empanizado, lechuga, crema y queso", 
        price: 90.00, 
        category: "appetizers", 
        image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&h=600&fit=crop&q=90&auto=format",
        featured: false 
    },
    { 
        id: 5, 
        name: "Guacamole", 
        description: "Guacamole fresco preparado al momento con aguacate, cebolla, cilantro y chile", 
        price: 115.00, 
        category: "appetizers", 
        image: "https://images.pexels.com/photos/1435907/pexels-photo-1435907.jpeg",
        featured: false 
    },
    { 
        id: 6, 
        name: "Frijol Botanero", 
        description: "Frijoles refritos servidos como botana tradicional yucateca", 
        price: 78.00, 
        category: "appetizers", 
        image: "https://images.unsplash.com/photo-1573882496055-4c6ac8a2c554?w=800&h=600&fit=crop&q=90&auto=format",
        featured: false 
    },
    { 
        id: 7, 
        name: "Plátanos Fritos", 
        description: "Plátanos maduros fritos al estilo tradicional yucateco", 
        price: 65.00, 
        category: "appetizers", 
        image: "https://images.pexels.com/photos/357743/pexels-photo-357743.jpeg",
        featured: false 
    },
    
    // DESAYUNOS
    { 
        id: 8, 
        name: "Huevos con Longaniza", 
        description: "Huevos revueltos con longaniza yucateca, acompañados de frijoles y tortillas", 
        price: 99.00, 
        category: "breakfasts", 
        image: "https://images.pexels.com/photos/7045695/pexels-photo-7045695.jpeg",
        featured: false 
    },
    { 
        id: 9, 
        name: "Huevos con Chaya", 
        description: "Huevos revueltos con chaya, hierba tradicional yucateca, acompañados de frijoles", 
        price: 89.00, 
        category: "breakfasts", 
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&h=600&fit=crop&q=90&auto=format",
        featured: false 
    },
    { 
        id: 10, 
        name: "Huevos Motuleños", 
        description: "Platillo típico de Motul con huevos estrellados, jamón, chícharos, plátano frito y salsa de tomate", 
        price: 135.00, 
        category: "breakfasts", 
        image: "https://images.pexels.com/photos/4611984/pexels-photo-4611984.jpeg",
        featured: true 
    },
    { 
        id: 11, 
        name: "Chilaquiles (Medianos)", 
        description: "Chilaquiles con pollo, cubiertos de queso, crema y cebolla, tamaño mediano", 
        price: 95.00, 
        category: "breakfasts", 
        image: "https://images.pexels.com/photos/1435899/pexels-photo-1435899.jpeg",
        featured: false 
    },
    { 
        id: 12, 
        name: "Chilaquiles (Grandes)", 
        description: "Chilaquiles con pollo, cubiertos de queso, crema y cebolla, porción grande", 
        price: 155.00, 
        category: "breakfasts", 
        image: "https://images.pexels.com/photos/1435899/pexels-photo-1435899.jpeg",
        featured: false 
    },
    
    // PLATOS PRINCIPALES
    { 
        id: 13, 
        name: "Poc Chuc", 
        description: "Carne de cerdo a la parrilla estilo yucateco, marinada en naranja agria, servida con cebolla asada y frijoles", 
        price: 135.00, 
        category: "mains", 
        image: "https://images.pexels.com/photos/326278/pexels-photo-326278.jpeg",
        featured: true 
    },
    { 
        id: 14, 
        name: "Lomitos de Valladolid", 
        description: "Trozos de carne de cerdo en salsa de tomate, estilo tradicional de Valladolid", 
        price: 135.00, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=800&h=600&fit=crop&q=90&auto=format",
        featured: true 
    },
    { 
        id: 15, 
        name: "Empanizado", 
        description: "Milanesa de pollo o res empanizada, acompañada de arroz, frijoles y ensalada", 
        price: 159.00, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=800&h=600&fit=crop&q=90&auto=format",
        featured: false 
    },
    { 
        id: 16, 
        name: "Tacos (3)", 
        description: "Tres tacos de tu elección con cebolla, cilantro y salsas", 
        price: 75.00, 
        category: "mains", 
        image: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg",
        featured: false 
    },
    { 
        id: 17, 
        name: "Tacos de Chicharrón con Queso (3)", 
        description: "Tres tacos de chicharrón prensado con queso, cebolla y cilantro", 
        price: 85.00, 
        category: "mains", 
        image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&h=600&fit=crop&q=90&auto=format",
        featured: false 
    },
    
    // BEBIDAS
    { 
        id: 18, 
        name: "Horchata (500ml)", 
        description: "Agua fresca de horchata preparada al momento, 500ml", 
        price: 28.00, 
        category: "drinks", 
        image: "https://images.pexels.com/photos/816526/pexels-photo-816526.jpeg",
        featured: false 
    },
    { 
        id: 19, 
        name: "Jamaica (500ml)", 
        description: "Agua fresca de jamaica preparada al momento, 500ml", 
        price: 28.00, 
        category: "drinks", 
        image: "https://images.pexels.com/photos/616831/pexels-photo-616831.jpeg",
        featured: false 
    }
];

// ============================================
// VARIABLES GLOBALES
// ============================================
let cart = [];
let currentOrder = null;
let currentTable = CONFIG.DEFAULT_TABLE;
let currentCategory = 'all';
let orderInProgress = false;
let currentLanguage = localStorage.getItem('language') || 'es';
let PRODUCTS_FROM_FIREBASE = []; // Productos cargados desde Firestore
let orderStatusListener = null; // Listener global para el estado del pedido

// Traducciones para textos de interfaz (NO para productos)
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
        'invoice.newOrder': 'Nuevo Pedido',
        'view.invoice': 'Ver Factura',
        'back.tracking': 'Volver al Seguimiento'
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
        'invoice.newOrder': 'New Order',
        'view.invoice': 'View Invoice',
        'back.tracking': 'Back to Tracking'
    }
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================
async function initialize() {
    console.log('🚀 Iniciando sistema restaurante Hunab Ku...');
    
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
    
    // Renderizar interfaz PRIMERO (para mostrar contenido rápidamente)
    updateTableInfo();
    renderCategories();
    
    // Inicializar tema PRIMERO
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark-mode');
    } else {
        // Asegurar que no esté en modo oscuro si no está guardado
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark-mode');
    }
    
    // Mostrar productos locales INMEDIATAMENTE (para carga rápida)
    if (PRODUCTS.length > 0 && PRODUCTS_FROM_FIREBASE.length === 0) {
        PRODUCTS_FROM_FIREBASE = PRODUCTS.map((p, index) => ({
            id: p.id || `local-${index}`,
            ...p,
            available: p.available !== false
        }));
        renderProducts(); // Renderizar inmediatamente con productos locales
    }
    
    // Cargar productos desde Firestore EN SEGUNDO PLANO (actualizar después)
    loadProductsFromFirebase().then(() => {
        // Solo actualizar si Firebase tiene productos diferentes
        if (PRODUCTS_FROM_FIREBASE.length > 0) {
            renderProducts();
            console.log('✅ Productos actualizados desde Firebase');
        }
    }).catch(error => {
        console.warn('No se pudieron cargar productos desde Firebase, usando locales:', error);
    });
    
    // Probar conexión Firebase (solo para pedidos, no para el menú) - en segundo plano
    setTimeout(() => {
        testFirebaseConnection();
    }, 1000);
    
    console.log('✅ Sistema inicializado');
    showNotification('Sistema listo. ¡Bienvenido!', 'success');
}

// Función para aplicar traducciones a elementos con data-i18n
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            const translation = translations[currentLanguage][key];
            
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else if (el.innerHTML.includes('<i class=') || el.innerHTML.includes('<span')) {
                // Si el elemento tiene HTML interno (iconos), preservar el HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = el.innerHTML;
                const textNodes = Array.from(tempDiv.childNodes).filter(node => node.nodeType === 3); // Solo nodos de texto
                if (textNodes.length > 0) {
                    // Reemplazar solo el texto, preservar HTML
                    const htmlContent = el.innerHTML;
                    const textMatch = htmlContent.match(/>([^<]+)</);
                    if (textMatch) {
                        el.innerHTML = htmlContent.replace(textMatch[1], translation);
                    } else {
                        el.textContent = translation;
                    }
                } else {
                    el.textContent = translation;
                }
            } else {
                el.textContent = translation;
            }
        }
    });
    
    // También actualizar textos dinámicos que no tienen data-i18n
    updateTableInfo();
    
    console.log('✅ Traducciones aplicadas para:', currentLanguage);
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
        // Establecer valor actual
        languageSelect.value = currentLanguage;
        
        languageSelect.addEventListener('change', async (e) => {
            currentLanguage = e.target.value;
            localStorage.setItem('language', currentLanguage);
            
            // Aplicar traducciones a la interfaz
            applyTranslations();
            
            // Actualizar info de mesa (QR code)
            updateTableInfo();
            
            // Actualizar categorías con traducciones
            renderCategories();
            
            // Recargar productos para actualizar nombres Y descripciones en el idioma correcto
            await renderProducts();
            
            // Actualizar carrito si hay items (traducir nombres)
            if (cart.length > 0) {
                // Actualizar nombres de productos en el carrito
                cart.forEach(cartItem => {
                    const product = PRODUCTS_FROM_FIREBASE.find(p => p.id === cartItem.id);
                    if (product) {
                        cartItem.name = (currentLanguage === 'en' && product.nameEn) ? product.nameEn : product.name;
                    }
                });
                saveCart();
                updateCartUI();
            }
            
            // Si hay un pedido en seguimiento, actualizar los pasos de seguimiento
            if (orderInProgress && currentOrder) {
                renderOrderTrackingSteps();
            }
            
            console.log('Idioma cambiado a:', currentLanguage);
            showNotification(currentLanguage === 'es' 
                ? 'Idioma cambiado a español' 
                : 'Language changed to English', 'success');
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
        // Usar traducción según idioma actual
        const categoryName = (currentLanguage === 'en' && category.nameEn) ? category.nameEn : category.name;
        
        html += `
            <button class="category-btn ${activeClass}" 
                    onclick="filterByCategory('${category.id}')"
                    style="border-color: ${category.color};">
                <i class="${category.icon}"></i>
                ${categoryName}
            </button>
        `;
    });
    
    container.innerHTML = html;
}

// REGLA: El menú SOLO lee productos desde Firestore (collection: products)
async function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    // Si no hay productos cargados, usar locales primero para mostrar rápido
    if (PRODUCTS_FROM_FIREBASE.length === 0) {
        // Usar productos locales como fallback rápido
        if (PRODUCTS.length > 0) {
            PRODUCTS_FROM_FIREBASE = PRODUCTS.map((p, index) => ({
                id: p.id || `local-${index}`,
                ...p,
                available: p.available !== false
            }));
        } else {
            // Solo mostrar carga si no hay productos locales
            const loadingText = currentLanguage === 'en' 
                ? 'Loading products...' 
                : 'Cargando productos...';
            container.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; color: var(--primary);"></i><p style="margin-top: 20px;">${loadingText}</p></div>`;
            
            // Cargar desde Firebase SIN bloquear (en segundo plano)
            loadProductsFromFirebase().then(() => {
                renderProducts(); // Re-renderizar cuando termine
            }).catch(() => {
                console.warn('Error cargando desde Firebase');
            });
            
            return; // Salir sin bloquear - el loading ya se mostró
        }
    }
    
    let html = '';
    
    // Filtrar productos según categoría (solo productos disponibles)
    const filteredProducts = PRODUCTS_FROM_FIREBASE.filter(p => {
        const categoryMatch = currentCategory === 'all' || p.category === currentCategory;
        const available = p.available !== false;
        return categoryMatch && available;
    });
    
    if (filteredProducts.length === 0) {
        html = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <i class="fas fa-utensils" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                <h3>${currentLanguage === 'en' ? 'No products available' : 'No hay productos disponibles'}</h3>
                <p>${currentLanguage === 'en' ? 'In this category' : 'En esta categoría'}</p>
            </div>
        `;
    } else {
        filteredProducts.forEach(product => {
            const badge = product.featured ? `<div class="product-badge">⭐ ESPECIAL</div>` : '';
            const itemInCart = cart.find(item => item.id === product.id);
            const quantity = itemInCart ? itemInCart.quantity : 0;
            
            // Usar nameEn si el idioma es inglés, sino name
            const productName = (currentLanguage === 'en' && product.nameEn) ? product.nameEn : product.name;
            const productDescription = (currentLanguage === 'en' && product.descriptionEn) ? product.descriptionEn : (product.description || '');
            
            html += `
                <div class="product-card">
                    ${badge}
                    <img src="${product.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" alt="${productName}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
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

// REGLA: Cargar productos desde Firestore (collection: products)
// Si no hay productos en Firestore, cargar desde array local PRODUCTS
async function loadProductsFromFirebase() {
    try {
        // Verificar que Firebase esté disponible
        if (typeof db === 'undefined' || !db) {
            console.warn('Firebase no disponible, usando productos locales');
            throw new Error('Firebase no disponible');
        }
        
        console.log('📖 Cargando productos desde Firestore...');
        
        const snapshot = await db.collection('products').get();
        
        PRODUCTS_FROM_FIREBASE = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            PRODUCTS_FROM_FIREBASE.push({
                id: doc.id, // Usar ID de Firestore
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
        
        // Si no hay productos en Firestore, cargarlos desde el array local automáticamente
        if (PRODUCTS_FROM_FIREBASE.length === 0 && PRODUCTS.length > 0) {
            console.log('⚠️ No hay productos en Firestore. Inicializando productos desde array local...');
            await initializeProductsInFirestore();
            // Recargar después de inicializar
            const reloadSnapshot = await db.collection('products').get();
            PRODUCTS_FROM_FIREBASE = [];
            reloadSnapshot.forEach(doc => {
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
        }
        
        console.log(`✅ ${PRODUCTS_FROM_FIREBASE.length} productos cargados desde Firestore`);
        
        // Actualizar categorías disponibles según productos en Firestore
        updateAvailableCategories();
        
    } catch (error) {
        console.error('❌ Error cargando productos desde Firestore:', error);
        showNotification('Error cargando productos desde Firebase', 'error');
        
        // Si falla, usar datos locales como respaldo
        if (PRODUCTS_FROM_FIREBASE.length === 0 && PRODUCTS.length > 0) {
            console.warn('⚠️ Usando productos locales como respaldo');
            PRODUCTS_FROM_FIREBASE = PRODUCTS.map((p, index) => ({
                id: p.id || `local-${index}`,
                ...p,
                available: p.available !== false
            }));
        }
    }
}

// Inicializar productos en Firestore desde el array local (solo si no existen)
async function initializeProductsInFirestore() {
    try {
        console.log('📝 Inicializando productos en Firestore...');
        
        const batch = db.batch();
        let count = 0;
        
        PRODUCTS.forEach(product => {
            const productRef = db.collection('products').doc(product.id?.toString() || `product-${count}`);
            batch.set(productRef, {
                name: product.name || '',
                nameEn: product.nameEn || product.name || '',
                description: product.description || '',
                descriptionEn: product.descriptionEn || product.description || '',
                price: parseFloat(product.price || 0),
                category: product.category || 'mains',
                image: product.image || '',
                available: product.available !== false,
                featured: product.featured === true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            count++;
        });
        
        await batch.commit();
        console.log(`✅ ${count} productos inicializados en Firestore`);
        showNotification(`${count} productos cargados en Firebase`, 'success');
        
    } catch (error) {
        console.error('❌ Error inicializando productos en Firestore:', error);
        showNotification('Error al cargar productos en Firebase', 'error');
    }
}

// Actualizar categorías disponibles según productos en Firestore
function updateAvailableCategories() {
    const categoriesInProducts = new Set();
    PRODUCTS_FROM_FIREBASE.forEach(p => {
        if (p.category) categoriesInProducts.add(p.category);
    });
    
    // Mantener categorías base pero solo mostrar las que tienen productos
    // (Se puede mejorar filtrando CATEGORIES según categoriesInProducts)
}

// ============================================
// FUNCIONES DEL CARRITO
// ============================================
function addToCart(productId) {
    if (orderInProgress) {
        const errorText = currentLanguage === 'en' 
            ? 'You cannot modify the order in progress' 
            : 'No puedes modificar el pedido en progreso';
        showNotification(errorText, 'error');
        return;
    }
    
    // REGLA: Buscar producto desde Firestore (PRODUCTS_FROM_FIREBASE)
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
            name: product.name,
            price: product.price,
            quantity: 1,
            category: product.category
        });
    }
    
    saveCart();
    updateCartUI();
    showNotification(`${product.name} agregado`, 'success');
}

function updateProductQuantity(productId, change) {
    if (orderInProgress) {
        const errorText = currentLanguage === 'en' 
            ? 'You cannot modify the order in progress' 
            : 'No puedes modificar el pedido en progreso';
        showNotification(errorText, 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        // No permitir cantidad menor a 1
        if (item.quantity < 1) {
            item.quantity = 1;
        }
        
        // Actualizar visualización en producto
        const display = document.getElementById(`qty-${productId}`);
        if (display) {
            display.textContent = item.quantity;
        }
        
        saveCart();
        updateCartUI();
    } else if (change > 0) {
        // Si no está en el carrito y se presiona +, agregar al carrito
        addToCart(productId);
    }
}

// Función para recargar productos cuando cambian en Firestore
async function reloadProducts() {
    await loadProductsFromFirebase();
    await renderProducts();
}

function removeFromCart(productId) {
    if (orderInProgress) {
        const errorText = currentLanguage === 'en' 
            ? 'You cannot modify the order in progress' 
            : 'No puedes modificar el pedido en progreso';
        showNotification(errorText, 'error');
        return;
    }
    
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    const confirmText = currentLanguage === 'en'
        ? 'Remove this product from the order?'
        : '¿Eliminar este producto del pedido?';
    const deletedText = currentLanguage === 'en'
        ? 'Product removed'
        : 'Producto eliminado';
    
    if (confirm(confirmText)) {
        cart = cart.filter(item => item.id !== productId);
        saveCart();
        updateCartUI();
        showNotification(deletedText, 'info');
    }
}

function clearCart() {
    if (orderInProgress) {
        const errorText = currentLanguage === 'en' 
            ? 'You cannot modify the order in progress' 
            : 'No puedes modificar el pedido en progreso';
        showNotification(errorText, 'error');
        return;
    }
    
    if (cart.length === 0) {
        const emptyText = currentLanguage === 'en'
            ? 'The cart is already empty'
            : 'El carrito ya está vacío';
        showNotification(emptyText, 'info');
        return;
    }
    
    const confirmText = currentLanguage === 'en'
        ? 'Clear the entire cart?'
        : '¿Vaciar todo el carrito?';
    const clearedText = currentLanguage === 'en'
        ? 'Cart cleared'
        : 'Carrito vaciado';
    
    if (confirm(confirmText)) {
        cart = [];
        saveCart();
        updateCartUI();
        showNotification(clearedText, 'info');
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
    
    // Total SIN IVA ni servicio - solo precios directos
    const total = subtotal; // No agregar impuestos
    
    document.getElementById('cartTotalAmount').textContent = `$${total.toFixed(2)}`;
    
    const confirmBtn = document.getElementById('confirmOrderBtn');
    if (confirmBtn) {
        confirmBtn.disabled = cart.length === 0 || orderInProgress;
        const sentText = currentLanguage === 'en' ? 'Order Sent' : 'Pedido Enviado';
        const sendText = currentLanguage === 'en' ? 'Send Order' : 'Enviar Pedido';
        confirmBtn.innerHTML = orderInProgress 
            ? `<i class="fas fa-check"></i> ${sentText}`
            : `<i class="fas fa-paper-plane"></i> ${sendText}`;
    }
}

// ============================================
// FUNCIONES DEL PEDIDO CON FIREBASE
// ============================================
async function confirmOrder() {
    if (cart.length === 0) {
        showNotification('Agrega productos al carrito primero', 'error');
        return;
    }
    
    // Calcular totales
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * CONFIG.TAX_RATE;
    const service = subtotal * CONFIG.SERVICE_FEE;
    const total = subtotal + tax + service;
    
    // Preparar lista de productos
    const productsList = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    // Confirmación
    const confirmation = `
¿Enviar pedido a la cocina?

Mesa: ${currentTable}
Productos: ${productsList}
Total: $${total.toFixed(2)}

¿Confirmar?`;
    
    if (!confirm(confirmation)) return;
    
    try {
        const sendingText = currentLanguage === 'en'
            ? 'Sending order to kitchen...'
            : 'Enviando pedido a cocina...';
        showNotification(sendingText, 'info');
        
        // Preparar datos para Firebase
        // REGLA: Generar código único para el pedido (no es simulación, es identificación)
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
            total: total.toFixed(2),
            status: 'pending', // Estado inicial siempre 'pending' - solo cambia por clic manual desde panel
            code: orderCode,
            notes: 'Pedido desde menú digital',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Enviando a Firebase:', orderData);
        
        // Enviar a Firebase
        const docRef = await db.collection('orders').add(orderData);
        
        if (docRef.id) {
            // Crear orden local
            const orderId = docRef.id;
            const code = orderData.code;
            
            currentOrder = {
                id: orderId,
                code: code,
                table: currentTable,
                cart: [...cart],
                subtotal: subtotal,
                total: total, // Total sin IVA ni servicio
                timestamp: new Date().toISOString()
            };
            
            orderInProgress = true;
            
            // Mostrar seguimiento
            showOrderTracking(orderId);
            const successText = currentLanguage === 'en'
                ? 'Order sent successfully!'
                : '¡Pedido enviado exitosamente!';
            showNotification(successText, 'success');
            
            // Limpiar carrito
            cart = [];
            saveCart();
            updateCartUI();
            
            // NO configurar el listener aquí - se configurará desde showOrderTracking
            // El listener se configurará automáticamente cuando se muestre el seguimiento
            
        } else {
            throw new Error('Error al crear pedido en Firebase');
        }
        
    } catch (error) {
        console.error('Error al enviar pedido a Firebase:', error);
        showNotification('Error al conectar con Firebase. Guardando localmente.', 'warning');
        
        // Crear orden local como respaldo
        const orderId = 'ORD-' + Date.now().toString().slice(-8);
        const code = Math.floor(100000 + Math.random() * 900000);
        
        currentOrder = {
            id: orderId,
            code: code,
            table: currentTable,
            cart: [...cart],
            subtotal: subtotal,
            total: total, // Total sin IVA ni servicio
            timestamp: new Date().toISOString()
        };
        
        orderInProgress = true;
        showOrderTracking(orderId);
        
        cart = [];
        saveCart();
        updateCartUI();
    }
}

function showOrderTracking(orderId) {
    console.log(`📋 Mostrando seguimiento para pedido: ${orderId}`);
    
    const tracking = document.getElementById('orderTracking');
    const summary = document.getElementById('cartSummary');
    
    if (tracking) {
        tracking.style.display = 'block';
        const orderIdDisplay = document.getElementById('orderIdDisplay');
        if (orderIdDisplay) {
            orderIdDisplay.textContent = orderId;
        }
        
        // Asegurar que el seguimiento esté visible y los pasos renderizados
        renderOrderTrackingSteps();
        
        // Inicializar con estado "pending"
        setTimeout(() => {
            updateTrackingSteps('pending');
        }, 100);
        
        // IMPORTANTE: Configurar el listener DESPUÉS de mostrar el seguimiento
        if (orderId && orderInProgress) {
            setTimeout(() => {
                console.log(`🔧 Configurando listener desde showOrderTracking para: ${orderId}`);
                setupOrderStatusListener(orderId);
            }, 300);
        }
    }
    
    if (summary) {
        summary.style.display = 'none';
    }
    
    // Ocultar factura si está visible
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'none';
    }
}

function renderOrderTrackingSteps() {
    // Usar traducciones para los labels
    const steps = [
        { 
            id: 'pending', 
            label: currentLanguage === 'en' ? 'Received' : 'Recibido', 
            icon: 'fas fa-clipboard-check' 
        },
        { 
            id: 'preparing', 
            label: currentLanguage === 'en' ? 'Preparing' : 'Preparando', 
            icon: 'fas fa-utensils' 
        },
        { 
            id: 'cooking', 
            label: currentLanguage === 'en' ? 'Cooking' : 'Cocinando', 
            icon: 'fas fa-fire' 
        },
        { 
            id: 'ready', 
            label: currentLanguage === 'en' ? 'Ready' : 'Listo', 
            icon: 'fas fa-check-circle' 
        },
        { 
            id: 'delivered', 
            label: currentLanguage === 'en' ? 'Delivered' : 'Entregado', 
            icon: 'fas fa-concierge-bell' 
        }
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
        
        // Inicializar con estado "pending" activo
        const pendingStep = document.getElementById('step-pending');
        if (pendingStep) {
            pendingStep.classList.add('step-active');
        }
    }
}

// Listener en tiempo real para el estado del pedido desde Firebase
// ACTUALIZACIÓN EN TIEMPO REAL: El cliente ve los cambios cuando el panel cambia el estado
function setupOrderStatusListener(orderId) {
    if (typeof db === 'undefined' || !db) {
        console.warn('Firebase no disponible para listener de estado');
        return null;
    }
    
    // Cancelar listener anterior si existe
    if (orderStatusListener) {
        console.log('🛑 Cancelando listener anterior');
        orderStatusListener();
        orderStatusListener = null;
    }
    
    console.log(`👂 Configurando listener de estado para pedido: ${orderId}`);
    console.log(`🔗 Referencia al documento: orders/${orderId}`);
    
    // Verificar que el documento existe primero (solo para debug)
    db.collection('orders').doc(orderId).get().then((doc) => {
        if (doc.exists()) {
            console.log(`✅ El pedido ${orderId} existe en Firebase`);
            console.log(`📋 Estado actual en Firebase:`, doc.data().status);
        } else {
            console.warn(`⚠️ El pedido ${orderId} no existe aún en Firebase`);
        }
    }).catch(err => {
        console.error('Error verificando documento:', err);
    });
    
    // Escuchar cambios en el estado del pedido en tiempo real
    // LISTENER SIMPLE: Escucha TODOS los cambios en el documento del pedido
    // IMPORTANTE: Este listener se ejecutará CADA VEZ que cambie el documento en Firebase
    orderStatusListener = db.collection('orders').doc(orderId).onSnapshot(
        (doc) => {
            // Este callback se ejecuta CADA VEZ que hay un cambio en Firebase
            console.log('📡 SNAPSHOT RECIBIDO desde Firebase - Listener activo');
            
            if (doc.exists()) {
                const data = doc.data();
                const status = data.status || 'pending';
                const previousStatus = currentOrder?.status || 'none';
                
                console.log(`🔄 CAMBIO DETECTADO: Estado actualizado de "${previousStatus}" a "${status}"`);
                console.log(`📄 Datos completos:`, data);
                
                // Asegurar que el seguimiento esté visible
                const tracking = document.getElementById('orderTracking');
                if (!tracking) {
                    console.error('❌ Elemento orderTracking no existe en DOM');
                    return;
                }
                
                tracking.style.display = 'block';
                console.log('✅ Seguimiento visible');
                
                // Actualizar currentOrder con los datos de Firebase
                if (!currentOrder) {
                    currentOrder = {
                        id: doc.id,
                        status: status
                    };
                } else {
                    currentOrder.id = doc.id;
                    currentOrder.status = status;
                }
                
                // Preparar datos del pedido si faltan
                if (!currentOrder.table && data.table) {
                    currentOrder.table = data.table;
                }
                if (!currentOrder.code && data.code) {
                    currentOrder.code = data.code;
                }
                if (!currentOrder.timestamp && data.createdAt) {
                    currentOrder.timestamp = data.createdAt.toDate ? data.createdAt.toDate() : new Date();
                }
                if (!currentOrder.cart && data.productsDetails) {
                    currentOrder.cart = data.productsDetails.map(item => ({
                        id: item.id || '',
                        name: item.name || '',
                        price: item.price || 0,
                        quantity: item.quantity || 1
                    }));
                }
                
                // Re-renderizar los pasos para asegurar que existan
                renderOrderTrackingSteps();
                
                // ACTUALIZAR PASOS INMEDIATAMENTE con el nuevo estado
                requestAnimationFrame(() => {
                    updateTrackingSteps(status);
                    console.log(`✅ UI actualizada al estado: ${status}`);
                });
                
                // Mostrar notificación solo si el estado cambió realmente
                if (previousStatus !== status) {
                    const statusLabels = {
                        'pending': currentLanguage === 'en' ? 'Received' : 'Recibido',
                        'preparing': currentLanguage === 'en' ? 'Preparing' : 'Preparando',
                        'cooking': currentLanguage === 'en' ? 'Cooking' : 'Cocinando',
                        'ready': currentLanguage === 'en' ? 'Ready' : 'Listo',
                        'delivered': currentLanguage === 'en' ? 'Delivered' : 'Entregado'
                    };
                    
                    const statusUpdateText = currentLanguage === 'en'
                        ? `Status updated: ${statusLabels[status]}`
                        : `Estado actualizado: ${statusLabels[status]}`;
                    showNotification(statusUpdateText, 'success');
                }
                
                // Mostrar botón "Ver Factura" si hay pedido activo
                const viewInvoiceBtn = document.getElementById('viewInvoiceBtn');
                if (viewInvoiceBtn && orderInProgress) {
                    viewInvoiceBtn.style.display = 'inline-block';
                }
                
                // Si el pedido fue entregado, mostrar factura automáticamente
                if (status === 'delivered') {
                    console.log('✅ Pedido entregado, mostrando factura automáticamente...');
                    setTimeout(() => {
                        showInvoice();
                        console.log('📄 Factura mostrada al cliente');
                    }, 500);
                }
            } else {
                console.warn('⚠️ El documento del pedido no existe en Firebase');
            }
        },
        (error) => {
            console.error('❌ ERROR en listener de estado del pedido:', error);
            console.error('Detalles del error:', error.message);
            showNotification('Error al conectar con el servidor', 'error');
            
            // Reintentar conexión después de 5 segundos
            setTimeout(() => {
                console.log('🔄 Reintentando conexión del listener...');
                if (currentOrder && currentOrder.id) {
                    setupOrderStatusListener(currentOrder.id);
                }
            }, 5000);
        }
    );
    
    console.log('✅ Listener configurado correctamente para pedido:', orderId);
    return orderStatusListener; // Devolver función para poder cancelar si es necesario
}

function showInvoiceFromTracking() {
    // Esta función muestra la factura desde el botón del seguimiento
    if (!currentOrder) {
        showNotification('No hay información del pedido disponible', 'error');
        return;
    }
    showInvoice();
}

function backToTracking() {
    // Volver al seguimiento desde la factura
    const invoice = document.getElementById('invoice');
    const tracking = document.getElementById('orderTracking');
    
    if (invoice) {
        invoice.style.display = 'none';
    }
    
    if (tracking && orderInProgress) {
        tracking.style.display = 'block';
    }
}

function showInvoice() {
    if (!currentOrder) {
        console.warn('⚠️ No hay currentOrder para mostrar factura');
        return;
    }
    
    console.log('📄 Mostrando factura para pedido:', currentOrder.id);
    
    // Ocultar seguimiento
    const tracking = document.getElementById('orderTracking');
    if (tracking) {
        tracking.style.display = 'none';
    }
    
    // Mostrar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'block';
        
        // Mostrar botón "Volver al seguimiento" solo si el pedido NO está entregado
        const backBtn = document.getElementById('backToTrackingBtn');
        if (backBtn) {
            if (currentOrder.status === 'delivered') {
                backBtn.style.display = 'none';
            } else {
                backBtn.style.display = 'inline-block';
            }
        }
        
        // Llenar datos
        document.getElementById('invoiceTable').textContent = currentOrder.table;
        document.getElementById('invoiceOrderId').textContent = currentOrder.id;
        document.getElementById('invoiceTime').textContent = new Date(currentOrder.timestamp).toLocaleTimeString('es-MX', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('invoiceCode').textContent = currentOrder.code;
        
        // Calcular total SIN IVA ni servicio - solo precios directos
        let subtotalSinImpuestos = 0;
        let itemsHtml = '';
        
        currentOrder.cart.forEach(item => {
            const itemTotal = parseFloat(item.price || 0) * parseFloat(item.quantity || 1);
            subtotalSinImpuestos += itemTotal;
            itemsHtml += `
                <div class="invoice-item">
                    <div>
                        <div style="font-weight: 600;">${item.quantity}x ${item.name}</div>
                        <div style="font-size: 0.875rem; color: #666;">$${parseFloat(item.price || 0).toFixed(2)} c/u</div>
                    </div>
                    <div style="font-weight: 600;">$${itemTotal.toFixed(2)}</div>
                </div>
            `;
        });
        
        // Mostrar solo el total directo sin impuestos
        document.getElementById('invoiceTotal').textContent = `$${subtotalSinImpuestos.toFixed(2)}`;
        
        // No agregar IVA ni servicio - solo mostrar items y total
        document.getElementById('invoiceItems').innerHTML = itemsHtml;
    }
    
    // Guardar en historial
    saveOrderToHistory();
}

function newOrder() {
    orderInProgress = false;
    currentOrder = null;
    
    // Cancelar listener si existe
    if (orderStatusListener) {
        orderStatusListener();
        orderStatusListener = null;
    }
    
    // Ocultar factura
    const invoice = document.getElementById('invoice');
    if (invoice) {
        invoice.style.display = 'none';
    }
    
    // Ocultar seguimiento
    const tracking = document.getElementById('orderTracking');
    if (tracking) {
        tracking.style.display = 'none';
    }
    
    // Ocultar botón "Ver Factura"
    const viewInvoiceBtn = document.getElementById('viewInvoiceBtn');
    if (viewInvoiceBtn) {
        viewInvoiceBtn.style.display = 'none';
    }
    
    // Mostrar resumen vacío
    const summary = document.getElementById('cartSummary');
    if (summary) {
        summary.style.display = 'block';
    }
    
    renderCartItems();
    const readyText = currentLanguage === 'en'
        ? 'Ready for new order'
        : 'Listo para nuevo pedido';
    showNotification(readyText, 'success');
}

// Exportar funciones para uso global
window.showInvoiceFromTracking = showInvoiceFromTracking;
window.backToTracking = backToTracking;

// ============================================
// FUNCIONES AUXILIARES
// ============================================
async function filterByCategory(categoryId) {
    currentCategory = categoryId;
    renderCategories();
    await renderProducts(); // Ahora es async porque lee de Firestore
}

function toggleTheme() {
    const body = document.body;
    const html = document.documentElement;
    const isDark = body.classList.toggle('dark-mode');
    
    // También aplicar a html para mejor compatibilidad
    if (isDark) {
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
    }
    
    localStorage.setItem('darkMode', isDark);
    
    const message = isDark 
        ? (currentLanguage === 'en' ? 'Dark mode activated' : 'Modo oscuro activado')
        : (currentLanguage === 'en' ? 'Light mode activated' : 'Modo claro activado');
    showNotification(message, 'info');
    
    console.log('Tema cambiado:', isDark ? 'oscuro' : 'claro');
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
        
        // Intentar leer una colección de prueba
        const testDoc = await db.collection('test').limit(1).get();
        console.log('✅ Conexión a Firebase exitosa');
        showNotification('Conectado a Firebase', 'success');
        return true;
    } catch (error) {
        console.log('⚠️ Firebase no configurado o en modo local:', error);
        showNotification('Firebase no configurado. Usando modo local.', 'warning');
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