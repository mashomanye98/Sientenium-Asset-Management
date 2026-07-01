// API Base URL
const API_BASE_URL = window.location.origin;

// Store all loans for filtering
let allLoans = [];

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

// Make API request with headers
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Include Authorization header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (parseError) {
            // Keep the plain text response when it is not JSON.
        }
        throw new Error(errorMessage || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// Fetch all loans
async function fetchAllLoans() {
    try {
        // Updated to use /api/loans for consistency with other modules
        const loans = await apiRequest('/api/loans');
        allLoans = loans;
        updateUI();
        return loans;
    } catch (error) {
        console.error('Error fetching loans:', error);
        showToast('Failed to load loans: ' + error.message, 'error');
        throw error; // Propagate error so loadData can handle it
    }
}


        // Approve loan. The backend checks availability and marks the asset as loaned.
        async function approveLoan(loanId, button) {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Processing...';

            try {
                // Updated to use /api/loans prefix
                await apiRequest('/api/loans/' + loanId + '/approve', {
                    method: 'PUT'
                });

                showToast('Loan approved! Asset checked out.', 'success');
                await fetchAllLoans();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed: ' + error.message, 'error');
                button.disabled = false;
                button.textContent = originalText;
            }
        }

        // Reject loan only. Rejection must not change asset availability.
        async function rejectLoan(loanId, button) {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = 'Processing...';

            try {
                // Updated to use /api/loans prefix
                await apiRequest('/api/loans/' + loanId + '/reject', {
                    method: 'PUT'
                });

                showToast('Loan rejected.', 'info');
                await fetchAllLoans();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed: ' + error.message, 'error');
                button.disabled = false;
                button.textContent = originalText;
            }
        }

// Get status badge HTML
function getStatusBadge(status) {
    const statusClasses = {
        'PENDING': 'status-pending',
        'APPROVED': 'status-approved',
        'REJECTED': 'status-rejected',
        'RETURNED': 'status-returned'
    };
    return `<span class="status ${statusClasses[status] || 'status-pending'}">${status}</span>`;
}

// Get action buttons HTML
function getActionButtons(loan) {
    if (loan.status === 'PENDING') {
        return `
            <div class="action-buttons">
                <button class="btn-approve" data-loan-id="${loan.loanId}">Approve</button>
                <button class="btn-reject" data-loan-id="${loan.loanId}">Reject</button>
            </div>
        `;
    } else {
        return `<span style="color: var(--muted); font-size: 0.75rem;">Processed</span>`;
    }
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

// Update user name
function updateUserInfo() {
    let currentUser = {};
    try {
        currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
    } catch (error) {
        currentUser = {};
    }

    const userName = currentUser.fullName || localStorage.getItem('userName') || 'System Administrator';
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
}

// Render loans table with filters
async function renderLoansTable() {
    const tbody = document.getElementById('loans-tbody');
    if (!tbody) return;

    const statusFilterEl = document.getElementById('status-filter');
    const searchInputEl = document.getElementById('search-input');

    const statusFilter = statusFilterEl ? statusFilterEl.value : 'ALL';
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';

    let filteredLoans = [...allLoans];

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

    // Sort by request date (newest first)
    filteredLoans.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

    if (filteredLoans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">No loans found</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    for (const loan of filteredLoans) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${loan.loanId}</td>
            <td><strong>${loan.assetName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.assetId}</span></td>
            <td>${loan.assetCategory || 'N/A'}</td>
            <td>${formatDate(loan.requestDate)}</td>
            <td>${formatDate(loan.dueDate)}</td>
            <td><strong>${loan.userName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.userId}</span></td>
            <td>${loan.userDepartment || 'N/A'}</td>
            <td>${getStatusBadge(loan.status)}</td>
            <td>${getActionButtons(loan)}</td>
        `;
        tbody.appendChild(row);
    }

    // Attach event listeners to buttons
    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', () => approveLoan(parseInt(btn.dataset.loanId), btn));
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => rejectLoan(parseInt(btn.dataset.loanId), btn));
    });
}

// Update stats
function updateStats() {
    const pending = allLoans.filter(l => l.status === 'PENDING').length;
    const approved = allLoans.filter(l => l.status === 'APPROVED').length;
    const rejected = allLoans.filter(l => l.status === 'REJECTED').length;
    const returned = allLoans.filter(l => l.status === 'RETURNED').length;

    const pendingEl = document.getElementById('stat-pending');
    const approvedEl = document.getElementById('stat-approved');
    const rejectedEl = document.getElementById('stat-rejected');
    const totalCountEl = document.getElementById('total-count');

    if (pendingEl) pendingEl.textContent = `${pending} Request${pending !== 1 ? 's' : ''}`;
    if (approvedEl) approvedEl.textContent = `${approved} Request${approved !== 1 ? 's' : ''}`;
    if (rejectedEl) rejectedEl.textContent = `${rejected} Request${rejected !== 1 ? 's' : ''}`;

    if (totalCountEl) totalCountEl.textContent = `Total: ${allLoans.length} requests`;
    
    const pendingCount = document.getElementById('pending-count');
    if (pendingCount) {
        pendingCount.textContent = pending;
    }

    // Update summary list
    const summaryList = document.getElementById('summary-list');
    if (summaryList) {
        summaryList.innerHTML = `
            <li><i class="fa-regular fa-clock"></i> Pending: ${pending} requests</li>
            <li><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Approved: ${approved}</li>
            <li><i class="fa-solid fa-times-circle" style="color: #ef4444;"></i> Rejected: ${rejected}</li>
            <li><i class="fa-solid fa-arrow-rotate-left" style="color: #4f46e5;"></i> Returned: ${returned}</li>
        `;
    }
}

// Update UI
async function updateUI() {
    await renderLoansTable();
    updateStats();
}

// Load data
async function loadData() {
    const tbody = document.getElementById('loans-tbody');
    tbody.innerHTML = '<tr class="loading"><td colspan="9">Loading loans data...</td></tr>';

    try {
        await fetchAllLoans();
    } catch (error) {
        console.error('Failed to load data:', error);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: red;">Failed to load loans. Please check if the backend server is running.</td></tr>';
    }
}

// Setup event listeners
function setupEventListeners() {
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('search-input');
    const refreshBtn = document.getElementById('refresh-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (statusFilter) statusFilter.addEventListener('change', renderLoansTable);
    if (searchInput) searchInput.addEventListener('input', renderLoansTable);
    if (refreshBtn) refreshBtn.addEventListener('click', loadData);

    // Sidebar usually handles logout, but we keep this as a fallback if the ID exists
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            window.location.href = '/logout';
        });
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
