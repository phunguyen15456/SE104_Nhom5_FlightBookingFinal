// frontend/js/api.js - Shared API helper
const API_BASE = '/api';

// ── Token management ──────────────────────────────────────────
const Auth = {
    getToken:  () => localStorage.getItem('token'),
    getUser:   () => JSON.parse(localStorage.getItem('user') || 'null'),
    setAuth(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
    clear()    { localStorage.removeItem('token'); localStorage.removeItem('user'); },
    isLoggedIn:() => !!localStorage.getItem('token'),
    hasRole:   (...roles) => { const u = Auth.getUser(); return u && roles.includes(u.vaiTro); }
};

// ── HTTP helper ───────────────────────────────────────────────
async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    try {
        const res = await fetch(API_BASE + path, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
        return data;
    } catch (err) {
        if (err.message.includes('401') || err.message.includes('xác thực')) {
            Auth.clear(); window.location.href = '/pages/login.html'; return;
        }
        throw err;
    }
}

const api = {
    get:    (path)       => request('GET',    path),
    post:   (path, body) => request('POST',   path, body),
    put:    (path, body) => request('PUT',    path, body),
    delete: (path)       => request('DELETE', path),

    // Auth
    login:    (b) => api.post('/auth/login',    b),
    register: (b) => api.post('/auth/register', b),
    logout:   ()  => api.post('/auth/logout'),
    profile:  ()  => api.get('/auth/profile'),
    changePassword: (b) => api.put('/auth/password', b),

    // Flights
    searchFlights: (q) => api.get('/flights?' + new URLSearchParams(q).toString()),
    getFlightDetail:(id)=> api.get(`/flights/${id}`),
    createFlight:   (b) => api.post('/flights', b),
    updateFlight:   (id,b)=> api.put(`/flights/${id}`, b),
    deleteFlight:   (id)=> api.delete(`/flights/${id}`),

    // Airports
    getAirports:  ()    => api.get('/airports'),
    addAirport:   (b)   => api.post('/airports', b),
    updateAirport:(id,b)=> api.put(`/airports/${id}`, b),
    deleteAirport:(id)  => api.delete(`/airports/${id}`),

    // Bookings
    datCho:   (b)  => api.post('/bookings', b),
    xuatVe:   (id) => api.post(`/bookings/${id}/ticket`),
    huyDat:   (id) => api.delete(`/bookings/${id}`),
    xoaPhieu: (id) => api.delete(`/bookings/${id}/delete`),
    myBookings:()  => api.get('/bookings/my'),
    allBookings:() => api.get('/bookings'),

    // Reports
    revenueMonthly:(nam)=> api.get(`/reports/revenue/monthly?nam=${nam}`),
    revenueYearly: () => api.get('/reports/revenue/yearly'),
    revenueFlights:(nam,thang)=> api.get(`/reports/revenue/flights?nam=${nam}&thang=${thang}`),

    // ThamSo
    getThamSo: ()      => api.get('/thamso'),
    updateThamSo:(id,b)=> api.put(`/thamso/${id}`, b),
    getThamSoLogs:()   => api.get('/thamso/logs'),

    // HangVe
    getHangVe:  ()     => api.get('/hangve'),
    addHangVe:  (b)    => api.post('/hangve', b),
    updateHangVe:(id,b)=> api.put(`/hangve/${id}`, b),
    deleteHangVe:(id)  => api.delete(`/hangve/${id}`),

    // Admin
    getAllAccounts:  ()     => api.get('/admin/accounts'),
    createStaff:    (b)    => api.post('/admin/accounts/staff', b),
    updateRole:     (id,b) => api.put(`/admin/accounts/${id}/role`, b),
    deactivateAccount:(id) => api.delete(`/admin/accounts/${id}`),
};

// ── Toast notifications ───────────────────────────────────────
function toast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(60px)'; setTimeout(() => el.remove(), 300); }, duration);
}

// ── Format helpers ────────────────────────────────────────────
function formatCurrency(n) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}
function formatDate(d) {
    return new Date(d).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function formatMinutes(m) {
    const h = Math.floor(m / 60), min = m % 60;
    return h > 0 ? `${h}g${min > 0 ? min + 'p' : ''}` : `${min}p`;
}

// ── Navbar renderer ───────────────────────────────────────────
function renderNavbar(activePage = '') {
    const user = Auth.getUser();
    const navEl = document.getElementById('navbar');
    if (!navEl) return;

    const links = [
        { href: '/index.html',          label: 'Trang Chủ', id: 'home' },
        { href: '/pages/flights.html',  label: 'Chuyến Bay', id: 'flights' },
    ];
    if (user && user.vaiTro === 'customer') {
        links.push({ href: '/pages/my-bookings.html', label: 'Vé Của Tôi', id: 'mybookings' });
    }
    if (user && (user.vaiTro === 'manager' || user.vaiTro === 'admin')) {
        links.push({ href: '/pages/manager.html', label: 'Quản Lý', id: 'manager' });
    }
    if (user && user.vaiTro === 'admin') {
        links.push({ href: '/pages/admin.html', label: 'Admin', id: 'admin' });
    }

    const linksHtml = links.map(l =>
        `<a href="${l.href}" class="${activePage === l.id ? 'active' : ''}">${l.label}</a>`
    ).join('');

    const userHtml = user
        ? `<span class="badge-role">${user.vaiTro.toUpperCase()}</span>
           <span class="text-sm">${user.tenHanhKhach || user.tenDangNhap}</span>
           <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Đăng Xuất</button>`
        : `<a href="/pages/login.html" class="btn btn-secondary btn-sm">Đăng Nhập</a>
           <a href="/pages/register.html" class="btn btn-primary btn-sm">Đăng Ký</a>`;

    navEl.innerHTML = `
        <div class="navbar-brand"><span class="icon"></span> FlightBooking</div>
        <nav class="navbar-links">${linksHtml}</nav>
        <div class="navbar-user">${userHtml}</div>`;
}

async function handleLogout() {
    try { await api.logout(); } catch {}
    Auth.clear();
    toast('Đã đăng xuất.', 'info');
    setTimeout(() => window.location.href = '/index.html', 800);
}

// Guard: redirect nếu chưa đăng nhập / sai role
function requireAuth(...roles) {
    if (!Auth.isLoggedIn()) { window.location.href = '/pages/login.html'; return false; }
    if (roles.length && !Auth.hasRole(...roles)) {
        toast('Bạn không có quyền truy cập trang này.', 'error');
        setTimeout(() => window.location.href = '/index.html', 1200);
        return false;
    }
    return true;
}
