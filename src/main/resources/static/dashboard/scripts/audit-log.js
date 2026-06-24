const API = {
    auditLogs: "/api/audit-logs",
    users: "/api/auth/users",
    assets: "/api/assets",
    loans: "/api/loans"
};

let allLogs = [];
let userMap = {};
let assetMap = {};
let loanMap = {};

function normalizeList(data, keys) {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (data && Array.isArray(data[key])) return data[key];
    }

    return [];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getUserName(userId) {
    if (userId === 0) return "System";
    if (!userId) return "Unknown User";
    return userMap[userId] || `User #${userId}`;
}

function getEntityName(log) {
    const entityType = (log.entityType || "").toUpperCase();
    const entityId = log.entityId;

    if (!entityId) return "-";
    if (entityType === "ASSET") return assetMap[entityId] || `Asset #${entityId}`;
    if (entityType === "USER") return userMap[entityId] || `User #${entityId}`;
    if (entityType === "LOAN") return `Loan #${entityId}`;

    return `#${entityId}`;
}

function getLoanAssetTitle(loanId) {
    const loan = loanMap[loanId];
    if (!loan) return null;

    if (loan.assetName) return loan.assetName;
    if (loan.assetId && assetMap[loan.assetId]) return assetMap[loan.assetId];
    if (loan.assetId) return `Asset #${loan.assetId}`;

    return null;
}

function describe(log) {
    const entity = (log.entityType || "").toUpperCase();
    const action = (log.action || "").toUpperCase();
    const userName = escapeHtml(getUserName(log.userId));
    const entityName = escapeHtml(getEntityName(log));
    const loanAssetTitle = getLoanAssetTitle(log.entityId);
    const loanAssetText = loanAssetTitle ? ` for <span class="highlight">${escapeHtml(loanAssetTitle)}</span>` : "";
    const loanAssetName = loanAssetTitle ? `<span class="highlight">${escapeHtml(loanAssetTitle)}</span>` : "the asset";

    const map = {
        "ASSET:CREATE": `<span class="highlight">${userName}</span> created ${entityName}`,
        "ASSET:UPDATE": `<span class="highlight">${userName}</span> updated ${entityName}`,
        "ASSET:DELETE": `<span class="highlight">${userName}</span> permanently deleted ${entityName}`,
        "ASSET:RETIRE": `<span class="highlight">${userName}</span> retired ${entityName}`,
        "ASSET:CHECK_OUT": `<span class="highlight">${userName}</span> checked out ${entityName}`,
        "ASSET:CHECK_IN": `<span class="highlight">${userName}</span> returned ${entityName} to inventory`,
        "LOAN:REQUEST": `<span class="highlight">${userName}</span> submitted ${entityName}${loanAssetText}`,
        "LOAN:APPROVE": `${entityName}${loanAssetText} was <span class="highlight">approved</span>`,
        "LOAN:REJECT": `${entityName}${loanAssetText} was <span class="highlight">rejected</span>`,
        "LOAN:CHECK_IN": `<span class="highlight">${userName}</span> returned ${loanAssetName} on ${entityName}`,
        "LOAN:DELETE": `<span class="highlight">${userName}</span> deleted ${entityName}${loanAssetText} from the system`,
        "USER:CREATE": `<span class="highlight">${entityName}</span> was registered directly into the system`,
        "USER:REQUEST": "A new user submitted a registration request",
        "USER:APPROVE": `<span class="highlight">${entityName}</span> registration was approved`,
        "USER:REJECT": "A registration request was rejected",
        "USER:UPDATE": `<span class="highlight">${entityName}</span> profile was updated`,
        "USER:DEACTIVATE": `<span class="highlight">${entityName}</span> account was deactivated`
    };

    return map[`${entity}:${action}`] || `${userName} performed ${escapeHtml(action)} on ${escapeHtml(entity)} ${entityName}`;
}

function badge(action) {
    const normalized = (action || "").toLowerCase();
    const labels = {
        create: "Create",
        update: "Update",
        delete: "Delete",
        approve: "Approve",
        reject: "Reject",
        request: "Request",
        retire: "Retire",
        check_out: "Check Out",
        check_in: "Check In",
        deactivate: "Deactivate"
    };

    return `<span class="badge badge-${escapeHtml(normalized)}"><span class="badge-dot"></span>${escapeHtml(labels[normalized] || action || "-")}</span>`;
}

function fmtDate(timestamp) {
    if (!timestamp) return '<span style="color:var(--text-tertiary)">-</span>';

    const dateTime = new Date(timestamp);
    const date = dateTime.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
    const time = dateTime.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return `<div class="time-cell"><span class="time-date">${date}</span><span class="time-time">${time}</span></div>`;
}

function renderUserCell(log) {
    const userName = getUserName(log.userId);

    if (log.userId === 0) {
        return '<span class="system-badge">System / Registrant</span>';
    }

    const initial = userName.charAt(0).toUpperCase() || "?";

    return `<div class="user-cell">
        <div class="user-avatar">${escapeHtml(initial)}</div>
        <span class="user-id">${escapeHtml(userName)}</span>
    </div>`;
}

function renderEntityCell(log) {
    const entityType = log.entityType || "-";
    const entityName = getEntityName(log);

    return `<div class="entity-cell">
        <span class="entity-type">${escapeHtml(entityType)}</span>
        <span class="entity-id">${escapeHtml(entityName)}</span>
    </div>`;
}

function renderTable() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const entity = document.getElementById("entityFilter").value;
    const action = document.getElementById("actionFilter").value;

    const filtered = allLogs.filter(log => {
        const userName = getUserName(log.userId).toLowerCase();
        const entityName = getEntityName(log).toLowerCase();
        const matchesSearch = !search ||
            String(log.userId || "").includes(search) ||
            String(log.entityId || "").includes(search) ||
            userName.includes(search) ||
            entityName.includes(search) ||
            (log.entityType || "").toLowerCase().includes(search) ||
            (log.action || "").toLowerCase().includes(search);
        const matchesEntity = !entity || (log.entityType || "").toUpperCase() === entity;
        const matchesAction = !action || (log.action || "").toUpperCase() === action;

        return matchesSearch && matchesEntity && matchesAction;
    });

    document.getElementById("recordCount").textContent = `${filtered.length} records`;

    const tbody = document.getElementById("logBody");
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>No audit log entries match the current filters.</div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(log => `
        <tr>
            <td class="mono" style="color:var(--text-tertiary)">#${escapeHtml(log.logId)}</td>
            <td>${renderUserCell(log)}</td>
            <td>${badge(log.action)}</td>
            <td class="description-cell">${describe(log)}</td>
            <td>${renderEntityCell(log)}</td>
            <td>${fmtDate(log.timestamp)}</td>
        </tr>
    `).join("");
}

function exportCSV() {
    const headers = ["Log ID", "User", "Entity Type", "Entity", "Action", "Description", "Timestamp"];
    const rows = allLogs.map(log => [
        log.logId,
        getUserName(log.userId),
        log.entityType,
        getEntityName(log),
        log.action,
        describe(log).replace(/<[^>]+>/g, ""),
        log.timestamp
    ]);

    const csv = [headers, ...rows]
        .map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

async function fetchUsers() {
    userMap = {};

    const response = await fetch(API.users);
    if (!response.ok) throw new Error(`Users API returned ${response.status}`);

    const users = normalizeList(await response.json(), ["data", "users", "content"]);
    users.forEach(user => {
        const id = user.id || user.userId || user.user_id;
        if (!id) return;

        userMap[id] = user.fullName || user.name || user.username || user.userName || user.email || `User #${id}`;
    });
}

async function fetchAssets() {
    assetMap = {};

    const response = await fetch(API.assets);
    if (!response.ok) throw new Error(`Assets API returned ${response.status}`);

    const assets = normalizeList(await response.json(), ["data", "assets", "content"]);
    assets.forEach(asset => {
        const id = asset.assetId || asset.id;
        if (!id) return;

        assetMap[id] = asset.title || asset.name || `Asset #${id}`;
    });
}

async function fetchLoans() {
    loanMap = {};

    const response = await fetch(API.loans);
    if (!response.ok) throw new Error(`Loans API returned ${response.status}`);

    const loans = normalizeList(await response.json(), ["data", "loans", "content"]);
    loans.forEach(loan => {
        const id = loan.loanId || loan.id;
        if (!id) return;

        loanMap[id] = loan;
    });
}

async function loadLogs() {
    const dot = document.getElementById("apiDot");
    const label = document.getElementById("apiLabel");

    dot.className = "api-dot";
    label.textContent = "Loading...";
    document.getElementById("logBody").innerHTML = '<tr><td colspan="6" class="empty-state">Loading audit logs...</td></tr>';

    try {
        const [logsResponse, usersResult, assetsResult, loansResult] = await Promise.all([
            fetch(API.auditLogs),
            fetchUsers().catch(error => error),
            fetchAssets().catch(error => error),
            fetchLoans().catch(error => error)
        ]);

        if (!logsResponse.ok) throw new Error(`Audit logs API returned ${logsResponse.status}`);
        if (usersResult instanceof Error) console.warn("Could not load users for audit log display:", usersResult);
        if (assetsResult instanceof Error) console.warn("Could not load assets for audit log display:", assetsResult);
        if (loansResult instanceof Error) console.warn("Could not load loans for audit log display:", loansResult);

        allLogs = normalizeList(await logsResponse.json(), ["data", "logs", "content"]);
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        renderTable();
        dot.className = "api-dot live";
        label.textContent = `Loaded ${allLogs.length} logs at ${new Date().toLocaleTimeString()}`;
    } catch (error) {
        console.error("Error loading audit logs:", error);
        dot.className = "api-dot error";
        label.textContent = "API error";
        document.getElementById("recordCount").textContent = "0 records";
        document.getElementById("logBody").innerHTML = `
            <tr><td colspan="6" class="empty-state">
                <div style="color:#A32D2D;margin-bottom:8px;">Could not load audit logs</div>
                <div style="font-size:12px;color:var(--text-secondary);">${escapeHtml(error.message)}</div>
                <button onclick="loadLogs()" style="margin-top:16px;">Retry Connection</button>
            </td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", loadLogs);

window.loadLogs = loadLogs;
window.exportCSV = exportCSV;
window.renderTable = renderTable;
