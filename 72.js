// --- Data and State ---
const menuItems = [
    { id: 1, name: '招牌珍珠奶茶', price: 65, icon: '🧋' },
    { id: 2, name: '經典紅茶', price: 35, icon: '🍵' },
    { id: 3, name: '翠玉綠茶', price: 35, icon: '🍵' },
    { id: 4, name: '百香雙Q果', price: 60, icon: '🥤' },
    { id: 5, name: '黑糖珍珠鮮奶', price: 75, icon: '🥛' },
    { id: 6, name: '檸檬多多', price: 55, icon: '🍋' },
    { id: 7, name: '甘蔗青茶', price: 50, icon: '🌾' },
    { id: 8, name: '拿鐵咖啡', price: 85, icon: '☕' },
];

let cart = [];
let orderHistory = JSON.parse(localStorage.getItem('teaPosHistory')) || [];

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    updateDashboard();
});

// --- View Navigation ---
function switchView(viewName) {
    // Update nav active state
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');

    // Update view visibility
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
    document.getElementById(`view-${viewName}`).classList.add('active-view');

    // Refresh dashboard data if switching to it
    if (viewName === 'dashboard') {
        updateDashboard();
    }
}

// --- Menu Functions ---
function initMenu() {
    const menuGrid = document.getElementById('menu-grid');
    menuGrid.innerHTML = '';

    menuItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item';
        itemEl.onclick = () => addToCart(item);
        itemEl.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">$${item.price}</div>
        `;
        menuGrid.appendChild(itemEl);
    });
}

// --- Cart Functions ---
function addToCart(item) {
    const existingItem = cart.find(ci => ci.id === item.id);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ ...item, qty: 1 });
    }
    renderCart();
}

function updateQty(id, delta) {
    const item = cart.find(ci => ci.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(ci => ci.id !== id);
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<div class="empty-cart">購物車是空的</div>';
        checkoutBtn.disabled = true;
        subtotalEl.textContent = '$0';
        totalEl.textContent = '$0';
        return;
    }

    checkoutBtn.disabled = false;
    cartContainer.innerHTML = '';

    let total = 0;
    cart.forEach(item => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;

        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.icon} ${item.name}</div>
                <div class="cart-item-price">$${item.price} / 單位</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                <div class="cart-item-qty">${item.qty}</div>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
            </div>
        `;
        cartContainer.appendChild(itemEl);
    });

    subtotalEl.textContent = `$${total}`;
    totalEl.textContent = `$${total}`;
}

// --- Checkout Functions ---
function generateOrderId() {
    const date = new Date();
    const prefix = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${prefix}-${random}`;
}

function checkout() {
    if (cart.length === 0) return;

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const orderFormat = {
        id: generateOrderId(),
        time: new Date().toLocaleString('zh-TW'),
        items: [...cart],
        total: totalAmount
    };

    // Add to history and save
    orderHistory.unshift(orderFormat);
    localStorage.setItem('teaPosHistory', JSON.stringify(orderHistory));

    // Show toast
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);

    // Clear cart
    cart = [];
    renderCart();
}

// --- Dashboard Functions ---
function updateDashboard() {
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalOrdersEl = document.getElementById('total-orders');
    const avgOrderValueEl = document.getElementById('avg-order-value');
    const tableBody = document.getElementById('history-table-body');

    // Calculate total stats
    const totalOrders = orderHistory.length;
    const totalRevenue = orderHistory.reduce((sum, order) => sum + order.total, 0);
    const avgValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    totalRevenueEl.textContent = `$${totalRevenue.toLocaleString()}`;
    totalOrdersEl.textContent = `${totalOrders} 筆`;
    avgOrderValueEl.textContent = `$${avgValue.toLocaleString()}`;

    // Render History Table
    tableBody.innerHTML = '';

    if (orderHistory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#64748b;">目前尚未有訂單紀錄</td></tr>';
        return;
    }

    orderHistory.forEach(order => {
        const row = document.createElement('tr');

        // Generate items tags
        const itemsHtml = order.items.map(item =>
            `<span class="order-tag">${item.name} x ${item.qty}</span>`
        ).join('');

        row.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.time}</td>
            <td>${itemsHtml}</td>
            <td style="color:var(--primary);font-weight:700;">$${order.total.toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
}

function clearData() {
    if (confirm('確定要清除所有營業紀錄嗎？此動作無法復原。')) {
        orderHistory = [];
        localStorage.removeItem('teaPosHistory');
        updateDashboard();
    }
}
