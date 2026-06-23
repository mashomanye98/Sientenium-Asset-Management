document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = window.location.origin;

    const statEls = {
        totalAssets: document.getElementById("totalAssetsCount"),
        availableAssets: document.getElementById("availableAssetsCount"),
        pendingRequests: document.getElementById("pendingRequestsCount"),
        activeLoans: document.getElementById("activeLoansCount")
    };

    const recentBody = document.getElementById("recent-staff-loans-body");
    const totalUsersEl = document.getElementById("totalUsersCount");
    const pendingStaffCountEl = document.getElementById("pendingStaffCount");

    let assets = [];
    let loans = [];
    let users = [];

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(value) {
        if (!value) return "N/A";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "N/A";
        return date.toLocaleDateString("en-ZA", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function normalizeRole(role) {
        return String(role || "").toUpperCase();
    }

    function requestHeaders() {
        const headers = {
            "Content-Type": "application/json"
        };
        const token = localStorage.getItem("authToken");
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        return headers;
    }

    async function fetchJson(path) {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: requestHeaders()
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    function getStaffUserIds() {
        return new Set(
            users
                .filter(user => normalizeRole(user.role).includes("STAFF"))
                .map(user => String(user.id))
        );
    }

    function updateStats() {
        const staffUserIds = getStaffUserIds();
        const pendingStaffRequests = loans.filter(loan => {
            const isPending = normalizeRole(loan.status) === "PENDING";
            return isPending && (staffUserIds.size === 0 || staffUserIds.has(String(loan.userId)));
        });

        const activeLoans = loans.filter(loan => normalizeRole(loan.status) === "APPROVED").length;
        const totalAssets = assets.length;
        const availableAssets = assets.filter(asset => normalizeRole(asset.status) === "AVAILABLE").length;

        if (statEls.totalAssets) statEls.totalAssets.textContent = totalAssets;
        if (statEls.availableAssets) statEls.availableAssets.textContent = availableAssets;
        if (statEls.pendingRequests) statEls.pendingRequests.textContent = pendingStaffRequests.length;
        if (statEls.activeLoans) statEls.activeLoans.textContent = activeLoans;

        if (totalUsersEl) totalUsersEl.textContent = users.length;
        if (pendingStaffCountEl) pendingStaffCountEl.textContent = pendingStaffRequests.length;

        return pendingStaffRequests;
    }

    function renderRecentRequests(pendingStaffRequests) {
        if (!recentBody) {
            return;
        }

        const recentRequests = [...pendingStaffRequests]
            .sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0))
            .slice(0, 2);

        if (!recentRequests.length) {
            recentBody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">No pending staff requests right now.</td>
                </tr>
            `;
            return;
        }

        recentBody.innerHTML = recentRequests.map(loan => `
            <tr>
                <td><strong>${escapeHtml(loan.userName || "N/A")}</strong><br><span style="font-size: 0.75rem; color: var(--muted);">${escapeHtml(loan.userDepartment || "N/A")}</span></td>
                <td>${escapeHtml(loan.assetName || "N/A")}</td>
                <td>${formatDate(loan.requestDate)}</td>
                <td>
                    <span class="status proposal">Pending</span>
                </td>
                <td>
                    <a class="review-link" href="/dashboard/admin/admin-loan-requests.html">Review</a>
                </td>
            </tr>
        `).join("");
    }

    function renderQuickLinks() {
        const quickLinks = document.getElementById("quick-links-grid");
        if (!quickLinks) {
            return;
        }

        const links = [
            { href: "/dashboard/admin/assets-admin.html", icon: "fa-boxes-stacked", title: "Assets", meta: "Inventory and status" },
            { href: "/dashboard/admin/users.html", icon: "fa-users", title: "Users", meta: "Accounts and roles" },
            { href: "/dashboard/admin/admin-loan-requests.html", icon: "fa-hand-holding", title: "Loan Requests", meta: "Review requests" },
            { href: "/dashboard/admin/admin-retire-assets.html", icon: "fa-box-archive", title: "Retire Assets", meta: "Dispose and restore" },
            { href: "/dashboard/admin/admin-report.html", icon: "fa-chart-line", title: "Reports", meta: "Audit-ready reporting" },
            { href: "/dashboard/audit-log.html", icon: "fa-clock-rotate-left", title: "Audit Logs", meta: "Track activity" }
        ];

        quickLinks.innerHTML = links.map(link => `
            <a class="quick-link" href="${link.href}">
                <span class="quick-link-icon">
                    <i class="fa-solid ${link.icon}"></i>
                </span>
                <span class="quick-link-copy">
                    <strong>${escapeHtml(link.title)}</strong>
                    <span>${escapeHtml(link.meta)}</span>
                </span>
                <i class="fa-solid fa-chevron-right quick-link-chevron"></i>
            </a>
        `).join("");
    }

    async function loadDashboard() {
        const recentTable = recentBody;
        if (recentTable) {
            recentTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">Loading recent requests...</td>
                </tr>
            `;
        }

        renderQuickLinks();

        try {
            const [assetData, loanData, userData] = await Promise.all([
                fetchJson("/api/assets"),
                fetchJson("/loans"),
                fetchJson("/api/auth/users")
            ]);

            assets = Array.isArray(assetData) ? assetData : [];
            loans = Array.isArray(loanData) ? loanData : [];
            users = Array.isArray(userData) ? userData : [];

            const pendingStaffRequests = updateStats();
            renderRecentRequests(pendingStaffRequests);
        } catch (error) {
            console.error("Failed to load admin dashboard:", error);
            if (recentBody) {
                recentBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">${escapeHtml(error.message)}</td>
                    </tr>
                `;
            }
        }
    }

    loadDashboard();
});
