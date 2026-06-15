document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("audit-log-form");
    const refreshBtn = document.getElementById("refresh-btn");
    const message = document.getElementById("form-message");
    const tableBody = document.getElementById("audit-log-table-body");
    const totalCount = document.getElementById("total-count");
    const assetCount = document.getElementById("asset-count");
    const loanCount = document.getElementById("loan-count");

    const apiUrl = "/api/audit-logs";

    const renderLogs = (logs) => {
        totalCount.textContent = logs.length;
        assetCount.textContent = logs.filter((log) => log.entityType === "ASSET").length;
        loanCount.textContent = logs.filter((log) => log.entityType === "LOAN").length;

        if (!logs.length) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No audit logs found.</td></tr>';
            return;
        }

        tableBody.innerHTML = logs.map((log) => `
            <tr>
                <td>${log.logId ?? "-"}</td>
                <td>${log.userId ?? "-"}</td>
                <td>${log.entityType ?? "-"} #${log.entityId ?? "-"}</td>
                <td><span class="pill action-${(log.action || "").toLowerCase()}">${formatAction(log.action)}</span></td>
                <td>${formatTimestamp(log.timestamp)}</td>
            </tr>
        `).join("");
    };

    const formatAction = (action) => {
        if (!action) {
            return "-";
        }

        return action
            .toLowerCase()
            .split("_")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("-");
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) {
            return "-";
        }

        return new Date(timestamp).toLocaleString();
    };

    const loadLogs = async () => {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading audit logs...</td></tr>';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const logs = await response.json();
            renderLogs(logs);
            message.textContent = `Loaded ${logs.length} audit log entries.`;
            message.className = "message success";
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Unable to load audit logs.</td></tr>';
            message.textContent = error.message;
            message.className = "message error";
        }
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const payload = {
            userId: Number(document.getElementById("userId").value),
            entityType: document.getElementById("entityType").value,
            entityId: Number(document.getElementById("entityId").value),
            action: document.getElementById("action").value
        };

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Save failed with status ${response.status}`);
            }

            form.reset();
            await loadLogs();
            message.textContent = "Audit log saved successfully.";
            message.className = "message success";
        } catch (error) {
            message.textContent = error.message;
            message.className = "message error";
        }
    });

    refreshBtn.addEventListener("click", loadLogs);

    loadLogs();
});