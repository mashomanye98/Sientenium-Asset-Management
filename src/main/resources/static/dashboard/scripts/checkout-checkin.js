// ============================================
// CHECKOUT-CHECKIN.JS - Manager Check-In Page
// ============================================

// CONFIGURATION
const API_BASE_URL = window.location.origin;

// STATE MANAGEMENT
let awaitingCheckInLoans = [];

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// ============================================
// AUTHENTICATION
// ============================================

function getAuthToken() {
    return localStorage.getItem('authToken');
}

// ============================================
// API REQUEST
// ============================================

async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = getAuthToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
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

    return response.json();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchAwaitingCheckInLoans() {
    try {
        const loans = await apiRequest('/loans');
        const returnedLoans = loans.filter(loan =>
            String(loan.status || '').toUpperCase() === 'RETURNED' || loan.returnDate
        );
        const loansWithAssets = await Promise.all(returnedLoans.map(async loan => {
            try {
                const asset = await apiRequest(`/api/assets/${loan.assetId}`);
                return { ...loan, asset };
            } catch (error) {
                console.warn(`Could not load asset ${loan.assetId} for check-in`, error);
                return { ...loan, asset: null };
            }
        }));

        awaitingCheckInLoans = loansWithAssets.filter(loan =>
            String(loan.asset?.status || '').toUpperCase() === 'LOANED'
        );
        return awaitingCheckInLoans;
    } catch (error) {
        console.error('Error fetching assets awaiting check-in:', error);
        showToast('Failed to load assets awaiting check-in: ' + error.message, 'error');
        return [];
    }
}

// ============================================
// CHECK-IN OPERATION
// ============================================

async function checkInAsset(loanId, assetId, condition) {
    if (!condition) {
        showToast('Select the returned asset condition before check-in.', 'error');
        return;
    }

    if (!confirm('Are you sure you want to process this return?')) {
        return;
    }

    try {
        const asset = await apiRequest(`/api/assets/${assetId}`);
        const requestData = {
            title: asset.title,
            category: asset.category,
            serialNumber: asset.serialNumber,
            acquisitionDate: asset.acquisitionDate,
            cost: asset.cost,
            location: asset.location,
            condition: condition,
            photoPath: asset.photoPath,
            status: 'AVAILABLE'
        };

        await apiRequest(`/api/assets/${assetId}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        const retirementMessage = ['POOR', 'DAMAGED'].includes(condition)
            ? ' Asset is now eligible for retirement.'
            : '';
        showToast(`Asset checked in successfully.${retirementMessage}`, 'success');
        await loadData();
    } catch (error) {
        console.error('Error checking in asset:', error);
        showToast('Failed to check in asset: ' + error.message, 'error');
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderAwaitingCheckInLoans() {
    const tbody = document.getElementById('checked-out-tbody');
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput?.value?.toLowerCase() || '';

    const statCheckedOut = document.getElementById('stat-checkedout');
    const statOverdue = document.getElementById('stat-overdue');
    const overdueCountEl = document.getElementById('overdue-count');

    if (!tbody) {
        console.warn('Element "checked-out-tbody" not found');
        return;
    }

    let filtered = [...awaitingCheckInLoans];
    if (searchTerm) {
        filtered = filtered.filter(loan =>
            loan.assetName?.toLowerCase().includes(searchTerm) ||
            loan.userName?.toLowerCase().includes(searchTerm) ||
            String(loan.assetId || '').includes(searchTerm) ||
            String(loan.loanId || '').includes(searchTerm)
        );
    }

    filtered.sort((a, b) => calculateDaysOverdue(b.dueDate) - calculateDaysOverdue(a.dueDate));

    const overdueCount = filtered.filter(loan => calculateDaysOverdue(loan.dueDate) > 0).length;

    if (statCheckedOut) {
        statCheckedOut.textContent = `${filtered.length} Loans`;
    }
    if (statOverdue) {
        statOverdue.textContent = `${overdueCount} Assets`;
    }
    if (overdueCountEl) {
        overdueCountEl.textContent = overdueCount;
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No returned assets awaiting check-in</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    for (const loan of filtered) {
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        const isOverdue = daysOverdue > 0;
        const row = document.createElement('tr');

        if (isOverdue) {
            row.className = 'warning-row';
        }

        row.innerHTML = `
            <td>
                <strong>${loan.assetName || 'N/A'}</strong>
                <br>
                <span style="font-size: 0.75rem; color: var(--muted);">Loan ID: ${loan.loanId || 'N/A'}</span>
            </td>
            <td>${loan.assetId || 'N/A'}</td>
            <td>
                <strong>${loan.userName || 'N/A'}</strong>
                <br>
                <span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.userId || 'N/A'}</span>
            </td>
            <td>${loan.userDepartment || 'N/A'}</td>
            <td>
                ${formatDate(loan.dueDate)}
                ${isOverdue ? `<span style="color: #dc2626; font-weight: 600;">(${daysOverdue}d overdue)</span>` : ''}
            </td>
            <td>
                <span class="status-badge status-active">
                    Returned
                </span>
            </td>
            <td>
                <select class="condition-select" data-loan-id="${loan.loanId}">
                    <option value="NEW" ${loan.asset?.condition === 'NEW' ? 'selected' : ''}>NEW</option>
                    <option value="GOOD" ${!loan.asset?.condition || loan.asset?.condition === 'GOOD' ? 'selected' : ''}>GOOD</option>
                    <option value="FAIR" ${loan.asset?.condition === 'FAIR' ? 'selected' : ''}>FAIR</option>
                    <option value="POOR" ${loan.asset?.condition === 'POOR' ? 'selected' : ''}>POOR</option>
                    <option value="DAMAGED" ${loan.asset?.condition === 'DAMAGED' ? 'selected' : ''}>DAMAGED</option>
                </select>
            </td>
            <td>
                <button class="btn-checkin" data-loan-id="${loan.loanId}" data-asset-id="${loan.assetId}">
                    Check In
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }

    document.querySelectorAll('.btn-checkin').forEach(btn => {
        btn.addEventListener('click', () => {
            const loanId = parseInt(btn.dataset.loanId);
            const assetId = parseInt(btn.dataset.assetId);
            const conditionSelect = document.querySelector(`.condition-select[data-loan-id="${loanId}"]`);
            const condition = conditionSelect?.value;
            if (conditionSelect) {
                checkInAsset(loanId, assetId, condition);
            } else {
                showToast('Please select a condition for the returned asset.', 'error');
            }
        });
    });
}

// ============================================
// DATA LOADING
// ============================================

async function loadData() {
    const tbody = document.getElementById('checked-out-tbody');

    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading assets awaiting check-in...</td></tr>';
    }

    try {
        await fetchAwaitingCheckInLoans();
        renderAwaitingCheckInLoans();
    } catch (error) {
        console.error('Error loading data:', error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Failed to load assets awaiting check-in</td></tr>';
        }
        showToast('Failed to load data: ' + error.message, 'error');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const logoutBtn = document.getElementById('logout-btn');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadData);
    }
    if (searchInput) {
        searchInput.addEventListener('input', renderAwaitingCheckInLoans);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            window.location.href = '../signIn.html';
        });
    }
}

// ============================================
// USER PROFILE
// ============================================

function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Johannes Motsemme';
    const nameEl = document.getElementById('user-name');
    if (nameEl) {
        nameEl.textContent = userName;
    }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    updateUserInfo();
    setupEventListeners();
    loadData();
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', init);