const API_BASE = "http://localhost:8081";

  let allAssets = [];
  let allLoans  = [];
  let allUsers  = [];

  // ── UTILITIES ──────────────────────────────────────────────

  function fmt(dt) {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-ZA', { year:'numeric', month:'short', day:'2-digit' }) +
           ' ' + d.toLocaleTimeString('en-ZA', { hour:'2-digit', minute:'2-digit' });
  }

  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-ZA', { year:'numeric', month:'short', day:'2-digit' });
  }

  function fmtCost(n) {
    if (n == null) return '—';
    return 'R ' + Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
  }

  function badge(value, type) {
      // Clean up role names
      let displayValue = value || '—';
      if (type === 'role' && displayValue.startsWith('ROLE_')) {
          displayValue = displayValue.substring(5); // Remove 'ROLE_'
      }
      const cls = 'badge badge-' + (displayValue || '').toLowerCase().replace(/\s+/g, '');
      return '<span class="' + cls + '">' + displayValue + '</span>';
  }
  function pill(label, value) {
    return '<div class="summary-pill">' + label + '<strong>' + value + '</strong></div>';
  }

  function setApiStatus(state, text) {
    document.getElementById('apiDot').className = 'api-dot ' + state;
    document.getElementById('apiLabel').textContent = text;
  }

  // ── ASSETS ─────────────────────────────────────────────────

 function renderAssets() {
     const search = document.getElementById('assetSearch')?.value?.toLowerCase() || '';
     const status = document.getElementById('assetStatusFilter')?.value || '';
     const cat    = document.getElementById('assetCategoryFilter')?.value || '';
     const cond   = document.getElementById('assetConditionFilter')?.value || '';

     let filtered = allAssets.filter(a => {
         const matchSearch = !search ||
             (a.title || '').toLowerCase().includes(search) ||
             (a.serialNumber || '').toLowerCase().includes(search);
         const matchStatus = !status || a.status === status;
         const matchCat    = !cat    || a.category === cat;
         const matchCond   = !cond   || a.condition === cond;
         return matchSearch && matchStatus && matchCat && matchCond;
     });

     const countEl = document.getElementById('assetCount');
     if (countEl) countEl.textContent = filtered.length + ' records';

     const tbody = document.getElementById('assetBody');
     if (!tbody) return;

     if (filtered.length === 0) {
         // Changed colspan from 10 to 9
         tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No assets match the current filters.</td></tr>';
         return;
     }

     tbody.innerHTML = filtered.map((a, i) => {
         return '<tr>' +
             '<td class="mono">' + (i + 1) + '</td>' +
             '<td><strong>' + (a.title || '—') + '</strong></td>' +
             '<td class="mono">' + (a.serialNumber || '—') + '</td>' +
             '<td>' + (a.category || '—').replace(/_/g, ' ') + '</td>' +
             '<td>' + badge(a.condition) + '</td>' +
             '<td>' + badge(a.status) + '</td>' +
             '<td>' + (a.location || '—') + '</td>' +
             '<td class="mono">' + fmtCost(a.cost) + '</td>' +
             '<td class="mono">' + fmtDate(a.acquisitionDate) + '</td>' +
             '</tr>';
     }).join('');
 }

  function buildAssetSummary() {
    const total     = allAssets.length;
    const available = allAssets.filter(a => a.status === 'AVAILABLE').length;
    const loaned    = allAssets.filter(a => a.status === 'LOANED').length;
    const retired   = allAssets.filter(a => a.status === 'RETIRED').length;
    document.getElementById('assetSummary').innerHTML =
      pill('Total', total) + pill('Available', available) +
      pill('Loaned', loaned) + pill('Retired', retired);
  }

  // ── LOANS ──────────────────────────────────────────────────

  function renderLoans() {
    const search = document.getElementById('loanSearch').value.toLowerCase();
    const status = document.getElementById('loanStatusFilter').value;

    let filtered = allLoans.filter(l => {
      const assetTitle = (l.assetTitle || l.asset?.title || '').toLowerCase();
      const userName   = (l.userName || l.user?.name || '').toLowerCase();
      const matchSearch = !search || assetTitle.includes(search) || userName.includes(search);
      const matchStatus = !status || (l.status || '').toLowerCase() === status;
      return matchSearch && matchStatus;
    });

    document.getElementById('loanCount').textContent = filtered.length + ' records';

    const tbody = document.getElementById('loanBody');
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No loans match the current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(l => {
      const assetTitle = l.assetTitle || l.asset?.title || l.assetId || '—';
      const userName   = l.userName   || l.user?.name   || l.userId  || '—';
      return '<tr>' +
        '<td class="mono">' + (l.loanId || '—') + '</td>' +
        '<td><strong>' + assetTitle + '</strong></td>' +
        '<td>' + userName + '</td>' +
        '<td>' + badge(l.status) + '</td>' +
        '<td class="mono">' + fmt(l.requestDate) + '</td>' +
        '<td class="mono">' + fmt(l.checkoutDate) + '</td>' +
        '<td class="mono">' + fmt(l.dueDate) + '</td>' +
        '<td class="mono">' + fmt(l.returnDate) + '</td>' +
        '</tr>';
    }).join('');
  }

  function buildLoanSummary() {
    const total    = allLoans.length;
    const pending  = allLoans.filter(l => (l.status||'').toLowerCase() === 'pending').length;
    const approved = allLoans.filter(l => (l.status||'').toLowerCase() === 'approved').length;
    const rejected = allLoans.filter(l => (l.status||'').toLowerCase() === 'rejected').length;
    const returned = allLoans.filter(l => (l.status||'').toLowerCase() === 'returned').length;
    document.getElementById('loanSummary').innerHTML =
      pill('Total', total) + pill('Pending', pending) + pill('Approved', approved) +
      pill('Rejected', rejected) + pill('Returned', returned);
  }

  // ── USERS ──────────────────────────────────────────────────

  function renderUsers() {
    const search = document.getElementById('userSearch').value.toLowerCase();
    const role   = document.getElementById('userRoleFilter').value;

    let filtered = allUsers.filter(u => {
      const matchSearch = !search ||
        (u.name || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search);
      const matchRole = !role || (u.role || '').toUpperCase() === role;
      return matchSearch && matchRole;
    });

    document.getElementById('userCount').textContent = filtered.length + ' records';

    const tbody = document.getElementById('userBody');
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users match the current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((u, i) => {
      const statusBadge = u.active === false
        ? '<span class="badge badge-inactive">Inactive</span>'
        : '<span class="badge badge-active">Active</span>';
      return '<tr>' +
        '<td class="mono">' + (i + 1) + '</td>' +
        '<td><strong>' + (u.fullName || '—') + '</strong></td>' +
        '<td>' + (u.email || '—') + '</td>' +
        '<td>' + badge(u.role) + '</td>' +
        '<td>' + (u.department || '—') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td class="mono">' + fmt(u.createdAt) + '</td>' +
        '</tr>';
    }).join('');
  }

  function buildUserSummary() {
      const total   = allUsers.length;
      // CHANGE THESE LINES: strip ROLE_ prefix for comparison
      const admins  = allUsers.filter(u => {
          const role = (u.role || '').toUpperCase();
          return role === 'ADMIN' || role === 'ROLE_ADMIN';
      }).length;
      const managers = allUsers.filter(u => {
          const role = (u.role || '').toUpperCase();
          return role === 'MANAGER' || role === 'ROLE_MANAGER';
      }).length;
      const staff = allUsers.filter(u => {
          const role = (u.role || '').toUpperCase();
          return role === 'STAFF' || role === 'ROLE_STAFF';
      }).length;
      document.getElementById('userSummary').innerHTML =
          pill('Total', total) + pill('Admins', admins) +
          pill('Managers', managers) + pill('Staff', staff);
  }
  // ── CSV EXPORT ─────────────────────────────────────────────

  function exportCSV(type) {
    let headers, rows;

    if (type === 'assets') {
      headers = ['#','Title','Serial Number','Category','Condition','Status','Location','Cost (R)','Acquired'];
      rows = allAssets.map((a, i) => [
        i+1, a.title, a.serialNumber, a.category, a.condition,
        a.status, a.location, a.cost, a.acquisitionDate
      ]);
    } else if (type === 'loans') {
      headers = ['Loan ID','Asset','User','Status','Requested','Checked Out','Due Date','Returned'];
      rows = allLoans.map(l => [
        l.loanId,
        l.assetTitle || l.asset?.title || l.assetId,
        l.userName   || l.user?.name   || l.userId,
        l.status, l.requestDate, l.checkoutDate, l.dueDate, l.returnDate
      ]);
    } else {
      headers = ['#','Name','Email','Role','Department','Created'];
      rows = allUsers.map((u, i) => [
        i+1, u.name, u.email, u.role, u.department, u.createdAt
      ]);
    }

    const csv = [headers, ...rows]
      .map(r => r.map(v => '"' + (v != null ? String(v).replace(/"/g, '""') : '') + '"').join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = type + '-report-' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── FETCH ALL ──────────────────────────────────────────────

  async function fetchAll() {
    let ok = 0;

    try {
      const r = await fetch(API_BASE + "/api/assets");
      if (!r.ok) throw new Error();
      allAssets = await r.json();
      buildAssetSummary();
      renderAssets();
      ok++;
    } catch { document.getElementById('assetBody').innerHTML = '<tr><td colspan="10" class="empty-state">Could not load assets — check the API is running.</td></tr>'; }

    try {
      const r = await fetch(API_BASE + "/api/loans");
      if (!r.ok) throw new Error();
      allLoans = await r.json();
      buildLoanSummary();
      renderLoans();
      ok++;
    } catch { document.getElementById('loanBody').innerHTML = '<tr><td colspan="8" class="empty-state">Could not load loans — check the API is running.</td></tr>'; }

    try {
      const r = await fetch(API_BASE + "/api/auth/users");
      if (!r.ok) throw new Error();
      allUsers = await r.json();
      buildUserSummary();
      renderUsers();
      ok++;
    } catch { document.getElementById('userBody').innerHTML = '<tr><td colspan="7" class="empty-state">Could not load users — check the API is running.</td></tr>'; }

    setApiStatus(ok === 3 ? 'live' : ok > 0 ? 'error' : 'error',
      ok === 3 ? 'All data loaded' : ok + '/3 endpoints reachable');

    document.getElementById('generatedAt').textContent =
      'Generated ' + new Date().toLocaleString('en-ZA', { dateStyle:'full', timeStyle:'short' });
  }

  fetchAll();
