// ============================================
// MANAGER DASHBOARD
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const statPending = document.getElementById('statPending');
    const statActive = document.getElementById('statActive');
    const statOverdue = document.getElementById('statOverdue');
    const statTotal = document.getElementById('statTotal');
    const pendingTableBody = document.getElementById('pendingLoansBody');
    const activityList = document.getElementById('activityList');
    const pendingBadge = document.getElementById('pendingBadge');

    let allLoans = [];
    let allAssets = [];

    // Load dashboard data
    async function loadDashboard() {
        try {
            const [loans, assets] = await Promise.all([
                apiRequest('/loans'),
                apiRequest('/api/assets')
            ]);

            allLoans = loans || [];
            allAssets = assets || [];

            updateStats();
            renderPendingLoans();
            renderActivity();
            updatePendingBadge();
            updateProfileName();
        } catch (error) {
            console.error('Error loading manager dashboard:', error);
            // Show error in tables
            if (pendingTableBody) {
                pendingTableBody.innerHTML = `
                    <tr><td colspan="5" class="empty-state">Failed to load data</td></tr>
                `;
            }
        }
    }

    // Update statistics
    function updateStats() {
        const pending = allLoans.filter(l => l.status === 'PENDING').length;
        const active = allLoans.filter(l => l.status === 'APPROVED').length;
        const overdue = allLoans.filter(l =>
            l.status === 'APPROVED' && calculateDaysOverdue(l.dueDate) > 0
        ).length;
        const total = allAssets.length;

        if (statPending) statPending.textContent = `${pending} Requests`;
        if (statActive) statActive.textContent = `${active} Loans`;
        if (statOverdue) statOverdue.textContent = `${overdue} Assets`;
        if (statTotal) statTotal.textContent = `${total} Assets`;
    }

    // Render pending loan requests (max 5)
    function renderPendingLoans() {
        if (!pendingTableBody) return;

        const pending = allLoans
            .filter(l => l.status === 'PENDING')
            .slice(0, 5);

        if (pending.length === 0) {
            pendingTableBody.innerHTML = `
                <tr><td colspan="5" class="empty-state">No pending loan requests</td></tr>
            `;
            return;
        }

        pendingTableBody.innerHTML = pending.map(loan => `
            <tr>
                <td>${loan.assetName || 'N/A'}</td>
                <td><span class="status proposal">Asset Loan</span></td>
                <td>${formatDate(loan.dueDate)}</td>
                <td>${loan.userName || 'Unknown'}</td>
                <td>
                    <a href="manager-loan-requests.html" class="review-link">Approve / Reject</a>
                </td>
            </tr>
        `).join('');
    }

    // Render recent activity (max 3)
    function renderActivity() {
        if (!activityList) return;

        const recent = allLoans
            .filter(l => l.status === 'APPROVED' || l.status === 'REJECTED' || l.status === 'RETURNED')
            .slice(0, 3);

        if (recent.length === 0) {
            activityList.innerHTML = `
                <div class="activity">
                    <div class="activity-content">
                        <p class="empty-state" style="color: var(--muted);">No recent activity</p>
                    </div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = recent.map(loan => {
            const isApproved = loan.status === 'APPROVED';
            const isRejected = loan.status === 'REJECTED';
            const icon = isApproved ? 'fa-check' : (isRejected ? 'fa-xmark' : 'fa-arrow-left');
            const type = isApproved ? 'success' : (isRejected ? 'danger' : 'success');
            const action = isApproved ? 'Approved' : (isRejected ? 'Rejected' : 'Returned');

            return `
                <div class="activity">
                    <div class="activity-icon ${type}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>Loan ${action}</h4>
                        <p>${loan.assetName || 'Asset'} requested by ${loan.userName || 'Unknown'}</p>
                    </div>
                    <span style="color: var(--muted); font-size: 0.75rem;">${formatDate(loan.requestDate)}</span>
                </div>
            `;
        }).join('');
    }

    // Update pending badge in sidebar
    function updatePendingBadge() {
        if (pendingBadge) {
            const count = allLoans.filter(l => l.status === 'PENDING').length;
            pendingBadge.textContent = count;
        }
    }

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../../signIn.html';
    });

    // Load dashboard
    loadDashboard();
});