// Page script for the admin users page.
// Displays pending signup requests and approved users, with edit and deactivate actions.
document.addEventListener("DOMContentLoaded", () => {
    const pendingTableBody = document.querySelector("#pendingRequests tbody");
    const activeTableBody = document.querySelector("#activeUsers tbody");
    const alertContainer = document.getElementById("alertContainer");
    const API_BASE = window.location.origin;

    function showAlert(message, type = "success") {
        alertContainer.innerHTML = `<div class="alert ${type}">${message}</div>`;
        setTimeout(() => alertContainer.innerHTML = "", 5000);
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatRole(role) {
        return escapeHtml(String(role ?? "ROLE_STAFF").replace("ROLE_", ""));
    }

    function formatDate(value) {
        if (!value) {
            return "N/A";
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleString();
    }

    async function readJson(response) {
        const text = await response.text();
        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error("The server returned an invalid response.");
        }
    }

    async function requestJson(path, options = {}) {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const body = await readJson(response);

        if (!response.ok) {
            throw new Error(body?.message || `Request failed with status ${response.status}.`);
        }

        return body;
    }

    async function fetchPendingRequests() {
        return requestJson("/api/auth/pending");
    }

    async function fetchActiveUsers() {
        return requestJson("/api/auth/users");
    }

    function renderPendingRequests(requests) {
        const safeRequests = Array.isArray(requests) ? requests : [];

        if (!safeRequests.length) {
            pendingTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">No pending account requests at the moment.</td></tr>`;
            return;
        }

        pendingTableBody.innerHTML = safeRequests.map((request) => `
            <tr>
                <td>${escapeHtml(request.fullName)}</td>
                <td>${escapeHtml(request.email)}</td>
                <td>${escapeHtml(request.department)}</td>
                <td>${formatRole(request.role)}</td>
                <td><span class="status proposal">${escapeHtml(request.status ?? "PENDING")}</span></td>
                <td>${formatDate(request.requestedAt)}</td>
                <td>
                    <button class="action-btn approve-btn" data-id="${escapeHtml(request.id)}" data-action="approve">Approve</button>
                    <button class="action-btn reject-btn" data-id="${escapeHtml(request.id)}" data-action="reject">Reject</button>
                </td>
            </tr>
        `).join("");
    }

    function renderActiveUsers(users) {
        const safeUsers = Array.isArray(users) ? users : [];

        if (!safeUsers.length) {
            activeTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">No approved users yet.</td></tr>`;
            return;
        }

        activeTableBody.innerHTML = safeUsers.map((user) => `
            <tr>
                <td>${escapeHtml(user.fullName)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.department)}</td>
                <td>${formatRole(user.role)}</td>
                <td>${user.active ? "Active" : "Inactive"}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${escapeHtml(user.id)}">Edit</button>
                    <button class="action-btn deactivate-btn" data-id="${escapeHtml(user.id)}">Deactivate</button>
                </td>
            </tr>
        `).join("");
    }

    async function loadPendingRequests() {
        try {
            pendingTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">Loading pending requests...</td></tr>`;
            const pendingRequests = await fetchPendingRequests();
            renderPendingRequests(pendingRequests);
        } catch (error) {
            showAlert(error.message, "error");
            pendingTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    async function loadActiveUsers() {
        try {
            activeTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Loading approved users...</td></tr>`;
            const activeUsers = await fetchActiveUsers();
            renderActiveUsers(activeUsers);
        } catch (error) {
            showAlert(error.message, "error");
            activeTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    async function loadData() {
        await Promise.all([
            loadPendingRequests(),
            loadActiveUsers()
        ]);
    }

    async function updateRequest(requestId, action, button) {
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = "Processing...";

        try {
            const response = await fetch(`${API_BASE}/api/auth/pending/${requestId}/${action}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" }
            });
            const result = await readJson(response);
            if (!response.ok) {
                throw new Error(result?.message || `Unable to ${action} the request.`);
            }

            showAlert(`Request ${action}ed successfully.`);
            await loadData();
        } catch (error) {
            showAlert(error.message, "error");
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    function normalizeRole(input) {
        if (!input) {
            return null;
        }
        const roleValue = input.trim().toUpperCase();
        if (roleValue.startsWith("ROLE_")) {
            return roleValue;
        }
        if (roleValue.includes("ADMIN")) {
            return "ROLE_ADMIN";
        }
        if (roleValue.includes("MANAGER")) {
            return "ROLE_MANAGER";
        }
        return "ROLE_STAFF";
    }

    async function editUser(userId, currentUser) {
        const fullName = prompt("Full Name:", currentUser.fullName);
        if (fullName === null) return;

        const email = prompt("Email:", currentUser.email);
        if (email === null) return;

        const department = prompt("Department:", currentUser.department);
        if (department === null) return;

        const roleInput = prompt("Role (Admin, Manager, Staff):", currentUser.role.replace("ROLE_", ""));
        if (roleInput === null) return;

        const role = normalizeRole(roleInput);
        if (!role) {
            showAlert("Invalid role provided.", "error");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    department: department.trim(),
                    role
                })
            });
            const result = await readJson(response);
            if (!response.ok) {
                throw new Error(result?.message || "Unable to update user.");
            }
            showAlert("User updated successfully.");
            await loadData();
        } catch (error) {
            showAlert(error.message, "error");
        }
    }

    async function deactivateUser(userId) {
        if (!confirm("Are you sure you want to deactivate this user?")) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            if (!response.ok) {
                const result = await readJson(response);
                throw new Error(result?.message || "Unable to deactivate user.");
            }
            showAlert("User deactivated successfully.");
            await loadData();
        } catch (error) {
            showAlert(error.message, "error");
        }
    }

    pendingTableBody.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const requestId = button.dataset.id;
        const action = button.dataset.action;
        updateRequest(requestId, action, button);
    });

    activeTableBody.addEventListener("click", (event) => {
        const editButton = event.target.closest("button.edit-btn");
        const deactivateButton = event.target.closest("button.deactivate-btn");

        if (editButton) {
            const userId = editButton.dataset.id;
            const row = editButton.closest("tr");
            const currentUser = {
                fullName: row.children[0].textContent,
                email: row.children[1].textContent,
                department: row.children[2].textContent,
                role: `ROLE_${row.children[3].textContent.toUpperCase()}`
            };
            editUser(userId, currentUser);
            return;
        }

        if (deactivateButton) {
            const userId = deactivateButton.dataset.id;
            deactivateUser(userId);
        }
    });

    loadData();
});
