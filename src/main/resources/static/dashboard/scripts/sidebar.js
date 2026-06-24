/**
 * Sientenium Asset Management — Shared Sidebar Component
 * Usage: <script src="sidebar.js"></script>
 * Add class="active" to the nav item matching the current page via data-page attribute on <body>
 * Example: <body data-page="audit-logs">
 */

(function () {

  const NAV_ITEMS = [
    { id: 'dashboard',      label: 'Dashboard',         href: 'dashboard.html',       icon: iconHome() },
    { id: 'assets',         label: 'Assets',             href: 'assets.html',          icon: iconAssets() },
    { id: 'users',          label: 'Users',              href: 'users.html',            icon: iconUsers() },
    { id: 'loan-requests',  label: 'Loan Requests',      href: 'loan-requests.html',   icon: iconLoans() },
    { id: 'retire-assets',  label: 'Retire Assets',      href: 'retire-assets.html',   icon: iconRetire() },
    { id: 'reports',        label: 'Reports & Insights', href: 'reports.html',         icon: iconReports() },
    { id: 'audit-logs',     label: 'Audit Logs',         href: 'audit-logs.html',      icon: iconAudit() },
  ];

  // ── ICONS ──────────────────────────────────────────────────

  function iconHome() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  }

  function iconAssets() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
  }

  function iconUsers() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`;
  }

  function iconLoans() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  }

  function iconRetire() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`;
  }

  function iconReports() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
  }

  function iconAudit() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  }

  function iconLogout() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
  }

  // ── STYLES ─────────────────────────────────────────────────

  const STYLES = `
    #sam-sidebar {
      width: 240px;
      min-height: 100vh;
      background: #ffffff;
      border-right: 1px solid #E2E5EA;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 200;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    #sam-sidebar .sam-profile {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 20px 20px;
      border-bottom: 1px solid #F0F1F3;
    }

    #sam-sidebar .sam-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #E8EDF2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      overflow: hidden;
      border: 2px solid #E2E5EA;
    }

    #sam-sidebar .sam-avatar svg {
      color: #9CA3AF;
    }

    #sam-sidebar .sam-name {
      font-size: 14px;
      font-weight: 600;
      color: #1A1D23;
      text-align: center;
      margin-bottom: 2px;
    }

    #sam-sidebar .sam-org {
      font-size: 12px;
      color: #6B7280;
      text-align: center;
      margin-bottom: 2px;
    }

    #sam-sidebar .sam-role-badge {
      font-size: 11px;
      font-weight: 600;
      color: #185FA5;
      background: #E6F1FB;
      padding: 2px 8px;
      border-radius: 99px;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    #sam-sidebar .sam-nav {
      flex: 1;
      padding: 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    #sam-sidebar .sam-nav a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #4B5563;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
    }

    #sam-sidebar .sam-nav a:hover {
      background: #F5F6F8;
      color: #1A1D23;
    }

    #sam-sidebar .sam-nav a.active {
      background: #E6F1FB;
      color: #185FA5;
    }

    #sam-sidebar .sam-nav a svg {
      flex-shrink: 0;
      opacity: 0.7;
    }

    #sam-sidebar .sam-nav a.active svg {
      opacity: 1;
    }

    #sam-sidebar .sam-footer {
      padding: 12px;
      border-top: 1px solid #F0F1F3;
    }

    #sam-sidebar .sam-logout {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #A32D2D;
      cursor: pointer;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      font-family: inherit;
      transition: background 0.15s;
    }

    #sam-sidebar .sam-logout:hover {
      background: #FCEBEB;
    }

    /* Push page content to the right of the sidebar */
    body.sam-has-sidebar {
      margin-left: 240px;
    }

    @media (max-width: 768px) {
      #sam-sidebar {
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }
      #sam-sidebar.open {
        transform: translateX(0);
      }
      body.sam-has-sidebar {
        margin-left: 0;
      }
    }
  `;

  // ── BUILD SIDEBAR ───────────────────────────────────────────

  function getActivePage() {
    return document.body.getAttribute('data-page') || '';
  }

  function getUserInfo() {
    try {
      const stored = localStorage.getItem('sam_user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { name: 'System Administrator', org: 'Sientenium', role: 'ADMIN' };
  }

  function formatRole(role) {
    return (role || 'STAFF').replace('ROLE_', '');
  }

  function buildSidebar() {
    const activePage = getActivePage();
    const user = getUserInfo();

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);

    // Build sidebar HTML
    const sidebar = document.createElement('nav');
    sidebar.id = 'sam-sidebar';

    // Profile section
    sidebar.innerHTML = `
      <div class="sam-profile">
        <div class="sam-avatar">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div class="sam-name">${user.name}</div>
        <div class="sam-org">${user.org}</div>
        <span class="sam-role-badge">${formatRole(user.role)}</span>
      </div>

      <div class="sam-nav">
        ${NAV_ITEMS.map(item => `
          <a href="${item.href}" class="${activePage === item.id ? 'active' : ''}">
            ${item.icon}
            ${item.label}
          </a>
        `).join('')}
      </div>

      <div class="sam-footer">
        <button class="sam-logout" id="sam-logout-btn">
          ${iconLogout()}
          Log Out
        </button>
      </div>
    `;

    // Insert sidebar as first child of body
    document.body.insertBefore(sidebar, document.body.firstChild);
    document.body.classList.add('sam-has-sidebar');

    // Logout handler
    document.getElementById('sam-logout-btn').addEventListener('click', function () {
      localStorage.removeItem('sam_user');
      localStorage.removeItem('sam_token');
      window.location.href = 'login.html';
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebar);
  } else {
    buildSidebar();
  }

})();