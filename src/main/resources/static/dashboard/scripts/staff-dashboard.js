document.addEventListener('DOMContentLoaded', () => {
    const profileName = document.getElementById('profileName');
    const profileRoleDept = document.getElementById('profileRoleDept');
    const requestAssetBtn = document.getElementById('requestAssetBtn');
    const logoutBtn = document.querySelector('.logout-btn');
    const viewAllAssetsLink = document.getElementById('viewAllAssetsLink');

    const counts = {
        availableAssets: document.getElementById('availableAssetsCount'),
        pendingRequests: document.getElementById('pendingRequestsCount'),
        activeLoans: document.getElementById('activeLoansCount'),
        returnedAssets: document.getElementById('dueSoonCount'),
        loanRequestsBadge: document.getElementById('loanRequestsBadge')
    };

    const availableAssetsBody = document.getElementById('availableAssetsBody');
    const activeLoansBody = document.getElementById('activeLoansBody');
    const notificationsList = document.getElementById('notificationsList');

    let availableAssets = [];
    let allLoans = [];
    let showingAllAssets = false;

    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem('currentUser')) || {};
        } catch (error) {
            return {};
        }
    }

    const currentUser = getCurrentUser();

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatDate(value) {
        if (!value) return 'N/A';

        return new Date(value).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    function daysUntil(value) {
        if (!value) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const date = new Date(value);
        date.setHours(0, 0, 0, 0);

        return Math.ceil((date - today) / 86400000);
    }

    function isApprovedActiveLoan(loan) {
        return String(loan.status || '').toUpperCase() === 'APPROVED' && !loan.returnDate;
    }

    function isPendingLoan(loan) {
        return String(loan.status || '').toUpperCase() === 'PENDING';
    }

    function isDueSoon(loan) {
        const days = daysUntil(loan.dueDate);
        return days !== null && days >= 0 && days <= 7;
    }

    function isReturnedLoan(loan) {
        return String(loan.status || '').toUpperCase() === 'RETURNED' || Boolean(loan.returnDate);
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

            if (profileRoleDept && currentUser.role && currentUser.department) {
                const roleDisplay = currentUser.role === 'ROLE_MANAGER' ? 'Manager' : 'Staff';
                profileRoleDept.textContent = `${roleDisplay}-${currentUser.department} Department`;
            }
        }
    }

    function renderAvailableAssets() {
        const visibleAssets = showingAllAssets ? availableAssets : availableAssets.slice(0, 2);
        viewAllAssetsLink.textContent = showingAllAssets ? 'Show Less' : 'View All';

        if (!visibleAssets.length) {
            availableAssetsBody.innerHTML = '<tr><td colspan="5" class="empty-state">No available assets found.</td></tr>';
            return;
        }

        availableAssetsBody.innerHTML = visibleAssets.map(asset => {
            // Location display
            let displayLocation = asset.location || 'Unknown';
            
            return `
                <tr>
                    <td>${escapeHtml(asset.title || 'Untitled Asset')}</td>
                    <td>${escapeHtml(asset.category || 'N/A')}</td>
                    <td>${escapeHtml(displayLocation)}</td>
                    <td>${escapeHtml(asset.condition || 'Unknown')}</td>
                    <td><span class="status application">${escapeHtml(asset.status || 'AVAILABLE')}</span></td>
                </tr>
            `;
        }).join('');
    }

    function renderActiveLoans(activeLoans) {
        if (!activeLoans.length) {
            activeLoansBody.innerHTML = '<tr><td colspan="3" class="empty-state">No active loans.</td></tr>';
            return;
        }

        activeLoansBody.innerHTML = activeLoans
            .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
            .map(loan => `
                <tr>
                    <td>${escapeHtml(loan.assetName || 'N/A')}</td>
                    <td>${formatDate(loan.dueDate)}</td>
                    <td><span class="status proposal">Active</span></td>
                </tr>
            `).join('');
    }


    function buildSystemAlerts(activeLoans, pendingLoans) {
        const alerts = [];

        activeLoans
            .filter(isDueSoon)
            .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
            .forEach(loan => {
                const days = daysUntil(loan.dueDate);
                alerts.push({
                    icon: 'fa-clock',
                    tone: days === 0 ? 'danger' : 'success',
                    title: days === 0 ? 'Asset Due Today' : 'Asset Due Soon',
                    message: `${loan.assetName || 'An asset'} is due ${days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`}.`
                });
            });

        if (pendingLoans.length) {
            alerts.push({
                icon: 'fa-file-signature',
                tone: 'success',
                title: 'Pending Loan Requests',
                message: `You have ${pendingLoans.length} pending loan request${pendingLoans.length === 1 ? '' : 's'} awaiting review.`
            });
        }

        allLoans
            .filter(loan => ['REJECTED', 'RETURNED'].includes(String(loan.status || '').toUpperCase()))
            .slice(-2)
            .reverse()
            .forEach(loan => {
                const status = String(loan.status || '').toUpperCase();
                alerts.push({
                    icon: status === 'RETURNED' ? 'fa-box' : 'fa-xmark',
                    tone: status === 'RETURNED' ? 'success' : 'danger',
                    title: status === 'RETURNED' ? 'Asset Returned' : 'Loan Rejected',
                    message: `${loan.assetName || 'Asset'} was ${status.toLowerCase()}.`
                });
            });

        return alerts.slice(0, 4);
    }

    function renderNotifications(activeLoans, pendingLoans) {
        const alerts = buildSystemAlerts(activeLoans, pendingLoans);

        if (!alerts.length) {
            notificationsList.innerHTML = '<div class="empty-state">No system alerts right now.</div>';
            return;
        }

        notificationsList.innerHTML = alerts.map(alert => `
            <div class="activity">
                <div class="activity-icon ${alert.tone}">
                    <i class="fa-solid ${alert.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${escapeHtml(alert.title)}</h4>
                    <p>${escapeHtml(alert.message)}</p>
                </div>
            </div>
        `).join('');
    }

    function updateLoanSections() {
        const activeLoans = allLoans.filter(isApprovedActiveLoan);
        const pendingLoans = allLoans.filter(isPendingLoan);
        const returnedLoans = allLoans.filter(isReturnedLoan);

        counts.pendingRequests.textContent = pendingLoans.length;
        counts.loanRequestsBadge.textContent = pendingLoans.length;
        counts.activeLoans.textContent = activeLoans.length;
        counts.returnedAssets.textContent = returnedLoans.length;

        renderActiveLoans(activeLoans);
        renderNotifications(activeLoans, pendingLoans);
    }

    async function loadAssets() {
        availableAssetsBody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading available assets...</td></tr>';

        const response = await fetch('/api/assets');
        if (!response.ok) {
            throw new Error('Could not load assets from the database.');
        }

        const assets = await response.json();
        availableAssets = assets.filter(asset => String(asset.status || '').toUpperCase() === 'AVAILABLE');
        counts.availableAssets.textContent = availableAssets.length;
        renderAvailableAssets();
    }

    async function loadLoans() {
        activeLoansBody.innerHTML = '<tr><td colspan="3" class="empty-state">Loading active loans...</td></tr>';
        notificationsList.innerHTML = '<div class="empty-state">Loading system alerts...</div>';

        const endpoint = currentUser.id ? `/api/loans/user/${encodeURIComponent(currentUser.id)}` : '/api/loans';
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error('Could not load loan data from the database.');
        }

        allLoans = await response.json();
        updateLoanSections();
    }

    async function loadDashboard() {
        updateProfile();

        try {
            await Promise.all([loadAssets(), loadLoans()]);
        } catch (error) {
            console.error(error);
            availableAssetsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
            activeLoansBody.innerHTML = `<tr><td colspan="3" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
            notificationsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
        }
    }

    viewAllAssetsLink.addEventListener('click', event => {
        event.preventDefault();
        showingAllAssets = !showingAllAssets;
        renderAvailableAssets();
    });

    requestAssetBtn.addEventListener('click', () => {
        window.location.href = 'available-assets.html';
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = '/logout';
    });

    loadDashboard();
});
