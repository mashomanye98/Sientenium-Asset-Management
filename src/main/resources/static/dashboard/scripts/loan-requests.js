// API Base URL
const API_BASE_URL = 'http://localhost:8081';

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

// Fetch all loans
async function fetchAllLoans() {
    try {
        const loans = await apiRequest('/loans');
        allLoans = loans;
        updateUI();
        return loans;
    } catch (error) {
        console.error('Error fetching loans:', error);
        showToast('Failed to load loans: ' + error.message, 'error');
        return [];
    }
}


        // Approve loan - Sets asset to LOANED
        async function approveLoan(loanId) {
            try {
                var loan = null;
                for (var i = 0; i < allLoans.length; i++) {
                    if (allLoans[i].loanId === loanId) {
                        loan = allLoans[i];
                        break;
                    }
                }
                if (!loan) {
                    throw new Error('Loan not found');
                }

                // Approve
                await apiRequest('/loans/' + loanId + '/approve', {
                    method: 'PUT'
                });

                // Set asset to LOANED
                var asset = await apiRequest('/api/assets/' + loan.assetId);
                if (asset) {
                    var requestData = {
                        title: asset.title,
                        category: asset.category,
                        serialNumber: asset.serialNumber,
                        acquisitionDate: asset.acquisitionDate,
                        cost: asset.cost,
                        location: asset.location,
                        condition: asset.condition,
                        photoPath: asset.photoPath,
                        status: 'LOANED'
                    };
                    await apiRequest('/api/assets/' + loan.assetId, {
                        method: 'PUT',
                        body: JSON.stringify(requestData)
                    });
                }

                showToast('Loan approved! Asset checked out.', 'success');
                await fetchAllLoans();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed: ' + error.message, 'error');
            }
        }

        // Reject loan - Restores asset to AVAILABLE (if needed)
        async function rejectLoan(loanId) {
            try {
                var loan = null;
                for (var i = 0; i < allLoans.length; i++) {
                    if (allLoans[i].loanId === loanId) {
                        loan = allLoans[i];
                        break;
                    }
                }
                if (!loan) {
                    throw new Error('Loan not found');
                }

                await apiRequest('/loans/' + loanId + '/reject', {
                    method: 'PUT'
                });

                // If asset is LOANED, restore to AVAILABLE
                var asset = await apiRequest('/api/assets/' + loan.assetId);
                if (asset && asset.status === 'LOANED') {
                    var requestData = {
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
                    await apiRequest('/api/assets/' + loan.assetId, {
                        method: 'PUT',
                        body: JSON.stringify(requestData)
                    });
                }

                showToast('Loan rejected.', 'info');
                await fetchAllLoans();
            } catch (error) {
                console.error('Error:', error);
                showToast('Failed: ' + error.message, 'error');
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
    const userName = localStorage.getItem('userName') || 'System Administrator';
    document.getElementById('user-name').textContent = userName;
}

// Render loans table with filters
async function renderLoansTable() {
    const tbody = document.getElementById('loans-tbody');
    const statusFilter = document.getElementById('status-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

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
        btn.addEventListener('click', () => approveLoan(parseInt(btn.dataset.loanId)));
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', () => rejectLoan(parseInt(btn.dataset.loanId)));
    });
}

// Update stats
function updateStats() {
    const pending = allLoans.filter(l => l.status === 'PENDING').length;
    const approved = allLoans.filter(l => l.status === 'APPROVED').length;
    const rejected = allLoans.filter(l => l.status === 'REJECTED').length;
    const returned = allLoans.filter(l => l.status === 'RETURNED').length;

    document.getElementById('stat-pending').textContent = `${pending} Request${pending !== 1 ? 's' : ''}`;
    document.getElementById('stat-approved').textContent = `${approved} Request${approved !== 1 ? 's' : ''}`;
    document.getElementById('stat-rejected').textContent = `${rejected} Request${rejected !== 1 ? 's' : ''}`;

    document.getElementById('total-count').textContent = `Total: ${allLoans.length} requests`;
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
    document.getElementById('status-filter').addEventListener('change', renderLoansTable);
    document.getElementById('search-input').addEventListener('input', renderLoansTable);
    document.getElementById('refresh-btn').addEventListener('click', loadData);
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../../signIn.html';
    });
}

// Initialize
function init() {
    updateUserInfo();
    setupEventListeners();
    loadData();
}

// Run initialization
document.addEventListener('DOMContentLoaded', init);
