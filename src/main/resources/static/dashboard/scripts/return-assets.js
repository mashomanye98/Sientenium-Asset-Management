document.addEventListener('DOMContentLoaded', () => {
    const profileName = document.getElementById('profileName');
    const returnBody = document.getElementById('returnBody');
    const returnSearch = document.getElementById('returnSearch');
    const returnFilter = document.getElementById('returnFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    let activeLoans = [];
    const currentUser = getCurrentUser();
    const readyKey = `readyReturnLoans:${currentUser.id || 'guest'}`;

    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem('currentUser')) || {};
        } catch (error) {
            return {};
        }
    }

    function getReadyLoanIds() {
        try {
            return JSON.parse(localStorage.getItem(readyKey)) || [];
        } catch (error) {
            return [];
        }
    }

    function saveReadyLoanIds(ids) {
        localStorage.setItem(readyKey, JSON.stringify(ids));
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

    function isReady(loan) {
        return getReadyLoanIds().includes(String(loan.loanId));
    }

    function updateProfile() {
        if (currentUser.fullName) {
            profileName.textContent = currentUser.fullName;
        }
    }

    function updateStats() {
        const readyCount = activeLoans.filter(isReady).length;
        const inUseCount = activeLoans.length - readyCount;

        document.getElementById('borrowedCount').textContent = activeLoans.length;
        document.getElementById('readyCount').textContent = readyCount;
        document.getElementById('inUseCount').textContent = inUseCount;
    }

    function getFilteredLoans() {
        const query = returnSearch.value.trim().toLowerCase();
        const filter = returnFilter.value;

        return activeLoans.filter(loan => {
            const ready = isReady(loan);
            const overdue = isOverdue(loan);

            const matchesFilter =
                filter === 'ALL' ||
                (filter === 'READY' && ready) ||
                (filter === 'IN_USE' && !ready) ||
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
        if (isOverdue(loan)) {
            return '<span class="status overdue-badge">Overdue</span>';
        }

        if (isReady(loan)) {
            return '<span class="status ready-badge">Ready For Return</span>';
        }

        return '<span class="status use-badge">Currently In Use</span>';
    }

    function getActionButton(loan) {
        if (isReady(loan)) {
            return `<button class="cancel-return-btn" data-action="cancel" data-loan-id="${loan.loanId}">Cancel Ready</button>`;
        }

        return `<button class="return-btn" data-action="ready" data-loan-id="${loan.loanId}">Mark Ready</button>`;
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

    function setReadyState(loanId, ready) {
        const ids = getReadyLoanIds();
        const stringId = String(loanId);
        const nextIds = ready
            ? [...new Set([...ids, stringId])]
            : ids.filter(id => id !== stringId);

        saveReadyLoanIds(nextIds);
        renderLoans();
    }

    async function loadBorrowedAssets() {
        if (!currentUser.id) {
            returnBody.innerHTML = '<tr><td colspan="6" class="empty-state">Please sign in again to view borrowed assets.</td></tr>';
            updateStats();
            return;
        }

        returnBody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading borrowed assets...</td></tr>';

        try {
            const response = await fetch(`/loans/user/${currentUser.id}`);

            if (!response.ok) {
                throw new Error('Could not load borrowed assets.');
            }

            const loans = await response.json();
            activeLoans = loans.filter(loan =>
                String(loan.status || '').toUpperCase() === 'APPROVED' && !loan.returnDate
            );

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

        const ready = button.dataset.action === 'ready';
        setReadyState(button.dataset.loanId, ready);
    });

    returnSearch.addEventListener('input', renderLoans);
    returnFilter.addEventListener('change', renderLoans);
    refreshBtn.addEventListener('click', loadBorrowedAssets);

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../../signIn.html';
    });

    updateProfile();
    loadBorrowedAssets();
});
