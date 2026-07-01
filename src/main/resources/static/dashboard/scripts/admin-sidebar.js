(function () {
    const NAV_ITEMS = [
        { page: "dashboard", href: "/dashboard/admin/admin-dashboard.html", icon: "fa-house", label: "Dashboard" },
        { page: "assets", href: "/dashboard/admin/assets-admin.html", icon: "fa-boxes-stacked", label: "Assets" },
        { page: "users", href: "/dashboard/admin/users.html", icon: "fa-users", label: "Users" },
        { page: "loan-requests", href: "/dashboard/admin/admin-loan-requests.html", icon: "fa-hand-holding", label: "Loan Requests" },
        { page: "retire-assets", href: "/dashboard/admin/admin-retire-assets.html", icon: "fa-box-archive", label: "Retire Assets" },
        { page: "reports", href: "/dashboard/admin/admin-report.html", icon: "fa-chart-line", label: "Reports & Insights" },
        { page: "audit-log", href: "/dashboard/admin/audit-log.html", icon: "fa-clock-rotate-left", label: "Audit Logs" }
    ];

    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem("currentUser")) || {};
        } catch (error) {
            return {};
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function getPageKey() {
        const dataPage = document.body?.dataset?.adminPage;
        if (dataPage) {
            return dataPage;
        }

        const path = window.location.pathname.toLowerCase();
        const match = NAV_ITEMS.find(item => path.endsWith(item.href.toLowerCase()));
        return match ? match.page : "dashboard";
    }

    function renderSidebar(container) {
        const currentUser = getCurrentUser();
        const pageKey = getPageKey();
        const userName = currentUser.fullName || localStorage.getItem("userName") || "System Administrator";

        container.innerHTML = `
            <div>
                <div class="profile">
                    <div class="profile-image">
                    <img src="../../images/SeinteniumPageLogo.png" alt="Profile">
                </div>
                    <h3>${escapeHtml(userName)}</h3>
                    <span>ADMIN</span>
                </div>

                <nav>
                    ${NAV_ITEMS.map(item => `
                        <a href="${item.href}" data-admin-page="${item.page}" class="${item.page === pageKey ? "active" : ""}">
                            <i class="fa-solid ${item.icon}"></i>
                            ${item.label}
                        </a>
                    `).join("")}
                </nav>
            </div>

            <button type="button" class="logout-btn" data-admin-logout>
                <i class="fa-solid fa-right-from-bracket"></i>
                Logout
            </button>
        `;
    }

    function bindLogout(container) {
        const logoutBtn = container.querySelector("[data-admin-logout]");
        if (!logoutBtn) {
            return;
        }

        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("currentUser");
            localStorage.removeItem("authToken");
            localStorage.removeItem("userName");
            window.location.href = "/logout";
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const placeholders = document.querySelectorAll("[data-admin-sidebar]");
        if (!placeholders.length) {
            return;
        }

        placeholders.forEach(container => {
            renderSidebar(container);
            bindLogout(container);
        });
    });
})();
