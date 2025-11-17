// Constante para o valor do frete
const SHIPPING_COST = 15.00; 
const PIX_DISCOUNT_PERCENTAGE = 0.05; // 5% de desconto
const MAX_INSTALLMENTS = 12; // Máximo de parcelas

// --- FUNÇÕES AUXILIARES DE CÁLCULO ---

// Função auxiliar para calcular o subtotal
function calculateSubtotal() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Função para simular taxas de juros por parcelamento
function getInstallmentRate(times) {
    if (times <= 3) return 0.00; // Juros zero até 3x
    if (times <= 6) return 0.01; // 1% de juros até 6x
    return 0.02; // 2% de juros para o restante
}

// --- FUNÇÕES DE MODAL PIX ---

function openPixModal(totalAmount) {
    const detailsContainer = document.getElementById('pix-modal-body');
    
    const pixKey = "12345678900@simulacao.com.br";
    const subtotal = calculateSubtotal();
    const discount = subtotal * PIX_DISCOUNT_PERCENTAGE;

    // URL para gerar o QR Code (simulado)
    const qrCodeData = `Pagamento PIX: R$ ${totalAmount.toFixed(2)} - Chave: ${pixKey}`;
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeData)}`;

    detailsContainer.innerHTML = `
        <div class="pix-details-box">
            <h4>Seu PIX foi gerado com sucesso!</h4>
            <p>Valor do Pedido: R$ ${subtotal.toFixed(2)}</p>
            <p>Desconto PIX (-5%): - R$ ${discount.toFixed(2)}</p>
            <p>Frete: R$ ${SHIPPING_COST.toFixed(2)}</p>
            <p class="final-total">Total a Pagar: <strong>R$ ${totalAmount.toFixed(2)}</strong></p>
            
            <div class="qrcode-area">
                <img src="${qrCodeImageUrl}" alt="QR Code PIX"> 
            </div>
            <p class="pix-key-info">Ou copie e cole a chave PIX:</p>
            <strong class="pix-key-value">${pixKey}</strong>
            <small>O prazo para pagamento é de 30 minutos.</small>
        </div>
    `;

    document.getElementById('pix-modal').classList.add('active');
    localStorage.removeItem('cart'); // Simula a finalização e limpeza do carrinho
}

function closePixModal() {
    document.getElementById('pix-modal').classList.remove('active');
    setTimeout(() => {
        window.location.href = 'index.html'; 
    }, 500);
}

// --- FUNÇÃO PARA MOSTRAR DETALHES DO CARTÃO ---
function showCreditCardDetails(totalAmount) {
    const detailsContainer = document.getElementById('payment-details');
    let html = `
        <div class="card-details-box">
            <h4>Dados do Cartão</h4>
            <input type="text" placeholder="Número do Cartão (16 dígitos)" pattern="[0-9]{16}" maxlength="16" required>
            <input type="text" placeholder="Nome Impresso no Cartão" required>
            <div style="display: flex; gap: 10px;">
                <input type="text" placeholder="Validade (MM/AA)" pattern="[0-9]{2}/[0-9]{2}" maxlength="5" required style="width: 50%;">
                <input type="text" placeholder="CVV (3 ou 4 dígitos)" pattern="[0-9]{3,4}" maxlength="4" required style="width: 50%;">
            </div>

            <h4>Escolha o Parcelamento</h4>
            <select id="installment-select" required>
                </select>
        </div>
    `;
    
    detailsContainer.innerHTML = html;

    // Lógica para preencher as opções de parcelamento
    const select = document.getElementById('installment-select');
    let optionsHtml = '<option value="" disabled selected>Selecione o número de parcelas</option>';
    
    for (let i = 1; i <= MAX_INSTALLMENTS; i++) {
        const rate = getInstallmentRate(i);
        const totalWithInterest = totalAmount * (1 + rate);
        const installmentValue = totalWithInterest / i;
        
        let label = `${i}x de R$ ${installmentValue.toFixed(2)}`;
        
        if (i === 1) {
             label = `1x de R$ ${totalAmount.toFixed(2)} (À Vista)`;
        } else if (rate === 0.00) {
            label += ` (Juros Zero)`;
        } else {
            label += ` (Total R$ ${totalWithInterest.toFixed(2)})`;
        }

        optionsHtml += `<option value="${i}">${label}</option>`;
    }
    
    select.innerHTML = optionsHtml;
}

// --- FUNÇÃO PARA ATUALIZAR DETALHES DE PAGAMENTO ---
function updatePaymentDetails() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    const detailsContainer = document.getElementById('payment-details');
    detailsContainer.innerHTML = ''; 

    const subtotal = calculateSubtotal();
    const totalWithShipping = subtotal + SHIPPING_COST;

    if (paymentMethod && paymentMethod.value === 'pix') {
        detailsContainer.innerHTML = `<p class="pix-info-discount">Você ganhará 5% de desconto no total da compra!</p>`;
    } else if (paymentMethod && paymentMethod.value === 'credit_card') {
        showCreditCardDetails(totalWithShipping);
    }
}


// --- FUNÇÃO DE PROCESSAMENTO DE PAGAMENTO ---
function processPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        alert("Por favor, selecione uma forma de pagamento.");
        return;
    }

    const subtotal = calculateSubtotal();
    let total = subtotal + SHIPPING_COST;
    
    if (paymentMethod.value === 'pix') {
        const discount = subtotal * PIX_DISCOUNT_PERCENTAGE;
        let totalWithDiscount = total - discount;
        openPixModal(totalWithDiscount); // Abre o modal do PIX

    } else if (paymentMethod.value === 'credit_card') {
        const installmentSelect = document.getElementById('installment-select');
        // Validação se o campo de parcelas foi preenchido
        if (!installmentSelect || !installmentSelect.value) {
            alert("Por favor, selecione o número de parcelas.");
            return;
        }

        // Simulação de finalização do Cartão
        const installments = installmentSelect.value;
        const rate = getInstallmentRate(installments);
        const totalWithInterest = total * (1 + rate);
        const installmentValue = totalWithInterest / installments;
        
        alert(`Pedido finalizado com Cartão de Crédito! \n\n${installments}x de R$ ${installmentValue.toFixed(2)}.\nTotal: R$ ${totalWithInterest.toFixed(2)}`);
        
        localStorage.removeItem('cart');
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 1500);
    }
    
    else {
        // Boleto ou outros
        alert(`Pedido finalizado com sucesso! \n\n${paymentMethod.value} selecionado.\nTotal a pagar: R$ ${total.toFixed(2)}`);
        
        localStorage.removeItem('cart');
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 1500);
    }
}


// --- FUNÇÕES DE CARREGAMENTO ---

function loadCartSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const container = document.getElementById('cart-summary-items');
    
    const subtotalElement = document.getElementById('subtotal-value');
    const totalElement = document.getElementById('total-value');
    const loadingMessage = document.getElementById('loading-message');

    if (loadingMessage) loadingMessage.style.display = 'none';

    if (cart.length === 0) {
        container.innerHTML = '<p class="cart-empty-checkout">Seu carrinho está vazio. Volte para a loja!</p>';
        subtotalElement.textContent = 'R$ 0.00';
        totalElement.textContent = `R$ ${SHIPPING_COST.toFixed(2)}`;
        return;
    }

    let subtotal = calculateSubtotal();
    
    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="checkout-item">
                <img src="${item.thumbnail}" alt="${item.title}" class="checkout-item-image">
                <div class="checkout-item-details">
                    <div class="checkout-item-title">${item.title}</div>
                    <div class="checkout-item-qty">Qtde: ${item.quantity}</div>
                    <div class="checkout-item-price">R$ ${item.price.toFixed(2)}</div>
                </div>
                <div class="checkout-item-total">R$ ${itemTotal.toFixed(2)}</div>
            </div>
        `;
    }).join('');

    let total = subtotal + SHIPPING_COST;
    
    subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('shipping-value').textContent = `R$ ${SHIPPING_COST.toFixed(2)}`;
    totalElement.textContent = `R$ ${total.toFixed(2)}`;
    
    // Configura o listener para atualizar os detalhes ao trocar a opção
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    paymentOptions.forEach(radio => {
        radio.addEventListener('change', updatePaymentDetails);
    });
    
    updatePaymentDetails(); 
}


// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', loadCartSummary);