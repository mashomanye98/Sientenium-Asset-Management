document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loanRequestForm");
    const alertBox = document.getElementById("loanAlert");
    const loanRequestsBody = document.getElementById("loanRequestsBody");
    const refreshRequestsBtn = document.getElementById("refreshRequestsBtn");

    const fields = {
        assetId: document.getElementById("assetId"),
        assetCategory: document.getElementById("assetCategory"),
        userId: document.getElementById("userId"),
        userName: document.getElementById("userName"),
        department: document.getElementById("department"),
        dueDate: document.getElementById("dueDate"),
        notes: document.getElementById("notes")
    };

    const preview = {
        imageWrapper: document.getElementById("assetImageWrapper"),
        title: document.getElementById("assetTitle"),
        location: document.getElementById("assetLocation"),
        condition: document.getElementById("assetCondition"),
        cost: document.getElementById("assetCost"),
        status: document.getElementById("assetStatus")
    };

    let selectedAsset = null;
    let currentUser = null;
    let userLoans = [];

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function cleanStatus(status) {
        return String(status || "UNKNOWN").toUpperCase();
    }

    function statusLabel(status) {
        if (status === "APPROVED") return "Active";
        return status.charAt(0) + status.slice(1).toLowerCase();
    }

    function statusClass(status) {
        return `status status-${status.toLowerCase()}`;
    }

    function formatDate(value) {
        if (!value) return "N/A";

        return new Date(value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    async function updatePendingRequestsBadge() {
        const badge = document.getElementById("loanRequestsBadge");
        if (!badge) return;

        const pendingCount = userLoans.filter(loan => cleanStatus(loan.status) === "PENDING").length;
        badge.textContent = pendingCount;
    }

    function showMessage(message, type = "error") {
        alertBox.textContent = message;
        alertBox.className = `alert ${type}`;
        alertBox.style.display = "block";
    }

    function hideMessage() {
        alertBox.style.display = "none";
    }

    function getAssetIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get("assetId");
    }

    function getCurrentUser() {
        try {
            return JSON.parse(sessionStorage.getItem("currentUser")) || {};
        } catch (error) {
            return {};
        }
    }

    function getStoredAsset(assetId) {
        try {
            const asset = JSON.parse(sessionStorage.getItem("selectedLoanAsset"));
            return String(asset?.assetId) === String(assetId) ? asset : null;
        } catch (error) {
            return null;
        }
    }

    function formatMoney(value) {
        const amount = Number(value || 0);
        return new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR"
        }).format(amount);
    }

    function toDateInputValue(date) {
        return date.toISOString().split("T")[0];
    }

    function getDefaultReturnDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return toDateInputValue(date);
    }

    function getImageUrl(photoPath) {
        if (!photoPath) return null;
        if (photoPath.startsWith("/") || photoPath.startsWith("http")) {
            return photoPath;
        }
        return `/uploads/${photoPath}`;
    }

    function fillDepartment(department) {
        fields.department.innerHTML = "";

        const option = document.createElement("option");
        option.value = department || "";
        option.textContent = department || "Not provided";
        option.selected = true;

        fields.department.appendChild(option);
    }

    async function findUserFromEmail(email) {
        if (!email) return null;

        const response = await fetch("/api/auth/users");
        if (!response.ok) return null;

        const users = await response.json();
        return users.find(user => user.email === email) || null;
    }

    function renderLoanRequestsTable() {
        if (!loanRequestsBody) return;

        if (!currentUser?.id) {
            loanRequestsBody.innerHTML = '<tr><td colspan="5" class="empty-state">Please sign in again to view your loan requests.</td></tr>';
            return;
        }

        if (!userLoans.length) {
            loanRequestsBody.innerHTML = '<tr><td colspan="5" class="empty-state">No loan requests submitted yet.</td></tr>';
            return;
        }

        const sortedLoans = [...userLoans].sort((a, b) => new Date(b.requestDate || 0) - new Date(a.requestDate || 0));

        loanRequestsBody.innerHTML = sortedLoans.map(loan => {
            const status = cleanStatus(loan.status);

            return `
                <tr>
                    <td>
                        <strong>${escapeHtml(loan.assetName || "N/A")}</strong>
                        <div class="muted-text">Loan ID: ${escapeHtml(loan.loanId || "N/A")}</div>
                    </td>
                    <td>${escapeHtml(loan.assetCategory || "N/A")}</td>
                    <td>${formatDate(loan.requestDate)}</td>
                    <td>${formatDate(loan.dueDate)}</td>
                    <td><span class="${statusClass(status)}">${escapeHtml(statusLabel(status))}</span></td>
                </tr>
            `;
        }).join("");
    }

    async function loadUserLoanRequests() {
        if (!loanRequestsBody || !currentUser?.id) {
            renderLoanRequestsTable();
            return;
        }

        loanRequestsBody.innerHTML = '<tr><td colspan="5" class="empty-state">Loading loan requests...</td></tr>';

        try {
            const response = await fetch(`/loans/user/${encodeURIComponent(currentUser.id)}`);
            if (!response.ok) {
                throw new Error("Could not load your loan requests.");
            }

            userLoans = await response.json();
            renderLoanRequestsTable();
            await updatePendingRequestsBadge();
        } catch (error) {
            console.error(error);
            loanRequestsBody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(error.message)}</td></tr>`;
        }
    }

    async function fillUserDetails() {
        currentUser = getCurrentUser();

        if (!currentUser.id && currentUser.email) {
            // Older sessions may only have email and role, so look up the rest.
            const savedUser = await findUserFromEmail(currentUser.email);
            if (savedUser) {
                currentUser = { ...currentUser, ...savedUser };
                sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
        }

        fields.userId.value = currentUser.id || "";
        fields.userName.value = currentUser.fullName || currentUser.email || "";
        fillDepartment(currentUser.department);

        const profileName = document.getElementById("profileName");
        if (profileName && currentUser.fullName) {
            profileName.textContent = currentUser.fullName;
        }

        await loadUserLoanRequests();
    }

    function fillAssetDetails(asset) {
        selectedAsset = asset;

        fields.assetId.value = asset.assetId || "";
        fields.assetCategory.value = asset.category || "";
        fields.dueDate.min = toDateInputValue(new Date());
        fields.dueDate.value = getDefaultReturnDate();

        preview.title.textContent = asset.title || "Untitled Asset";
        preview.location.textContent = asset.location || "Unknown";
        preview.condition.textContent = asset.condition || "Unknown";
        preview.cost.textContent = formatMoney(asset.cost);
        preview.status.textContent = asset.status || "Unknown";

        const imageUrl = getImageUrl(asset.photoPath);
        if (imageUrl) {
            preview.imageWrapper.innerHTML = `<img src="${imageUrl}" alt="${asset.title || "Asset"}">`;
        }
    }

    async function fetchAsset(assetId) {
        const response = await fetch(`/api/assets/${encodeURIComponent(assetId)}`);
        if (!response.ok) {
            throw new Error("Unable to load the selected asset.");
        }
        return response.json();
    }

    async function loadSelectedAsset() {
        const assetId = getAssetIdFromUrl();
        if (!assetId) {
            showMessage("No asset was selected. Please choose an asset first.");
            return;
        }

        const storedAsset = getStoredAsset(assetId);
        if (storedAsset) {
            fillAssetDetails(storedAsset);
            return;
        }

        try {
            const asset = await fetchAsset(assetId);
            fillAssetDetails(asset);
        } catch (error) {
            showMessage(error.message);
        }
    }

    function buildLoanRequest() {
        const userId = Number(currentUser?.id);
        const assetId = Number(selectedAsset?.assetId || fields.assetId.value);

        if (!assetId) {
            throw new Error("Asset ID is missing.");
        }

        if (!userId) {
            throw new Error("User details are missing. Please sign in again.");
        }

        if (!fields.dueDate.value) {
            throw new Error("Please select the return date.");
        }

        // The backend expects a date-time value, so keep the chosen day and add a time.
        return {
            assetId,
            userId,
            requestDate: new Date().toISOString(),
            dueDate: `${fields.dueDate.value}T00:00:00`,
            status: "PENDING"
        };
    }

    async function submitLoanRequest(event) {
        event.preventDefault();
        hideMessage();

        try {
            const response = await fetch("/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildLoanRequest())
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.message || "Unable to submit the loan request.");
            }

            showMessage("Loan request submitted successfully.", "success");
            sessionStorage.removeItem("selectedLoanAsset");
            fields.notes.value = "";
            fields.dueDate.value = getDefaultReturnDate();
            await loadUserLoanRequests();
        } catch (error) {
            showMessage(error.message);
        }
    }

    async function startPage() {
        await fillUserDetails();
        await loadSelectedAsset();
        form.addEventListener("submit", submitLoanRequest);
        refreshRequestsBtn?.addEventListener("click", loadUserLoanRequests);
    }

    startPage();
});
