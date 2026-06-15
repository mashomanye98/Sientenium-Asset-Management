  // API Base URL - change this to your actual backend URL
    const API_BASE_URL = 'http://localhost:8080';

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

    // Approve loan
    async function approveLoan(loanId) {
        try {
            const updatedLoan = await apiRequest(`/loans/${loanId}/approve`, {
                method: 'PUT'
            });
            showToast(`Loan ${loanId} approved successfully!`, 'success');
            await fetchAllLoans(); // Refresh the list
            return updatedLoan;
        } catch (error) {
            console.error('Error approving loan:', error);
            showToast('Failed to approve loan: ' + error.message, 'error');
            throw error;
        }
    }

    // Reject loan
    async function rejectLoan(loanId) {
        try {
            const updatedLoan = await apiRequest(`/loans/${loanId}/reject`, {
                method: 'PUT'
            });
            showToast(`Loan ${loanId} rejected`, 'info');
            await fetchAllLoans(); // Refresh the list
            return updatedLoan;
        } catch (error) {
            console.error('Error rejecting loan:', error);
            showToast('Failed to reject loan: ' + error.message, 'error');
            throw error;
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
                    <button class="btn-approve" data-loan-id="${loan.loanId}" data-action="approve">Approve</button>
                    <button class="btn-reject" data-loan-id="${loan.loanId}" data-action="reject">Reject</button>
                </div>
            `;
        } else if (loan.status === 'APPROVED') {
            return `<span style="color: var(--muted); font-size: 0.75rem;">Waiting for return</span>`;
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

    // Get department from user ID (mock - replace with actual API call if you have user details endpoint)
    async function getDepartmentName(userId) {
        // You can implement fetching user details from /users/{userId}
        // For now, return a placeholder
        return 'Department ' + (userId % 5 + 1);
    }

    // Get asset category from asset ID (mock - replace with actual API call)
    async function getAssetCategory(assetId) {
        // You can implement fetching asset details from /assets/{assetId}
        // For now, return a placeholder based on assetId
        const categories = ['Electronics', 'Audio Visual', 'Mobile Device', 'Photography', 'Display', 'Peripheral'];
        return categories[assetId % categories.length];
    }

    // Update user name from session/localStorage
    function updateUserInfo() {
        const userName = localStorage.getItem('userName') || 'Johannes Motsemme';
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
                loan.userId.toString().includes(searchTerm) ||
                loan.assetId.toString().includes(searchTerm) ||
                loan.loanId.toString().includes(searchTerm)
            );
        }

        if (filteredLoans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">No loans found</td></tr>';
            return;
        }

        tbody.innerHTML = '';

        for (const loan of filteredLoans) {
            const row = document.createElement('tr');
            const assetCategory = await getAssetCategory(loan.assetId);
            const department = await getDepartmentName(loan.userId);

            row.innerHTML = `
                <td>${loan.loanId}</td>
                <td>${loan.assetId}</td>
                <td>${assetCategory}</td>
                <td>${formatDate(loan.requestDate)}</td>
                <td>${formatDate(loan.dueDate)}</td>
                <td>User #${loan.userId}</td>
                <td>${department}</td>
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

    // Update stats and summary
    function updateStats() {
        const pending = allLoans.filter(l => l.status === 'PENDING').length;
        const approved = allLoans.filter(l => l.status === 'APPROVED').length;
        const rejected = allLoans.filter(l => l.status === 'REJECTED').length;
        const returned = allLoans.filter(l => l.status === 'RETURNED').length;

        document.getElementById('stat-pending').textContent = `${pending} Request${pending !== 1 ? 's' : ''}`;
        document.getElementById('stat-approved').textContent = `${approved} Request${approved !== 1 ? 's' : ''}`;
        document.getElementById('stat-rejected').textContent = `${rejected} Request${rejected !== 1 ? 's' : ''}`;

        document.getElementById('total-count').textContent = `Total: ${allLoans.length} requests`;
        document.getElementById('pending-count').textContent = pending;

        // Update summary list
        const summaryList = document.getElementById('summary-list');
        summaryList.innerHTML = `
            <li><i class="fa-regular fa-clock"></i> Pending: ${pending} requests</li>
            <li><i class="fa-solid fa-check-circle" style="color: #10b981;"></i> Approved: ${approved}</li>
            <li><i class="fa-solid fa-times-circle" style="color: #ef4444;"></i> Rejected: ${rejected}</li>
            <li><i class="fa-solid fa-arrow-rotate-left" style="color: #4f46e5;"></i> Returned: ${returned}</li>
        `;
    }

    // Update overdue count (requires a separate API call or calculation)
    async function updateOverdueCount() {
        try {
            const overdueLoans = await apiRequest('/loans/overdue');
            const overdueCount = overdueLoans.length;
            document.getElementById('overdue-count').textContent = overdueCount;
        } catch (error) {
            console.error('Error fetching overdue loans:', error);
            // Fallback: calculate from all loans
            const overdue = allLoans.filter(l => {
                if (l.status !== 'APPROVED') return false;
                if (!l.dueDate) return false;
                return new Date(l.dueDate) < new Date();
            });
            document.getElementById('overdue-count').textContent = overdue.length;
        }
    }

    // Update entire UI
    async function updateUI() {
        await renderLoansTable();
        updateStats();
        await updateOverdueCount();
    }

    // Load initial data
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
            window.location.href = 'login.html';
        });

        document.getElementById('overdue-link').addEventListener('click', async (e) => {
            e.preventDefault();
            // Filter to show only overdue loans
            try {
                const overdueLoans = await apiRequest('/loans/overdue');
                allLoans = overdueLoans;
                document.getElementById('status-filter').value = 'ALL';
                document.getElementById('search-input').value = '';
                renderLoansTable();
                showToast(`Showing ${overdueLoans.length} overdue loans`, 'info');
            } catch (error) {
                showToast('Failed to load overdue loans', 'error');
            }
        });
    }

    // Initialize page
    function init() {
        updateUserInfo();
        setupEventListeners();
        loadData();
    }

    // Run initialization when DOM is ready
    document.addEventListener('DOMContentLoaded', init);