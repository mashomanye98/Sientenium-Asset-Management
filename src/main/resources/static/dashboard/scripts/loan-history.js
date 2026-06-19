document.addEventListener('DOMContentLoaded', () => {
    const profileName = document.getElementById('profileName');
    const historyBody = document.getElementById('historyBody');
    const historySearch = document.getElementById('historySearch');
    const statusFilter = document.getElementById('statusFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let loans = [];
    const currentUser = getCurrentUser();

    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem('currentUser')) || {};
        } catch (error) {
            return {};
        }
    }

    function formatDate(value) {
        if (!value) return 'N/A';

        return new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function cleanStatus(status) {
        return String(status || 'UNKNOWN').toUpperCase();
    }

    function statusLabel(status) {
        if (status === 'APPROVED') return 'Active';
        return status.charAt(0) + status.slice(1).toLowerCase();
    }

    function statusClass(status) {
        return `status status-${status.toLowerCase()}`;
    }

    function updateProfile() {
        if (currentUser.fullName) {
            profileName.textContent = currentUser.fullName;
        }
    }

    function updateStats() {
        const total = loans.length;
        const active = loans.filter(loan => cleanStatus(loan.status) === 'APPROVED').length;
        const returned = loans.filter(loan => cleanStatus(loan.status) === 'RETURNED').length;
        const pending = loans.filter(loan => cleanStatus(loan.status) === 'PENDING').length;

        document.getElementById('totalLoans').textContent = total;
        document.getElementById('activeLoans').textContent = active;
        document.getElementById('returnedLoans').textContent = returned;
        document.getElementById('pendingLoans').textContent = pending;
    }

    function getFilteredLoans() {
        const query = historySearch.value.trim().toLowerCase();
        const selectedStatus = statusFilter.value;

        return loans.filter(loan => {
            const status = cleanStatus(loan.status);
            const matchesStatus = selectedStatus === 'ALL' || status === selectedStatus;

            const matchesSearch =
                !query ||
                loan.assetName?.toLowerCase().includes(query) ||
                loan.assetCategory?.toLowerCase().includes(query) ||
                status.toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });
    }

    function renderLoans() {
        const filteredLoans = getFilteredLoans();

        if (!filteredLoans.length) {
            historyBody.innerHTML = '<tr><td colspan="7" class="empty-state">No borrowed assets found.</td></tr>';
            return;
        }

        filteredLoans.sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0));

        historyBody.innerHTML = filteredLoans.map(loan => {
            const status = cleanStatus(loan.status);

            return `
                <tr>
                    <td>
                        <strong>${loan.assetName || 'N/A'}</strong>
                        <div class="muted-text">Asset ID: ${loan.assetId || 'N/A'}</div>
                    </td>
                    <td>${loan.assetCategory || 'N/A'}</td>
                    <td>${formatDate(loan.requestDate)}</td>
                    <td>${formatDate(loan.checkoutDate)}</td>
                    <td>${formatDate(loan.dueDate)}</td>
                    <td>${formatDate(loan.returnDate)}</td>
                    <td><span class="${statusClass(status)}">${statusLabel(status)}</span></td>
                </tr>
            `;
        }).join('');
    }

    async function loadLoanHistory() {
        if (!currentUser.id) {
            historyBody.innerHTML = '<tr><td colspan="7" class="empty-state">Please sign in again to view your loan history.</td></tr>';
            return;
        }

        historyBody.innerHTML = '<tr><td colspan="7" class="empty-state">Loading loan history...</td></tr>';

        try {
            const response = await fetch(`/loans/user/${currentUser.id}`);

            if (!response.ok) {
                throw new Error('Could not load your loan history.');
            }

            loans = await response.json();
            updateStats();
            renderLoans();
        } catch (error) {
            console.error(error);
            historyBody.innerHTML = `<tr><td colspan="7" class="empty-state">${error.message}</td></tr>`;
        }
    }

    historySearch.addEventListener('input', renderLoans);
    statusFilter.addEventListener('change', renderLoans);
    refreshBtn.addEventListener('click', loadLoanHistory);

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../../signIn.html';
    });

    updateProfile();
    loadLoanHistory();
});
