document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loanRequestForm");
    const alertBox = document.getElementById("loanAlert");

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

    async function updatePendingRequestsBadge() {
        const badge = document.getElementById("loanRequestsBadge");
        if (!badge || !currentUser?.id) return;

        try {
            const response = await fetch(`/loans/user/${encodeURIComponent(currentUser.id)}`);
            if (!response.ok) return;

            const loans = await response.json();
            const pendingCount = loans.filter(loan =>
                String(loan.status || "").toUpperCase() === "PENDING"
            ).length;

            badge.textContent = pendingCount;
        } catch (error) {
            console.error("Could not update pending requests badge", error);
        }
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

        await updatePendingRequestsBadge();
    }

    function fillAssetDetails(asset) {
        selectedAsset = asset;

        fields.assetId.value = asset.assetId || "";
        fields.assetCategory.value = asset.category || "";
        fields.dueDate.min = toDateInputValue(new Date());
        fields.dueDate.value = getDefaultReturnDate();

        // Location normalization for old data (Boardroom/Finance)
        let displayLocation = asset.location || "Unknown";
        if (displayLocation === "Boardroom" || displayLocation.includes("Finance")) {
            displayLocation = "Johannesburg";
        }

        preview.title.textContent = asset.title || "Untitled Asset";
        preview.location.textContent = displayLocation;
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
        } catch (error) {
            showMessage(error.message);
        }
    }

    async function startPage() {
        await fillUserDetails();
        await loadSelectedAsset();
        form.addEventListener("submit", submitLoanRequest);
    }

    startPage();
});
