/**
 * Admin Dashboard - JavaScript
 *
 * This script handles the dynamic loading of dashboard statistics,
 * pending requests, and administrative notifications directly from the database.
 * It ensures that the administrator always has the most up-to-date view of the system.
 */
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = window.location.origin;

    // Elements for statistics cards - Mapping them to the IDs in our HTML
    const statEls = {
        totalAssets: document.getElementById("totalAssetsCount"),
        availableAssets: document.getElementById("availableAssetsCount"),
        pendingRequests: document.getElementById("pendingRequestsCount"),
        totalUsers: document.getElementById("totalUsersCount")
    };

    // Elements for tables, lists and other dynamic sections
    const recentBody = document.getElementById("recent-staff-loans-body");
    const notificationList = document.getElementById("notificationList");
    const notificationCountEl = document.getElementById("notificationCount");
    const featuresGrid = document.getElementById("admin-features-grid");

    // Local state to store fetched data
    let assets = [];
    let loans = [];
    let users = [];
    let pendingUsers = [];

    /**
     * A small helper to safely escape HTML.
     * Keeps our dashboard safe from any unexpected data inputs.
     */
    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Formats dates into a clean, readable string (South African format).
     */
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

    /**
     * Prepares common request headers, including the security token if available.
     */
    function requestHeaders() {
        const headers = { "Content-Type": "application/json" };
        const token = localStorage.getItem("authToken");
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }

    /**
     * A standardized fetch wrapper to handle API communication and errors gracefully.
     */
    async function fetchJson(path) {
        const response = await fetch(`${API_BASE}${path}`, { headers: requestHeaders() });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed with status ${response.status}`);
        }
        return response.json();
    }

    /**
     * recalculates and updates the stats cards at the top of the dashboard.
     */
    function updateStats() {
        // We identify pending loans so we can count them and display them in the table
        const pendingLoans = loans.filter(l => (l.status || "").toUpperCase() === "PENDING");

        // Available assets are those ready for a new loan
        const availableAssets = assets.filter(a => (a.status || "").toUpperCase() === "AVAILABLE");

        // Update the numbers on the UI cards
        if (statEls.totalAssets) statEls.totalAssets.textContent = assets.length;
        if (statEls.availableAssets) statEls.availableAssets.textContent = availableAssets.length;
        if (statEls.pendingRequests) statEls.pendingRequests.textContent = pendingLoans.length;
        if (statEls.totalUsers) statEls.totalUsers.textContent = users.length;

        return pendingLoans;
    }

    /**
     * Renders the 'Recent Pending Loan Requests' table with data from the database.
     */
    function renderRecentRequests(pendingLoans) {
        if (!recentBody) return;

        // We sort by date (newest first) and show the top 5 to keep the dashboard tidy
        const recent = [...pendingLoans]
            .sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0))
            .slice(0, 5);

        if (recent.length === 0) {
            recentBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: var(--muted);">No pending loan requests at the moment.</td></tr>`;
            return;
        }

        recentBody.innerHTML = recent.map(loan => `
            <tr>
                <td>
                    <strong>${escapeHtml(loan.userName)}</strong>
                    <div style="font-size: 0.75rem; color: var(--muted);">${escapeHtml(loan.userDepartment || "Staff Member")}</div>
                </td>
                <td>${escapeHtml(loan.assetName)}</td>
                <td>${formatDate(loan.requestDate)}</td>
                <td><span class="status proposal">Pending</span></td>
                <td>
                    <a class="review-link" href="admin-loan-requests.html">Review</a>
                </td>
            </tr>
        `).join("");
    }

    /**
     * Populates the notifications card with actionable alerts for the admin.
     */
    function renderNotifications(pendingLoans, pendingUsers) {
        if (!notificationList) return;

        const notifications = [];

        // Alert for pending loan requests
        if (pendingLoans.length > 0) {
            notifications.push({
                icon: "fa-hand-holding",
                text: `You have ${pendingLoans.length} loan request(s) waiting for approval.`,
                link: "admin-loan-requests.html"
            });
        }

        // Alert for new user sign-ups
        if (pendingUsers.length > 0) {
            notifications.push({
                icon: "fa-user-plus",
                text: `There are ${pendingUsers.length} new user(s) awaiting registration approval.`,
                link: "users.html"
            });
        }

        // Alert for overdue loans - essential for asset tracking
        const today = new Date();
        const overdueCount = loans.filter(l =>
            (l.status || "").toUpperCase() === "APPROVED" &&
            l.dueDate && new Date(l.dueDate) < today
        ).length;

        if (overdueCount > 0) {
            notifications.push({
                icon: "fa-clock",
                text: `Attention: ${overdueCount} loan(s) are currently past their due date.`,
                link: "admin-report.html"
            });
        }

        // Update the notification badge count
        if (notificationCountEl) notificationCountEl.textContent = notifications.length;

        if (notifications.length === 0) {
            notificationList.innerHTML = `<li class="empty-state">System is up to date. No new notifications.</li>`;
            return;
        }

        notificationList.innerHTML = notifications.map(notif => `
            <li onclick="window.location.href='${notif.link}'" style="cursor: pointer; display: flex; align-items: center; gap: 10px; padding: 12px; border-bottom: 1px solid #f0f0f0;">
                <i class="fa-solid ${notif.icon}" style="color: var(--primary); width: 20px;"></i>
                <span style="font-size: 0.9rem;">${escapeHtml(notif.text)}</span>
            </li>
        `).join("");
    }

    /**
     * Renders the key administrative features for faster access.
     * We've chosen 4 essential modules that provide both data and navigation.
     */
    function renderAdminFeatures() {
        if (!featuresGrid) return;

        // We prepare 4 core modules that help the admin manage the system efficiently
        const features = [
            {
                title: "User Management",
                desc: `${pendingUsers.length} awaiting approval`,
                icon: "fa-user-check",
                link: "users.html",
                color: "#7C3AED" // Purple for authority
            },
            {
                title: "Asset Inventory",
                desc: `${assets.length} items registered`,
                icon: "fa-boxes-stacked",
                link: "assets-admin.html",
                color: "#3B82F6" // Blue for stability
            },
            {
                title: "Loan Requests",
                desc: `${loans.filter(l => (l.status || "").toUpperCase() === "PENDING").length} pending review`,
                icon: "fa-hand-holding",
                link: "admin-loan-requests.html",
                color: "#10B981" // Green for action
            },
            {
                title: "Reports & Logs",
                desc: "Audit logs & insights",
                icon: "fa-chart-pie",
                link: "admin-report.html",
                color: "#F59E0B" // Orange for attention
            }
        ];

        // Generate the HTML for our feature cards
        featuresGrid.innerHTML = features.map(feature => `
            <div class="quick-link" onclick="window.location.href='${feature.link}'" style="cursor: pointer; border-left: 4px solid ${feature.color};">
                <div class="quick-link-icon" style="background: ${feature.color}15; color: ${feature.color};">
                    <i class="fa-solid ${feature.icon}"></i>
                </div>
                <div class="quick-link-copy">
                    <strong>${escapeHtml(feature.title)}</strong>
                    <span style="font-size: 0.75rem;">${escapeHtml(feature.desc)}</span>
                </div>
            </div>
        `).join("");
    }

    /**
     * The main engine of our dashboard. Fetches all necessary data from the database
     * and triggers the UI updates.
     */
    async function loadDashboard() {
        // Show a loading state if needed
        if (recentBody) recentBody.innerHTML = `<tr><td colspan="5" class="empty-state">Synchronizing with database...</td></tr>`;

        try {
            // We fetch everything in parallel to ensure a snappy user experience
            const [assetData, loanData, userData, pendingUserData] = await Promise.all([
                fetchJson("/api/assets"),
                fetchJson("/loans"),
                fetchJson("/api/auth/users"),
                fetchJson("/api/auth/pending")
            ]);

            assets = Array.isArray(assetData) ? assetData : [];
            loans = Array.isArray(loanData) ? loanData : [];
            users = Array.isArray(userData) ? userData : [];
            pendingUsers = Array.isArray(pendingUserData) ? pendingUserData : [];

            // Trigger UI updates with the fresh data
            const pendingLoans = updateStats();
            renderRecentRequests(pendingLoans);
            renderNotifications(pendingLoans, pendingUsers);
            renderAdminFeatures();

        } catch (error) {
            console.error("Dashboard synchronization failed:", error);
            if (recentBody) {
                recentBody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color: #d9534f;">Failed to load data. Please check your connection.</td></tr>`;
            }
        }
    }

    // Start the dashboard loading process
    loadDashboard();
});
