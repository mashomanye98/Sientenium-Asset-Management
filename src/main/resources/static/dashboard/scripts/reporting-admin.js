const API_BASE = window.location.origin;

let allAssets = [];
let allLoans = [];
let allUsers = [];
let allOverdueLoans = [];

function fmt(value) {
    if (!value) return '-';
    const date = new Date(value);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' }) +
        ' ' + date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: '2-digit' });
}

function fmtCost(value) {
    if (value == null) return '-';
    return 'R ' + Number(value).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

function badge(value, type) {
    let displayValue = value || '-';
    if (type === 'role' && displayValue.startsWith('ROLE_')) {
        displayValue = displayValue.substring(5);
    }
    const cls = 'badge badge-' + String(displayValue).toLowerCase().replace(/\s+/g, '');
    return '<span class="' + cls + '">' + displayValue + '</span>';
}

function pill(label, value) {
    return '<div class="summary-pill">' + label + '<strong>' + value + '</strong></div>';
}

function setApiStatus(state, text) {
    const apiDot = document.getElementById('apiDot');
    const apiLabel = document.getElementById('apiLabel');
    if (apiDot) apiDot.className = 'api-dot ' + state;
    if (apiLabel) apiLabel.textContent = text;
}

function renderAssets() {
    const tbody = document.getElementById('assetBody');
    if (!tbody) return;

    const search = document.getElementById('assetSearch')?.value?.toLowerCase() || '';
    const status = document.getElementById('assetStatusFilter')?.value || '';
    const category = document.getElementById('assetCategoryFilter')?.value || '';
    const condition = document.getElementById('assetConditionFilter')?.value || '';

    const filtered = allAssets.filter(asset => {
        const matchesSearch = !search ||
            (asset.title || '').toLowerCase().includes(search) ||
            (asset.serialNumber || '').toLowerCase().includes(search);
        const matchesStatus = !status || asset.status === status;
        const matchesCategory = !category || asset.category === category;
        const matchesCondition = !condition || asset.condition === condition;
        return matchesSearch && matchesStatus && matchesCategory && matchesCondition;
    });

    const countEl = document.getElementById('assetCount');
    if (countEl) countEl.textContent = filtered.length + ' records';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No assets match the current filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((asset, index) => '<tr>' +
        '<td class="mono">' + (index + 1) + '</td>' +
        '<td><strong>' + (asset.title || '-') + '</strong></td>' +
        '<td class="mono">' + (asset.serialNumber || '-') + '</td>' +
        '<td>' + (asset.category || '-').replace(/_/g, ' ') + '</td>' +
        '<td>' + badge(asset.condition) + '</td>' +
        '<td>' + badge(asset.status) + '</td>' +
        '<td>' + (asset.location || '-') + '</td>' +
        '<td class="mono">' + fmtCost(asset.cost) + '</td>' +
        '<td class="mono">' + fmtDate(asset.acquisitionDate) + '</td>' +
        '</tr>').join('');
}

function buildAssetSummary() {
    const summary = document.getElementById('assetSummary');
    if (!summary) return;

    const total = allAssets.length;
    const available = allAssets.filter(asset => asset.status === 'AVAILABLE').length;
    const loaned = allAssets.filter(asset => asset.status === 'LOANED').length;
    const retired = allAssets.filter(asset => asset.status === 'RETIRED').length;
    summary.innerHTML = pill('Total', total) + pill('Available', available) +
        pill('Loaned', loaned) + pill('Retired', retired);
}

function renderLoans() {
    const tbody = document.getElementById('loanBody');
    if (!tbody) return;

    const search = document.getElementById('loanSearch')?.value?.toLowerCase() || '';
    const status = document.getElementById('loanStatusFilter')?.value || '';

    const filtered = allLoans.filter(loan => {
        const assetTitle = (loan.assetTitle || loan.assetName || loan.asset?.title || '').toLowerCase();
        const userName = (loan.userName || loan.user?.name || '').toLowerCase();
        const matchesSearch = !search || assetTitle.includes(search) || userName.includes(search);
        const matchesStatus = !status || (loan.status || '').toLowerCase() === status;
        return matchesSearch && matchesStatus;
    });

    const countEl = document.getElementById('loanCount');
    if (countEl) countEl.textContent = filtered.length + ' records';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No loans match the current filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(loan => {
        const assetTitle = loan.assetTitle || loan.assetName || loan.asset?.title || loan.assetId || '-';
        const userName = loan.userName || loan.user?.name || loan.userId || '-';
        return '<tr>' +
            '<td class="mono">' + (loan.loanId || '-') + '</td>' +
            '<td><strong>' + assetTitle + '</strong></td>' +
            '<td>' + userName + '</td>' +
            '<td>' + badge(loan.status) + '</td>' +
            '<td class="mono">' + fmt(loan.requestDate) + '</td>' +
            '<td class="mono">' + fmt(loan.checkoutDate) + '</td>' +
            '<td class="mono">' + fmt(loan.dueDate) + '</td>' +
            '<td class="mono">' + fmt(loan.returnDate) + '</td>' +
            '</tr>';
    }).join('');
}

function buildLoanSummary() {
    const summary = document.getElementById('loanSummary');
    if (!summary) return;

    const total = allLoans.length;
    const pending = allLoans.filter(loan => (loan.status || '').toLowerCase() === 'pending').length;
    const approved = allLoans.filter(loan => (loan.status || '').toLowerCase() === 'approved').length;
    const rejected = allLoans.filter(loan => (loan.status || '').toLowerCase() === 'rejected').length;
    const returned = allLoans.filter(loan => (loan.status || '').toLowerCase() === 'returned').length;
    summary.innerHTML = pill('Total', total) + pill('Pending', pending) + pill('Approved', approved) +
        pill('Rejected', rejected) + pill('Returned', returned);
}

function calculateDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function renderOverdueLoans() {
    const tbody = document.getElementById('overdueBody');
    if (!tbody) return;

    const search = document.getElementById('overdueSearch')?.value?.toLowerCase() || '';
    const minDays = Number(document.getElementById('overdueDaysFilter')?.value || 0);

    const filtered = allOverdueLoans.filter(loan => {
        const assetTitle = (loan.assetTitle || loan.assetName || loan.asset?.title || '').toLowerCase();
        const userName = (loan.userName || loan.user?.name || '').toLowerCase();
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        const matchesSearch = !search ||
            assetTitle.includes(search) ||
            userName.includes(search) ||
            String(loan.loanId || '').includes(search);
        const matchesDays = !minDays || daysOverdue >= minDays;
        return matchesSearch && matchesDays;
    }).sort((a, b) => calculateDaysOverdue(b.dueDate) - calculateDaysOverdue(a.dueDate));

    const countEl = document.getElementById('overdueCount');
    if (countEl) countEl.textContent = filtered.length + ' records';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No overdue loans match the current filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(loan => {
        const assetTitle = loan.assetTitle || loan.assetName || loan.asset?.title || loan.assetId || '-';
        const userName = loan.userName || loan.user?.name || loan.userId || '-';
        const daysOverdue = calculateDaysOverdue(loan.dueDate);
        return '<tr>' +
            '<td class="mono">' + (loan.loanId || '-') + '</td>' +
            '<td><strong>' + assetTitle + '</strong><br><span class="mono">Asset #' + (loan.assetId || '-') + '</span></td>' +
            '<td>' + userName + '<br><span class="mono">User #' + (loan.userId || '-') + '</span></td>' +
            '<td>' + (loan.userDepartment || '-') + '</td>' +
            '<td class="mono">' + fmtDate(loan.dueDate) + '</td>' +
            '<td>' + badge(daysOverdue + ' days') + '</td>' +
            '<td>' + badge(loan.status) + '</td>' +
            '<td class="mono">' + fmt(loan.checkoutDate) + '</td>' +
            '</tr>';
    }).join('');
}

function buildOverdueSummary() {
    const summary = document.getElementById('overdueSummary');
    if (!summary) return;

    const total = allOverdueLoans.length;
    const over7 = allOverdueLoans.filter(loan => calculateDaysOverdue(loan.dueDate) >= 7).length;
    const over30 = allOverdueLoans.filter(loan => calculateDaysOverdue(loan.dueDate) >= 30).length;
    const mostOverdue = allOverdueLoans.reduce((max, loan) => {
        if (!max) return loan;
        return calculateDaysOverdue(loan.dueDate) > calculateDaysOverdue(max.dueDate) ? loan : max;
    }, null);
    const maxDays = mostOverdue ? calculateDaysOverdue(mostOverdue.dueDate) : 0;

    summary.innerHTML = pill('Total overdue', total) + pill('7+ days', over7) +
        pill('30+ days', over30) + pill('Most overdue', maxDays + ' days');
}

function renderUsers() {
    const tbody = document.getElementById('userBody');
    if (!tbody) return;

    const search = document.getElementById('userSearch')?.value?.toLowerCase() || '';
    const role = document.getElementById('userRoleFilter')?.value || '';

    const filtered = allUsers.filter(user => {
        const matchesSearch = !search ||
            (user.fullName || user.name || '').toLowerCase().includes(search) ||
            (user.email || '').toLowerCase().includes(search);
        const userRole = (user.role || '').replace('ROLE_', '').toUpperCase();
        const matchesRole = !role || userRole === role;
        return matchesSearch && matchesRole;
    });

    const countEl = document.getElementById('userCount');
    if (countEl) countEl.textContent = filtered.length + ' records';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users match the current filters.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((user, index) => {
        const statusBadge = user.active === false
            ? '<span class="badge badge-inactive">Inactive</span>'
            : '<span class="badge badge-active">Active</span>';
        return '<tr>' +
            '<td class="mono">' + (index + 1) + '</td>' +
            '<td><strong>' + (user.fullName || user.name || '-') + '</strong></td>' +
            '<td>' + (user.email || '-') + '</td>' +
            '<td>' + badge(user.role, 'role') + '</td>' +
            '<td>' + (user.department || '-') + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '</tr>';
    }).join('');
}

function buildUserSummary() {
    const summary = document.getElementById('userSummary');
    if (!summary) return;

    const total = allUsers.length;
    const admins = allUsers.filter(user => ['ADMIN', 'ROLE_ADMIN'].includes((user.role || '').toUpperCase())).length;
    const managers = allUsers.filter(user => ['MANAGER', 'ROLE_MANAGER'].includes((user.role || '').toUpperCase())).length;
    const staff = allUsers.filter(user => ['STAFF', 'ROLE_STAFF'].includes((user.role || '').toUpperCase())).length;
    summary.innerHTML = pill('Total', total) + pill('Admins', admins) +
        pill('Managers', managers) + pill('Staff', staff);
}

function exportCSV(type) {
    let headers;
    let rows;

    if (type === 'assets') {
        headers = ['#', 'Title', 'Serial Number', 'Category', 'Condition', 'Status', 'Location', 'Cost (R)', 'Acquired'];
        rows = allAssets.map((asset, index) => [
            index + 1, asset.title, asset.serialNumber, asset.category, asset.condition,
            asset.status, asset.location, asset.cost, asset.acquisitionDate
        ]);
    } else if (type === 'loans') {
        headers = ['Loan ID', 'Asset', 'User', 'Status', 'Requested', 'Checked Out', 'Due Date', 'Returned'];
        rows = allLoans.map(loan => [
            loan.loanId,
            loan.assetTitle || loan.assetName || loan.asset?.title || loan.assetId,
            loan.userName || loan.user?.name || loan.userId,
            loan.status, loan.requestDate, loan.checkoutDate, loan.dueDate, loan.returnDate
        ]);
    } else if (type === 'overdue') {
        headers = ['Loan ID', 'Asset', 'User', 'Department', 'Due Date', 'Days Overdue', 'Status', 'Checked Out'];
        rows = allOverdueLoans.map(loan => [
            loan.loanId,
            loan.assetTitle || loan.assetName || loan.asset?.title || loan.assetId,
            loan.userName || loan.user?.name || loan.userId,
            loan.userDepartment,
            loan.dueDate,
            calculateDaysOverdue(loan.dueDate),
            loan.status,
            loan.checkoutDate
        ]);
    } else {
        headers = ['#', 'Name', 'Email', 'Role', 'Department'];
        rows = allUsers.map((user, index) => [
            index + 1, user.fullName || user.name, user.email, user.role, user.department
        ]);
    }

    const csv = [headers, ...rows]
        .map(row => row.map(value => '"' + (value != null ? String(value).replace(/"/g, '""') : '') + '"').join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = type + '-report-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
}

async function fetchJson(path) {
    const response = await fetch(API_BASE + path);
    if (!response.ok) {
        throw new Error('HTTP ' + response.status);
    }
    return response.json();
}

async function fetchAll() {
    let ok = 0;
    let expected = 0;

    if (document.getElementById('assetBody')) {
        expected++;
        try {
            allAssets = await fetchJson('/api/assets');
            buildAssetSummary();
            renderAssets();
            ok++;
        } catch (error) {
            document.getElementById('assetBody').innerHTML =
                '<tr><td colspan="9" class="empty-state">Could not load assets. Check the API is running.</td></tr>';
        }
    }

    if (document.getElementById('loanBody')) {
        expected++;
        try {
            allLoans = await fetchJson('/loans');
            buildLoanSummary();
            renderLoans();
            ok++;
        } catch (error) {
            document.getElementById('loanBody').innerHTML =
                '<tr><td colspan="8" class="empty-state">Could not load loans. Check the API is running.</td></tr>';
        }
    }

    if (document.getElementById('overdueBody')) {
        expected++;
        try {
            allOverdueLoans = await fetchJson('/loans/overdue');
            buildOverdueSummary();
            renderOverdueLoans();
            ok++;
        } catch (error) {
            document.getElementById('overdueBody').innerHTML =
                '<tr><td colspan="8" class="empty-state">Could not load overdue loans. Check the API is running.</td></tr>';
        }
    }

    if (document.getElementById('userBody')) {
        expected++;
        try {
            allUsers = await fetchJson('/api/auth/users');
            buildUserSummary();
            renderUsers();
            ok++;
        } catch (error) {
            document.getElementById('userBody').innerHTML =
                '<tr><td colspan="6" class="empty-state">Could not load users. Check the API is running.</td></tr>';
        }
    }

    setApiStatus(ok === expected ? 'live' : 'error',
        ok === expected ? 'All data loaded' : ok + '/' + expected + ' endpoints reachable');

    const generatedAt = document.getElementById('generatedAt');
    if (generatedAt) {
        generatedAt.textContent = 'Generated ' +
            new Date().toLocaleString('en-ZA', { dateStyle: 'full', timeStyle: 'short' });
    }
}

fetchAll();
