document.addEventListener('DOMContentLoaded', () => {
    const profileName = document.getElementById('profileName');
    const profileRoleDept = document.getElementById('profileRoleDept');
    const returnBody = document.getElementById('returnBody');
    const returnSearch = document.getElementById('returnSearch');
    const returnFilter = document.getElementById('returnFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let activeLoans = [];
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

    function isOverdue(loan) {
        if (!loan.dueDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(loan.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        return dueDate < today;
    }

    function isReturned(loan) {
        return String(loan.status || '').toUpperCase() === 'RETURNED' || Boolean(loan.returnDate);
    }

    function updateProfile() {
        if (currentUser.fullName) {
            profileName.textContent = currentUser.fullName;
            
            if (profileRoleDept && currentUser.role && currentUser.department) {
                const roleDisplay = currentUser.role === 'ROLE_MANAGER' ? 'Manager' : 'Staff';
                profileRoleDept.textContent = `${roleDisplay}-${currentUser.department} Department`;
            }
        }
    }

    function updateStats() {
        const returnedCount = activeLoans.filter(isReturned).length;
        const inUseCount = activeLoans.length - returnedCount;

        document.getElementById('borrowedCount').textContent = activeLoans.length;
        document.getElementById('readyCount').textContent = returnedCount;
        document.getElementById('inUseCount').textContent = inUseCount;
    }

    function getFilteredLoans() {
        const query = returnSearch.value.trim().toLowerCase();
        const filter = returnFilter.value;

        return activeLoans.filter(loan => {
            const returned = isReturned(loan);
            const overdue = isOverdue(loan);

            const matchesFilter =
                filter === 'ALL' ||
                (filter === 'RETURNED' && returned) ||
                (filter === 'IN_USE' && !returned) ||
                (filter === 'OVERDUE' && overdue);

            const matchesSearch =
                !query ||
                loan.assetName?.toLowerCase().includes(query) ||
                loan.assetCategory?.toLowerCase().includes(query) ||
                String(loan.loanId || '').includes(query);

            return matchesFilter && matchesSearch;
        });
    }

    function getStateBadge(loan) {
        if (isReturned(loan)) {
            return '<span class="status ready-badge">Returned</span>';
        }

        if (isOverdue(loan)) {
            return '<span class="status overdue-badge">Overdue</span>';
        }

        return '<span class="status use-badge">Currently In Use</span>';
    }

    function getActionButton(loan) {
        if (isReturned(loan)) {
            return '<span class="muted-text">Awaiting manager check-in</span>';
        }

        return `<button class="return-btn" data-action="return" data-loan-id="${loan.loanId}">Return Asset</button>`;
    }

    function renderLoans() {
        const filteredLoans = getFilteredLoans();
        updateStats();

        if (!filteredLoans.length) {
            returnBody.innerHTML = '<tr><td colspan="6" class="empty-state">No borrowed assets match this view.</td></tr>';
            return;
        }

        filteredLoans.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

        returnBody.innerHTML = filteredLoans.map(loan => `
            <tr>
                <td>
                    <strong>${loan.assetName || 'N/A'}</strong>
                    <div class="muted-text">Loan ID: ${loan.loanId || 'N/A'}</div>
                </td>
                <td>${loan.assetCategory || 'N/A'}</td>
                <td>${formatDate(loan.checkoutDate)}</td>
                <td>${formatDate(loan.dueDate)}</td>
                <td>${getStateBadge(loan)}</td>
                <td>${getActionButton(loan)}</td>
            </tr>
        `).join('');
    }

    async function returnAsset(loanId) {
        try {
            const response = await fetch(`/api/loans/${encodeURIComponent(loanId)}/return`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Could not return this asset.');
            }

            await loadBorrowedAssets();
        } catch (error) {
            console.error(error);
            returnBody.innerHTML = `<tr><td colspan="6" class="empty-state">${error.message}</td></tr>`;
        }
    }

    async function loadBorrowedAssets() {
        if (!currentUser.id) {
            returnBody.innerHTML = '<tr><td colspan="6" class="empty-state">Please sign in again to view borrowed assets.</td></tr>';
            updateStats();
            return;
        }

        returnBody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading borrowed assets...</td></tr>';

        try {
            const response = await fetch(`/api/loans/user/${currentUser.id}`);

            if (!response.ok) {
                throw new Error('Could not load borrowed assets.');
            }

            const loans = await response.json();
            activeLoans = loans.filter(loan => {
                const status = String(loan.status || '').toUpperCase();
                return status === 'APPROVED' || status === 'RETURNED';
            });

            renderLoans();
        } catch (error) {
            console.error(error);
            activeLoans = [];
            updateStats();
            returnBody.innerHTML = `<tr><td colspan="6" class="empty-state">${error.message}</td></tr>`;
        }
    }

    returnBody.addEventListener('click', event => {
        const button = event.target.closest('button[data-loan-id]');
        if (!button) return;

        if (button.dataset.action === 'return') {
            returnAsset(button.dataset.loanId);
        }
    });

    returnSearch.addEventListener('input', renderLoans);
    returnFilter.addEventListener('change', renderLoans);
    refreshBtn.addEventListener('click', loadBorrowedAssets);

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = '/logout';
    });

    updateProfile();
    loadBorrowedAssets();
});
