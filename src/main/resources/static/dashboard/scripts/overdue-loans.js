// API Base URL
const API_BASE_URL = 'http://localhost:8081';

// Store all overdue loans
let allOverdueLoans = [];

// Helper function to show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

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

// Fetch overdue loans
async function fetchOverdueLoans() {
    try {
        const loans = await apiRequest('/loans/overdue');
        allOverdueLoans = loans;
        updateUI();
        return loans;
    } catch (error) {
        console.error('Error fetching overdue loans:', error);
        showToast('Failed to load overdue loans: ' + error.message, 'error');
        return [];
    }
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

// Return loan
async function returnLoan(loanId) {
    if (!confirm('Are you sure you want to mark this loan as returned?')) {
        return;
    }

    try {
        await apiRequest(`/loans/${loanId}/return`, {
            method: 'PUT'
        });
        showToast(`Loan ${loanId} returned successfully!`, 'success');
        await fetchOverdueLoans();
    } catch (error) {
        console.error('Error returning loan:', error);
        showToast('Failed to return loan: ' + error.message, 'error');
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    const statusClasses = {
        'APPROVED': 'status-approved',
        'RETURNED': 'status-returned'
    };
    return `<span class="status ${statusClasses[status] || 'status-approved'}">${status}</span>`;
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

// Render overdue loans table
async function renderOverdueTable() {
    const tbody = document.getElementById('overdue-tbody');
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    let filteredLoans = [...allOverdueLoans];

    // Apply status filter
    if (statusFilter !== 'ALL') {
        filteredLoans = filteredLoans.filter(loan => loan.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
        filteredLoans = filteredLoans.filter(loan =>
            loan.userName?.toLowerCase().includes(searchTerm) ||
            loan.assetName?.toLowerCase().includes(searchTerm) ||
            loan.loanId.toString().includes(searchTerm)
        );
    }

    // Sort by days overdue (most overdue first)
    filteredLoans.sort((a, b) => {
        const daysA = calculateDaysOverdue(a.dueDate);
        const daysB = calculateDaysOverdue(b.dueDate);
        return daysB - daysA;
    });

    if (filteredLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No overdue loans found 🎉</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    for (const loan of filteredLoans) {
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        const row = document.createElement('tr');
        if (daysOverdue > 30) {
            row.className = 'overdue-row';
        }

        row.innerHTML = `
            <td>${loan.loanId}</td>
            <td><strong>${loan.assetName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.assetId}</span></td>
            <td><strong>${loan.userName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.userId}</span></td>
            <td>${loan.userDepartment || 'N/A'}</td>
            <td>${formatDate(loan.dueDate)}</td>
            <td><span class="days-overdue-badge">${daysOverdue} days</span></td>
            <td>${getStatusBadge(loan.status)}</td>
            <td>
                <div class="action-buttons">
                    ${loan.status === 'APPROVED' ?
                        `<button class="btn-return" data-loan-id="${loan.loanId}">Process Return</button>` :
                        `<span style="color: var(--muted); font-size: 0.75rem;">Already returned</span>`
                    }
                    <button class="btn-email" data-user-id="${loan.userId}" data-user-name="${loan.userName}">
                        <i class="fa-regular fa-envelope"></i> Email
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    }

    // Attach event listeners
    document.querySelectorAll('.btn-return').forEach(btn => {
        btn.addEventListener('click', () => returnLoan(parseInt(btn.dataset.loanId)));
    });

    document.querySelectorAll('.btn-email').forEach(btn => {
        btn.addEventListener('click', () => {
            const userName = btn.dataset.userName || 'Borrower';
            showToast(`Reminder email sent to ${userName}`, 'info');
        });
    });
}

// Update stats
function updateStats() {
    const total = allOverdueLoans.length;
    const active = allOverdueLoans.filter(l => l.status === 'APPROVED').length;
    const returned = allOverdueLoans.filter(l => l.status === 'RETURNED').length;

    document.getElementById('stat-total-overdue').textContent = total;
    document.getElementById('stat-active-overdue').textContent = active;
    document.getElementById('stat-returned-overdue').textContent = returned;

    document.getElementById('total-count').textContent = `Total: ${total} overdue loans`;
    document.getElementById('overdue-count').textContent = total;

    // Update summary
    document.getElementById('summary-overdue-count').textContent = `${active} assets need attention`;

    // Find most overdue
    if (allOverdueLoans.length > 0) {
        const mostOverdue = allOverdueLoans.reduce((max, loan) => {
            const days = calculateDaysOverdue(loan.dueDate);
            return days > calculateDaysOverdue(max.dueDate) ? loan : max;
        }, allOverdueLoans[0]);
        const days = calculateDaysOverdue(mostOverdue.dueDate);
        document.getElementById('summary-most-overdue').textContent =
            `${mostOverdue.assetName || 'Asset'} overdue by ${days} days`;
    }
}

// Update UI
async function updateUI() {
    await renderOverdueTable();
    updateStats();
}

// Load data
async function loadData() {
    const tbody = document.getElementById('overdue-tbody');
    tbody.innerHTML = '<tr class="loading"><td colspan="8">Loading overdue loans data...</td></tr>';

    try {
        await fetchOverdueLoans();
    } catch (error) {
        console.error('Failed to load data:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: red;">Failed to load overdue loans. Please check if the backend server is running.</td></tr>';
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('status-filter').addEventListener('change', renderOverdueTable);
    document.getElementById('search-input').addEventListener('input', renderOverdueTable);
    document.getElementById('refresh-btn').addEventListener('click', loadData);

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../signIn.html';
    });

    // Quick actions
    document.getElementById('send-reminders').addEventListener('click', () => {
        const activeCount = allOverdueLoans.filter(l => l.status === 'APPROVED').length;
        if (activeCount === 0) {
            showToast('No active overdue loans to remind', 'info');
            return;
        }
        showToast(`Sending reminders to ${activeCount} borrowers...`, 'info');
    });

    document.getElementById('export-overdue').addEventListener('click', () => {
        if (allOverdueLoans.length === 0) {
            showToast('No overdue loans to export', 'info');
            return;
        }
        let csv = 'Loan ID,Asset,Borrower,Due Date,Days Overdue,Status\n';
        allOverdueLoans.forEach(loan => {
            const days = calculateDaysOverdue(loan.dueDate);
            csv += `${loan.loanId},${loan.assetName || 'N/A'},${loan.userName || 'N/A'},${formatDate(loan.dueDate)},${days},${loan.status}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `overdue-loans-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        showToast('Export successful!', 'success');
    });
}

// Update user name
function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Manager';
    const nameEl = document.getElementById('user-name') || document.getElementById('profileName');
    if (nameEl) {
        nameEl.textContent = userName;
    }
}

// Initialize
function init() {
    updateUserInfo();
    setupEventListeners();
    loadData();
}

// Run initialization
document.addEventListener('DOMContentLoaded', init);