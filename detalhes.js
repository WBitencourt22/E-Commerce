let currentProductData = null;

// --- FUNÇÕES DE UTILIDADE E PERSISTÊNCIA ---

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

// 1. Salva o carrinho no localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// 2. Atualiza o badge no cabeçalho
function updateCartBadge() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// --- FUNÇÕES DO MODAL ---

function openCart() {
    document.getElementById('cart-modal').classList.add('active');
    updateCartModal();
}

function closeCart() {
    document.getElementById('cart-modal').classList.remove('active');
}

function updateCartModal() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
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
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
            saveCart(cart); 
            updateCartBadge();
            updateCartModal();
        }
    }
}

function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart); 
    updateCartBadge();
    updateCartModal();
}

function checkout() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length > 0) {
        saveCart(cart); 
        window.location.href = 'pagamento.html';
    } else {
        alert('Seu carrinho está vazio!');
    }
}

// --- FUNÇÃO PARA ADICIONAR AO CARRINHO (DA PÁGINA DE DETALHES) ---
function addToCartFromDetails() {
    if (!currentProductData) {
        alert("Erro: Dados do produto não carregados.");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const productId = currentProductData.id;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...currentProductData, quantity: 1 });
    }
    
    saveCart(cart);
    updateCartBadge();
}

// --- FUNÇÃO PARA CARREGAR DETALHES E GRÁFICO ---

function loadProductDetails(productId) {
    const container = document.querySelector('.product-detail-container');
    const loadingMessage = document.getElementById('loading-message');
    container.style.opacity = 0; 

    if (!productId) {
        loadingMessage.textContent = '⚠️ ID do produto não encontrado na URL.';
        return;
    }

    fetch(`https://dummyjson.com/products/${productId}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Produto com ID ${productId} não encontrado.`);
            }
            return res.json();
        })
        .then(product => {
            currentProductData = product; 
            
            loadingMessage.style.display = 'none';
            container.style.opacity = 1; 

            document.getElementById('product-detail-title').textContent = product.title;
            document.getElementById('page-title').textContent = product.title;
            document.getElementById('product-detail-thumbnail').src = product.thumbnail;
            document.getElementById('product-detail-price').textContent = `R$ ${product.price.toFixed(2)}`;
            document.getElementById('product-detail-description').textContent = product.description;

            const specsList = document.getElementById('product-detail-specs');
            specsList.innerHTML = `
                <li>Marca: <strong>${product.brand}</strong></li>
                <li>Categoria: <strong>${product.category}</strong></li>
                <li>Estoque: <strong>${product.stock} unidades</strong></li>
                <li>Avaliação dos Clientes: <strong>${product.rating} ⭐</strong></li>
            `;

            const btnComprar = document.querySelector('.btn-comprar');
            if (btnComprar) {
                btnComprar.onclick = addToCartFromDetails;
            }

            // Inicializa o badge
            updateCartBadge();

            generateQualityChart(product);
        })
        .catch(error => {
            console.error("Erro ao carregar detalhes do produto:", error);
            loadingMessage.textContent = '❌ Erro ao carregar detalhes. ' + error.message;
        });
}

function generateQualityChart(product) {
    const ctx = document.getElementById('qualityChart').getContext('2d');
    
    const chartData = {
        labels: ['Avaliação (Max 5.0)', 'Disponibilidade (Max 1000)'],
        datasets: [{
            label: 'Métricas do Produto',
            data: [product.rating, product.stock > 1000 ? 1000 : product.stock],
            backgroundColor: [
                'rgba(14, 148, 25, 0.7)', 
                'rgba(59, 130, 246, 0.7)'
            ],
            borderColor: [
                'rgba(14, 148, 25, 1)',
                'rgba(59, 130, 246, 1)'
            ],
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 5.5,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: `Média de Qualidade: ${product.rating} / 5.0`
                }
            }
        }
    });
}

// --- INICIALIZAÇÃO E EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    const productId = getProductIdFromUrl();
    loadProductDetails(productId);
    
    // Inicializa o badge no carregamento da página
    updateCartBadge(); 

    // Fecha modais ao clicar fora
    window.onclick = function(event) {
        const cartModal = document.getElementById('cart-modal');
        if (event.target === cartModal) {
            closeCart();
        }
    }
});