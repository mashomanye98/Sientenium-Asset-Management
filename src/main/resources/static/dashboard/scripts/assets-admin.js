document.addEventListener("DOMContentLoaded", () => {
    const apiBase = "/api/assets";

    const assetTableBody = document.getElementById("assetTableBody");
    const createAssetBtn = document.getElementById("createAssetBtn");
    const seedAssetsBtn = document.getElementById("seedAssetsBtn");
    const searchInput = document.getElementById("searchInput");
    const alertContainer = document.getElementById("alertContainer");

    const assetModal = document.getElementById("assetModal");
    const modalTitle = document.getElementById("modalTitle");
    const closeModalIcon = document.getElementById("closeModalIcon");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const saveAssetBtn = document.getElementById("saveAssetBtn");

    const deleteModal = document.getElementById("deleteModal");
    const closeDeleteIcon = document.getElementById("closeDeleteIcon");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const deleteMessage = document.getElementById("deleteMessage");

    const assetForm = document.getElementById("assetForm");
    const assetIdField = document.getElementById("assetIdField");
    const assetName = document.getElementById("assetName");
    const assetCategory = document.getElementById("assetCategory");
    const assetSerialNumber = document.getElementById("assetSerialNumber");
    const assetAcquisitionDate = document.getElementById("assetAcquisitionDate");
    const assetCost = document.getElementById("assetCost");
    const assetLocation = document.getElementById("assetLocation");
    const assetCondition = document.getElementById("assetCondition");
    const assetPhotoPath = document.getElementById("assetPhotoPath");
    const assetPhotoPreview = document.getElementById("assetPhotoPreview");
    const photoPreviewContainer = document.getElementById("photoPreviewContainer");
    const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
    const assetPhotoFile = document.getElementById("assetPhotoFile");
    const uploadPhotoName = document.getElementById("uploadPhotoName");

    const totalAssetsCount = document.getElementById("totalAssetsCount");
    const availableCount = document.getElementById("availableCount");
    const inUseCount = document.getElementById("inUseCount");
    const maintenanceCount = document.getElementById("maintenanceCount");

    let assets = [];
    let assetToDeleteId = null;

    const sampleAssets = [
        {
            title: "ACER PROJECTOR X1120",
            category: "IT_EQUIPMENT",
            serialNumber: "SN-PH-001",
            acquisitionDate: "2024-06-01",
            cost: 8500.00,
            location: "IT",
            condition: "NEW",
            photoPath: "https://www.makro.co.za/asset/rukmini/fccp/832/832/ng-fkpublic-ui-user-fbbe/projector/e/k/j/-original-imahd2h7vyrnm6dh.jpeg?q=70"
        },
        {
            title: "Dell Latitude 5540",
            category: "IT_EQUIPMENT",
            serialNumber: "SN-LT-001",
            acquisitionDate: "2024-01-15",
            cost: 18000.00,
            location: "Logistics",
            condition: "GOOD",
            photoPath: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80"
        },
        {
            title: "HP LaserJet Pro M404",
            category: "IT_EQUIPMENT",
            serialNumber: "SN-PR-001",
            acquisitionDate: "2023-11-10",
            cost: 5500.00,
            location: "HR",
            condition: "GOOD",
            photoPath: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80"
        },
        {
            title: "Lenovo ThinkCentre M70s",
            category: "IT_EQUIPMENT",
            serialNumber: "SN-DT-001",
            acquisitionDate: "2023-08-20",
            cost: 12000.00,
            location: "Finance & Accounting",
            condition: "FAIR",
            photoPath: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=300&q=80"
        },
        {
            title: "Epson EB-X51 Projector",
            category: "IT_EQUIPMENT",
            serialNumber: "SN-PJ-001",
            acquisitionDate: "2024-03-05",
            cost: 9500.00,
            location: "IT",
            condition: "NEW",
            photoPath: "https://www.makro.co.za/asset/rukmini/fccp/300/300/ng-fkpublic-ui-user-fbbe/projector/2/w/u/eb-w51-wxga-3lcd-projector-each-2-wxga-epson-original-imahafedv8gmwzr3.jpeg"
        }
    ];

    function toggleModal(modal, show) {
        if (show) {
            modal.classList.add("active");
        } else {
            modal.classList.remove("active");
        }
    }

    function clearForm() {
        assetIdField.value = "";
        assetForm.reset();
        assetCategory.value = "IT_EQUIPMENT";
        assetCondition.value = "NEW";
        assetPhotoPath.value = "";
        assetPhotoFile.value = "";
        setUploadedPhotoLabel(null, null);
    }

    function setFormDisabled(disabled) {
        assetName.disabled = disabled;
        assetCategory.disabled = disabled;
        assetSerialNumber.disabled = disabled;
        assetAcquisitionDate.disabled = disabled;
        assetCost.disabled = disabled;
        assetLocation.disabled = disabled;
        assetCondition.disabled = disabled;
    }

    function setUploadedPhotoLabel(url, fileName) {
        if (fileName) {
            uploadPhotoName.textContent = fileName;
        } else if (url) {
            uploadPhotoName.textContent = url.split("/").pop();
        } else {
            uploadPhotoName.textContent = "No file selected";
        }

        if (url) {
            assetPhotoPreview.src = url;
            photoPreviewContainer.style.display = "block";
        } else {
            assetPhotoPreview.src = "";
            photoPreviewContainer.style.display = "none";
        }
    }

    async function uploadAssetPhoto(file) {
        const uploadUrl = "/api/upload/photo";
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(uploadUrl, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(body || "Photo upload failed.");
            }

            const data = await response.json();
            const url = data?.photoPath || data?.url || data?.path || (typeof data === "string" ? data : null);

            if (!url) {
                throw new Error("Upload response did not return a path.");
            }

            assetPhotoPath.value = url;
            setUploadedPhotoLabel(url, file.name);
            showAlert("Photo uploaded successfully.");
        } catch (error) {
            showAlert(error.message || "Photo upload failed.", "error");
        }
    }

    function showAlert(message, type = "success") {
        const alert = document.createElement("div");
        alert.className = `alert ${type}`;
        alert.textContent = message;
        alertContainer.appendChild(alert);
        setTimeout(() => alert.remove(), 4000);
    }

    function statusBadgeClass(status) {
        const normalized = status ? status.toLowerCase().replace(/\s+/g, "-") : "unknown";
        switch (normalized) {
            case "available": return "status-available";
            case "in_use":
            case "in-use":
            case "in use": return "status-in-use";
            case "maintenance": return "status-maintenance";
            case "archived": return "status-archived";
            case "retired": return "status-archived";
            default: return "status-archived";
        }
    }

    function renderAssets(list) {
        assetTableBody.innerHTML = "";

        if (!list || list.length === 0) {
            assetTableBody.innerHTML = `
                <tr><td colspan="6" class="empty-state">No assets found. Try creating one.</td></tr>
            `;
            return;
        }

        list.forEach(asset => {
            const row = document.createElement("tr");
            const photoUrl = asset.photoPath || "https://via.placeholder.com/40?text=No+Img";
            row.innerHTML = `
                <td><img src="${photoUrl}" alt="Asset" style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 1px solid #eee;"></td>
                <td>#${asset.assetId}</td>
                <td>${asset.title || "-"}</td>
                <td>${asset.category || "-"}</td>
                <td><span class="status-badge ${statusBadgeClass(asset.status)}">${asset.status || "Unknown"}</span></td>
                <td>
                    <div class="action-icons">
                        <i class="fas fa-eye" title="View" data-action="view" data-id="${asset.assetId}"></i>
                        <i class="fas fa-edit" title="Edit" data-action="edit" data-id="${asset.assetId}"></i>
                        <i class="fas fa-trash-alt" title="Delete" data-action="delete" data-id="${asset.assetId}"></i>
                    </div>
                </td>
            `;
            assetTableBody.appendChild(row);
        });
    }

    function updateStats(list) {
        const total = list.length;
        const available = list.filter(asset => asset.status && asset.status.toLowerCase() === "available").length;
        const inUse = list.filter(asset => asset.status && asset.status.toLowerCase().includes("in")).length;
        const maintenance = list.filter(asset => asset.status && asset.status.toLowerCase() === "maintenance").length;

        totalAssetsCount.textContent = total;
        availableCount.textContent = available;
        inUseCount.textContent = inUse;
        maintenanceCount.textContent = maintenance;
    }

    function filterAssets(query) {
        if (!query) {
            renderAssets(assets);
            updateStats(assets);
            return;
        }

        const normalizedQuery = query.toLowerCase();
        const filtered = assets.filter(asset => {
            return String(asset.assetId).includes(normalizedQuery) ||
                (asset.title && asset.title.toLowerCase().includes(normalizedQuery)) ||
                (asset.serialNumber && asset.serialNumber.toLowerCase().includes(normalizedQuery)) ||
                (asset.category && asset.category.toLowerCase().includes(normalizedQuery)) ||
                (asset.status && asset.status.toLowerCase().includes(normalizedQuery));
        });

        renderAssets(filtered);
        updateStats(filtered);
    }

    async function fetchAssets() {
        assetTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Loading assets...</td></tr>`;
        try {
            const response = await fetch(apiBase);
            if (!response.ok) throw new Error("Could not load assets.");
            assets = await response.json();
            renderAssets(assets);
            updateStats(assets);
        } catch (error) {
            assetTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Unable to load assets.</td></tr>`;
            showAlert(error.message || "Unable to load assets.", "error");
        }
    }

    async function fetchAssetById(id) {
        const response = await fetch(`${apiBase}/${id}`);
        if (!response.ok) throw new Error("Asset not found.");
        return response.json();
    }

    function populateForm(asset) {
        assetIdField.value = asset.assetId || "";
        assetName.value = asset.title || "";
        assetCategory.value = asset.category || "IT_EQUIPMENT";
        assetSerialNumber.value = asset.serialNumber || "";
        assetAcquisitionDate.value = asset.acquisitionDate || "";
        assetCost.value = asset.cost || "";
        assetLocation.value = asset.location || "";
        assetCondition.value = asset.condition || "NEW";
        assetPhotoPath.value = asset.photoPath || "";
        setUploadedPhotoLabel(asset.photoPath, asset.photoPath ? asset.photoPath.split("/").pop() : null);
    }

    async function saveAsset() {
        const id = assetIdField.value;
        const payload = {
            title: assetName.value.trim(),
            category: assetCategory.value,
            serialNumber: assetSerialNumber.value.trim(),
            acquisitionDate: assetAcquisitionDate.value || null,
            cost: assetCost.value ? Number(assetCost.value) : null,
            location: assetLocation.value.trim() || null,
            condition: assetCondition.value,
            photoPath: assetPhotoPath.value.trim() || null
        };

        if (!payload.title || !payload.category || !payload.serialNumber) {
            showAlert("Title, category, and serial number are required.", "error");
            return;
        }

        const originalText = saveAssetBtn.innerHTML;
        saveAssetBtn.disabled = true;
        saveAssetBtn.innerHTML = "Processing...";

        try {
            const method = id ? "PUT" : "POST";
            const url = id ? `${apiBase}/${id}` : apiBase;
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(body || "Unable to save asset.");
            }

            const actionText = id ? "updated" : "created";
            showAlert(`Asset ${actionText} successfully.`);
            toggleModal(assetModal, false);
            await fetchAssets();
            clearForm();
        } catch (error) {
            showAlert(error.message || "Failed to save asset.", "error");
        } finally {
            saveAssetBtn.disabled = false;
            saveAssetBtn.innerHTML = originalText;
        }
    }

    function openDeleteModal(asset) {
        assetToDeleteId = asset.assetId;
        deleteMessage.querySelector("strong").textContent = asset.title || `#${asset.assetId}`;
        toggleModal(deleteModal, true);
    }

    async function deleteAsset() {
        if (!assetToDeleteId) return;

        const originalText = confirmDeleteBtn.innerHTML;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = "Processing...";

        try {
            const response = await fetch(`${apiBase}/${assetToDeleteId}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Unable to delete asset.");
            showAlert("Asset deleted successfully.");
            toggleModal(deleteModal, false);
            await fetchAssets();
            assetToDeleteId = null;
        } catch (error) {
            showAlert(error.message || "Failed to delete asset.", "error");
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = originalText;
        }
    }

    async function seedSampleAssets() {
        if (!confirm("This will clear all existing assets and seed 5 new sample assets. Continue?")) {
            return;
        }

        try {
            seedAssetsBtn.disabled = true;
            showAlert("Cleaning up old data...");

            // 1. Delete all existing assets
            const currentAssets = [...assets];
            for (const asset of currentAssets) {
                await fetch(`${apiBase}/${asset.assetId}`, { method: "DELETE" });
            }

            showAlert("Seeding 5 sample assets...");

            // 2. Seed exactly 5
            const promises = sampleAssets.map(asset =>
                fetch(apiBase, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(asset)
                }).then(async response => {
                    if (!response.ok) {
                        const body = await response.text();
                        throw new Error(body || `Failed to create ${asset.title}`);
                    }
                })
            );
            await Promise.all(promises);
            showAlert("5 sample assets seeded successfully.");
            await fetchAssets();
        } catch (error) {
            showAlert(error.message || "Failed to seed sample assets.", "error");
        } finally {
            seedAssetsBtn.disabled = false;
        }
    }

    createAssetBtn.addEventListener("click", () => {
        if (assets.length >= 9) {
            showAlert("Maximum limit of 9 assets reached. You cannot create more assets manually.", "error");
            return;
        }
        modalTitle.textContent = "Create Asset";
        clearForm();
        setFormDisabled(false);
        saveAssetBtn.style.display = "inline-block";
        uploadPhotoBtn.style.display = "inline-block";
        toggleModal(assetModal, true);
    });

    uploadPhotoBtn.addEventListener("click", () => assetPhotoFile.click());
    assetPhotoFile.addEventListener("change", async event => {
        const file = event.target.files[0];
        if (!file) return;
        await uploadAssetPhoto(file);
    });

    seedAssetsBtn.addEventListener("click", seedSampleAssets);
    closeModalIcon.addEventListener("click", () => toggleModal(assetModal, false));
    cancelModalBtn.addEventListener("click", () => toggleModal(assetModal, false));
    saveAssetBtn.addEventListener("click", saveAsset);
    closeDeleteIcon.addEventListener("click", () => toggleModal(deleteModal, false));
    cancelDeleteBtn.addEventListener("click", () => toggleModal(deleteModal, false));
    confirmDeleteBtn.addEventListener("click", deleteAsset);
    searchInput.addEventListener("input", event => filterAssets(event.target.value));

    assetTableBody.addEventListener("click", async event => {
        const target = event.target.closest("[data-action]");
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;
        if (!id) return;

        if (action === "view") {
            try {
                const asset = await fetchAssetById(id);
                modalTitle.textContent = "View Asset";
                populateForm(asset);
                setFormDisabled(true);
                saveAssetBtn.style.display = "none";
                uploadPhotoBtn.style.display = "none";
                toggleModal(assetModal, true);
            } catch (error) {
                showAlert(error.message || "Unable to load asset.", "error");
            }
            return;
        }

        if (action === "edit") {
            try {
                const asset = await fetchAssetById(id);
                modalTitle.textContent = "Edit Asset";
                populateForm(asset);
                setFormDisabled(false);
                saveAssetBtn.style.display = "inline-block";
                uploadPhotoBtn.style.display = "inline-block";
                toggleModal(assetModal, true);
            } catch (error) {
                showAlert(error.message || "Unable to load asset.", "error");
            }
            return;
        }

        if (action === "delete") {
            const asset = assets.find(item => String(item.assetId) === String(id));
            openDeleteModal(asset || { assetId: id, title: "Asset" });
        }
    });

    assetModal.addEventListener("click", event => {
        if (event.target === assetModal) toggleModal(assetModal, false);
    });
    deleteModal.addEventListener("click", event => {
        if (event.target === deleteModal) toggleModal(deleteModal, false);
    });

    fetchAssets();
});