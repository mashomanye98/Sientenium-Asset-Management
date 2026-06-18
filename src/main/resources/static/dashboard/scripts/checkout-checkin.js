// API Base URL
const API_BASE_URL = 'http://localhost:8080';

// Store data
let availableAssets = [];
let checkedOutLoans = [];
let allUsers = [];

// Helper function to show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
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

// Calculate days overdue
function calculateDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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

// Fetch available assets
async function fetchAvailableAssets() {
    try {
        // First get all assets, then filter for AVAILABLE status
        const allAssets = await apiRequest('/api/assets');
        availableAssets = allAssets.filter(asset => asset.status === 'AVAILABLE');
        return availableAssets;
    } catch (error) {
        console.error('Error fetching available assets:', error);
        showToast('Failed to load available assets: ' + error.message, 'error');
        return [];
    }
}

// Fetch checked out loans with asset and user details
async function fetchCheckedOutLoans() {
    try {
        // Get all loans that are APPROVED and not returned
        const allLoans = await apiRequest('/loans');
        checkedOutLoans = allLoans.filter(loan =>
            loan.status === 'APPROVED' && !loan.returnDate
        );
        return checkedOutLoans;
    } catch (error) {
        console.error('Error fetching checked out loans:', error);
        showToast('Failed to load checked out loans: ' + error.message, 'error');
        return [];
    }
}

// Fetch all users for the checkout form
async function fetchUsers() {
    try {
        allUsers = await apiRequest('/api/auth/users');
        return allUsers;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Check out an asset
async function checkOutAsset(assetId, userId, dueDate) {
    try {
        // Step 1: Get the asset
        var asset = null;
        for (var i = 0; i < availableAssets.length; i++) {
            if (availableAssets[i].assetId === assetId) {
                asset = availableAssets[i];
                break;
            }
        }
        if (!asset) {
            throw new Error('Asset not found');
        }

        // Step 2: Create a PENDING loan record (not APPROVED)
        var loanData = {
            assetId: assetId,
            userId: userId,
            requestDate: new Date().toISOString(),
            status: 'PENDING',  // 🔥 Changed from APPROVED to PENDING
            checkoutDate: null, // 🔥 Not set until approved
            dueDate: new Date(dueDate).toISOString()
        };

        var createdLoan = await apiRequest('/loans', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });

        // 🔥 DO NOT change asset status yet - wait for approval

        showToast('Loan request created for "' + asset.title + '". Awaiting approval.', 'success');
        await loadData();
        return createdLoan;
    } catch (error) {
        console.error('Error checking out asset:', error);
        showToast('Failed to create loan request: ' + error.message, 'error');
        throw error;
    }
}

// Check in an asset
async function checkInAsset(loanId, assetId) {
    if (!confirm('Are you sure you want to process this return?')) {
        return;
    }

    try {
        // Step 1: Return the loan
        await apiRequest(`/loans/${loanId}/return`, {
            method: 'PUT'
        });

        // Step 2: Get the asset
        const asset = await apiRequest(`/api/assets/${assetId}`);

        // Step 3: Update asset status back to AVAILABLE
        const requestData = {
            title: asset.title,
            category: asset.category,
            serialNumber: asset.serialNumber,
            acquisitionDate: asset.acquisitionDate,
            cost: asset.cost,
            location: asset.location,
            condition: asset.condition,
            photoPath: asset.photoPath,
            status: 'AVAILABLE'  // 🔥 Set status back to AVAILABLE
        };

        await apiRequest(`/api/assets/${assetId}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        showToast('Asset returned successfully!', 'success');
        await loadData();
    } catch (error) {
        console.error('Error checking in asset:', error);
        showToast('Failed to check in asset: ' + error.message, 'error');
    }
}
// Render available assets table
function renderAvailableAssets() {
    const tbody = document.getElementById('available-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    let filtered = availableAssets;
    if (searchTerm) {
        filtered = filtered.filter(asset =>
            asset.title?.toLowerCase().includes(searchTerm) ||
            asset.serialNumber?.toLowerCase().includes(searchTerm) ||
            asset.location?.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No available assets found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    for (const asset of filtered) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${asset.title || 'N/A'}</strong></td>
            <td>${asset.serialNumber || 'N/A'}</td>
            <td>${asset.category || 'N/A'}</td>
            <td>${asset.condition || 'N/A'}</td>
            <td>${asset.location || 'N/A'}</td>
            <td>
                <button class="btn-checkout" data-asset-id="${asset.assetId}" data-asset-title="${asset.title}">
                    Check Out
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }

    // Attach event listeners to check-out buttons
    document.querySelectorAll('.btn-checkout').forEach(btn => {
        btn.addEventListener('click', () => {
            const assetId = parseInt(btn.dataset.assetId);
            const assetTitle = btn.dataset.assetTitle;
            // Pre-fill the checkout form
            document.getElementById('checkout-asset').value = assetId;
            document.getElementById('checkout-asset').dispatchEvent(new Event('change'));
            // Scroll to the form
            document.getElementById('checkout-form').scrollIntoView({ behavior: 'smooth' });
            showToast(`Selected "${assetTitle}" for check out`, 'info');
        });
    });

    // Update stats
    document.getElementById('stat-available').textContent = `${filtered.length} Assets`;
}

// Render checked out loans table
function renderCheckedOutLoans() {
    const tbody = document.getElementById('checked-out-tbody');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    let filtered = checkedOutLoans;
    if (searchTerm) {
        filtered = filtered.filter(loan =>
            loan.assetName?.toLowerCase().includes(searchTerm) ||
            loan.userName?.toLowerCase().includes(searchTerm)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No assets currently checked out</td></tr>';
        return;
    }

    // Sort: Overdue first
    filtered.sort((a, b) => {
        const daysA = calculateDaysOverdue(a.dueDate);
        const daysB = calculateDaysOverdue(b.dueDate);
        return daysB - daysA;
    });

    tbody.innerHTML = '';
    let overdueCount = 0;

    for (const loan of filtered) {
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        const isOverdue = daysOverdue > 0;
        if (isOverdue) overdueCount++;

        const row = document.createElement('tr');
        if (isOverdue) {
            row.className = 'warning-row';
        }

        row.innerHTML = `
            <td><strong>${loan.assetName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.assetId}</span></td>
            <td>${loan.assetId || 'N/A'}</td>
            <td><strong>${loan.userName || 'N/A'}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">ID: ${loan.userId}</span></td>
            <td>${loan.userDepartment || 'N/A'}</td>
            <td>${formatDate(loan.dueDate)} ${isOverdue ? `<span style="color: #dc2626; font-weight: 600;">(${daysOverdue}d overdue)</span>` : ''}</td>
            <td>
                <span class="status-badge ${isOverdue ? 'status-overdue' : 'status-active'}">
                    ${isOverdue ? 'Overdue' : 'Active'}
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

    // Attach event listeners to check-in buttons
    document.querySelectorAll('.btn-checkin').forEach(btn => {
        btn.addEventListener('click', () => {
            const loanId = parseInt(btn.dataset.loanId);
            const assetId = parseInt(btn.dataset.assetId);
            checkInAsset(loanId, assetId);
        });
    });

    // Update stats
    document.getElementById('stat-checkedout').textContent = `${filtered.length} Loans`;
    document.getElementById('stat-overdue').textContent = `${overdueCount} Assets`;
    document.getElementById('overdue-count').textContent = overdueCount;
}

// Populate checkout form dropdown
function populateCheckoutForm() {
    const select = document.getElementById('checkout-asset');
    const currentValue = select.value;

    select.innerHTML = '<option value="">-- Select an asset --</option>';

    for (const asset of availableAssets) {
        const option = document.createElement('option');
        option.value = asset.assetId;
        option.textContent = `${asset.title} (${asset.serialNumber || 'No SN'})`;
        select.appendChild(option);
    }

    if (currentValue) {
        select.value = currentValue;
    }
}

// Handle checkout form submission
async function handleCheckoutSubmit(event) {
    event.preventDefault();

    const assetId = parseInt(document.getElementById('checkout-asset').value);
    const userId = parseInt(document.getElementById('checkout-user').value);
    const dueDate = document.getElementById('checkout-due-date').value;
    const submitBtn = document.getElementById('checkout-submit-btn');
    const messageDiv = document.getElementById('checkout-form-message');

    // Validation
    if (!assetId) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Please select an asset.</span>';
        return;
    }
    if (!userId || userId < 1) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Please enter a valid user ID.</span>';
        return;
    }
    if (!dueDate) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Please select a due date.</span>';
        return;
    }

    // Check if due date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (due < today) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Due date cannot be in the past.</span>';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    messageDiv.innerHTML = '';

    try {
        await checkOutAsset(assetId, userId, dueDate);
        messageDiv.innerHTML = '<span style="color: #10b981;">✓ Check out successful!</span>';
        document.getElementById('checkout-form').reset();
        populateCheckoutForm();
    } catch (error) {
        messageDiv.innerHTML = `<span style="color: #dc2626;">✗ ${error.message}</span>`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Check Out';
    }
}

// Set default due date (7 days from now)
function setDefaultDueDate() {
    const input = document.getElementById('checkout-due-date');
    const date = new Date();
    date.setDate(date.getDate() + 7);
    input.value = date.toISOString().split('T')[0];
}

// Load all data
async function loadData() {
    try {
        await Promise.all([
            fetchAvailableAssets(),
            fetchCheckedOutLoans(),
            fetchUsers()
        ]);
        renderAvailableAssets();
        renderCheckedOutLoans();
        populateCheckoutForm();
        setDefaultDueDate();
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data: ' + error.message, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', loadData);
    document.getElementById('search-input').addEventListener('input', () => {
        renderAvailableAssets();
        renderCheckedOutLoans();
    });
    document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../signIn.html';
    });

    // Clear message when form changes
    document.getElementById('checkout-asset').addEventListener('change', () => {
        document.getElementById('checkout-form-message').innerHTML = '';
    });
    document.getElementById('checkout-user').addEventListener('input', () => {
        document.getElementById('checkout-form-message').innerHTML = '';
    });
    document.getElementById('checkout-due-date').addEventListener('change', () => {
        document.getElementById('checkout-form-message').innerHTML = '';
    });
}

// Update user name
function updateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Johannes Motsemme';
    document.getElementById('user-name').textContent = userName;
}

// Initialize
function init() {
    updateUserInfo();
    setupEventListeners();
    loadData();
}

// Run initialization
document.addEventListener('DOMContentLoaded', init);