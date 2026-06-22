// ============================================
// SHARED DASHBOARD UTILITIES
// ============================================

// API Base URL
const API_BASE = window.location.origin;

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Make API request with headers
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Format currency
function formatCurrency(value) {
    if (!value) return 'R 0.00';
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2
    }).format(value);
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Calculate days overdue
function calculateDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

// Get status badge class
function getStatusClass(status) {
    const map = {
        'PENDING': 'proposal',
        'APPROVED': 'application',
        'RETURNED': 'application',
        'REJECTED': 'danger',
        'AVAILABLE': 'application',
        'LOANED': 'proposal',
        'RETIRED': 'danger'
    };
    return map[status] || 'proposal';
}

// Get current user
function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem('currentUser')) || {};
    } catch (e) {
        return {};
    }
}

// Update user profile name
function updateProfileName() {
    try {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user && user.fullName) {
            const nameEl = document.querySelector('.profile h3');
            if (nameEl) nameEl.textContent = user.fullName;
        }
    } catch (e) {
        // User not logged in
    }
}