// Carrega o carrinho do localStorage. Se não existir, inicializa como array vazio.
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let allProducts = [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// --- FUNÇÃO DE RENDERIZAÇÃO DE PRODUTOS ---
function renderProducts(productsToRender) {
    const container = document.getElementById("produto-card");
    container.innerHTML = '';

    if (productsToRender.length === 0) {
        container.innerHTML = '<p class="loading">Nenhum produto encontrado com o termo pesquisado.</p>';
        return;
    }

    productsToRender.forEach((item) => {
        container.innerHTML += `
            <div class="card">
                <img src="${item.thumbnail}" alt="${item.title}">
                <h2>${item.title}</h2>
                <p>${item.description}</p>
                <div class="price">Preço: R$ ${item.price.toFixed(2)}</div>
                <div class="rating">⭐ Ranking: ${item.rating}</div>
                <div class="btn-group">
                    <button class="btn-comprar" onclick="viewProductDetails(${item.id})">Ver Detalhes</button>
                    <button class="btn-carrinho" onclick="addToCart(${item.id})"> 
                        <span class="material-symbols-outlined icon-small">add_shopping_cart</span>
                        Adicionar ao carrinho
                    </button>
                </div>
            </div>`;
    });
}

// --- FUNÇÃO DE CARREGAMENTO DE PRODUTOS ---
function loadProducts() {
    fetch("https://dummyjson.com/products")
        .then(res => res.json())
        .then(data => {
            allProducts = data.products.slice(0, 30);
            renderProducts(allProducts); // Chama a função de renderização
        })
        .catch(error => {
            console.error("Erro ao carregar produto", error);
            document.getElementById("produto-card").innerHTML = '<p class="loading">Erro ao carregar produtos</p>';
        });
}

// --- FUNÇÃO DE PESQUISA DINÂMICA ---
function handleSearch(event) {
    if (event.type === 'submit') {
        event.preventDefault();
    }

    const searchInput = document.querySelector('.search-bar input');
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === "") {
        renderProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product => {
        return product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);
    });

    renderProducts(filteredProducts);
}

// --- FUNÇÃO PARA VER DETALHES ---
function viewProductDetails(productId) {
    // CORRIGIDO: Redireciona para detalhes.html
    window.location.href = `detalhes.html?id=${productId}`;
}


// --- FUNÇÃO DE INICIALIZAÇÃO PRINCIPAL ---
function init() {
    // Somente carrega produtos se a página tiver o container de produtos
    if (document.getElementById('produto-card')) {
        loadProducts();
    }

    // Atualiza badge do carrinho em todas as páginas
    updateCartBadge();

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const searchForm = document.querySelector('.search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
}


// --- INICIALIZAÇÃO DA PÁGINA ---
window.onload = init;

// --- FUNÇÕES DE CARRINHO ---
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCartBadge();
    updateCartModal();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function openCart() {
    document.getElementById('cart-modal').classList.add('active');
    updateCartModal();
}

function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
}

function updateCartModal() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Seu carrinho está vazio</p></div>`;
        cartFooter.style.display = 'none';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-desc">${item.description.substring(0, 50)}...</div>
                    <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cart-total').textContent = `R$ ${total.toFixed(2)}`;
        cartFooter.style.display = 'block';
    }
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            saveCart();
            updateCartBadge();
            updateCartModal();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartBadge();
    updateCartModal();
}

function checkout() {
    if (cart.length > 0) {
        saveCart();
        window.location.href = 'pagamento.html';
    } else {
        alert('Seu carrinho está vazio!');
    }
    closeCart();
}

// Funções de modal de pagamento
function showPaymentModal(price, id) {
    document.getElementById('modal-price').textContent = `R$ ${parseFloat(price).toFixed(2)}`;
    document.getElementById('payment-modal').classList.add('active');
    document.getElementById('qrcode-container').innerHTML = '<p>🔲 QR Code do PIX</p>';
}

function closeModal() {
    document.getElementById('payment-modal').classList.remove('active');
}

// Fecha modais ao clicar fora
window.onclick = function (event) {
    const cartModal = document.getElementById('cart-modal');
    const paymentModal = document.getElementById('payment-modal');

    if (event.target === cartModal) {
        closeCart();
    }
    if (event.target === paymentModal) {
        closeModal();
    }
}