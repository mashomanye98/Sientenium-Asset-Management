// Use the same host and port that served the page.
const API_BASE_URL = window.location.origin;

let awaitingCheckInLoans = [];

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

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

async function fetchAwaitingCheckInLoans() {
    try {
        const approvedLoans = await apiRequest('/loans/approved');
        awaitingCheckInLoans = approvedLoans.filter(loan =>
            String(loan.status || '').toUpperCase() === 'APPROVED' && !loan.returnDate
        );
        return awaitingCheckInLoans;
    } catch (error) {
        console.error('Error fetching assets awaiting check-in:', error);
        showToast('Failed to load assets awaiting check-in: ' + error.message, 'error');
        return [];
    }
}

async function checkInAsset(loanId, assetId) {
    if (!confirm('Are you sure you want to process this return?')) {
        return;
    }

    try {
        await apiRequest(`/loans/${loanId}/return`, {
            method: 'PUT'
        });

        const asset = await apiRequest(`/api/assets/${assetId}`);
        const requestData = {
            title: asset.title,
            category: asset.category,
            serialNumber: asset.serialNumber,
            acquisitionDate: asset.acquisitionDate,
            cost: asset.cost,
            location: asset.location,
            condition: asset.condition,
            photoPath: asset.photoPath,
            status: 'AVAILABLE'
        };

        await apiRequest(`/api/assets/${assetId}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        showToast('Asset checked in successfully.', 'success');
        await loadData();
    } catch (error) {
        console.error('Error checking in asset:', error);
        showToast('Failed to check in asset: ' + error.message, 'error');
    }
}

function renderAwaitingCheckInLoans() {
    const tbody = document.getElementById('checked-out-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

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
    document.getElementById('stat-checkedout').textContent = `${filtered.length} Loans`;
    document.getElementById('stat-overdue').textContent = `${overdueCount} Assets`;
    document.getElementById('overdue-count').textContent = overdueCount;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No assets awaiting check-in</td></tr>';
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
            <td><strong>${loan.assetName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">Loan ID: ${loan.loanId || 'N/A'}</span></td>
            <td>${loan.assetId || 'N/A'}</td>
            <td><strong>${loan.userName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.userId || 'N/A'}</span></td>
            <td>${loan.userDepartment || 'N/A'}</td>
            <td>${formatDate(loan.dueDate)} ${isOverdue ? `<span style="color: #dc2626; font-weight: 600;">(${daysOverdue}d overdue)</span>` : ''}</td>
            <td>
                <span class="status-badge ${isOverdue ? 'status-overdue' : 'status-active'}">
                    ${isOverdue ? 'Overdue' : 'Awaiting Check-In'}
                </span>
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
            checkInAsset(parseInt(btn.dataset.loanId), parseInt(btn.dataset.assetId));
        });
    });
}

async function loadData() {
    const tbody = document.getElementById('checked-out-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading assets awaiting check-in...</td></tr>';

    try {
        await fetchAwaitingCheckInLoans();
        renderAwaitingCheckInLoans();
    } catch (error) {
        console.error('Error loading data:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Failed to load assets awaiting check-in</td></tr>';
        showToast('Failed to load data: ' + error.message, 'error');
    }
}

function setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', loadData);
    document.getElementById('search-input').addEventListener('input', renderAwaitingCheckInLoans);

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../signIn.html';
    });
}

function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Johannes Motsemme';
    document.getElementById('user-name').textContent = userName;
}

function init() {
    updateUserInfo();
    setupEventListeners();
    loadData();
}

document.addEventListener('DOMContentLoaded', init);
