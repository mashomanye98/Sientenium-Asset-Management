/**
 * Retire Assets Management Script
 * Handles fetching, filtering, retiring and restoring assets.
 * Compatible with both Admin and Manager dashboards.
 */

// API Base URL
const API_BASE_URL = window.location.origin;

// State management
let allAssets = [];
let currentTab = 'eligible';

/**
 * Normalizes values for consistent comparison (e.g., status, condition)
 */
const normalizeValue = (value) => String(value || '').trim().toUpperCase();

/**
 * Checks if an asset is eligible for retirement.
 * Eligibility: Status is AVAILABLE.
 * (Highlighting logic for POOR/DAMAGED is handled during rendering)
 */
const isEligibleForRetirement = (asset) => {
    const status = normalizeValue(asset.status);
    return status === 'AVAILABLE';
};

/**
 * Helper to show toast notifications
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/**
 * Generic API request helper with authentication
 */
async function apiRequest(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Include Authorization header if token exists
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorJson.message || errorMessage;
            } catch (e) { /* use raw text */ }
            throw new Error(errorMessage || `HTTP ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
    } catch (error) {
        console.error(`API Request Error [${url}]:`, error);
        throw error;
    }
}

/**
 * Fetch all assets from the database
 */
async function fetchAssets() {
    try {
        const assets = await apiRequest('/api/assets');
        
        // Handle different response formats (Spring Data Page vs List)
        if (Array.isArray(assets)) {
            allAssets = assets;
        } else if (assets && typeof assets === 'object') {
            allAssets = assets.content || assets.data || [];
        } else {
            allAssets = [];
        }

        return allAssets;
    } catch (error) {
        console.error('Error fetching assets:', error);
        showToast('Failed to load assets: ' + error.message, 'error');
        allAssets = [];
        return [];
    }
}

/**
 * Mark an asset as retired
 */
async function retireAsset(assetId, reason, notes) {
    const asset = allAssets.find(a => a.assetId === assetId);
    if (!asset) throw new Error('Asset not found');

    if (normalizeValue(asset.status) === 'LOANED') {
        throw new Error('Cannot retire a loaned asset. Please check it in first.');
    }

    // Prepare update payload (preserving existing data)
    const requestData = {
        title: asset.title,
        category: asset.category,
        serialNumber: asset.serialNumber,
        acquisitionDate: asset.acquisitionDate,
        cost: asset.cost,
        location: asset.location,
        condition: asset.condition,
        photoPath: asset.photoPath,
        status: 'RETIRED'
    };

    // Update via API
    await apiRequest(`/api/assets/${assetId}`, {
        method: 'PUT',
        body: JSON.stringify(requestData)
    });

    showToast(`Asset "${asset.title}" has been retired.`, 'success');
    await loadData();
}

/**
 * Restore a retired asset to available status
 */
async function restoreAsset(assetId, button) {
    if (!confirm('Are you sure you want to restore this asset to active inventory?')) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        const asset = allAssets.find(a => a.assetId === assetId);
        if (!asset) throw new Error('Asset not found');

        const requestData = {
            title: asset.title,
            category: asset.category,
            serialNumber: asset.serialNumber,
            acquisitionDate: asset.acquisitionDate,
            cost: asset.cost,
            location: asset.location,
            condition: asset.condition,
            photoPath: asset.photoPath,
            status: 'AVAILABLE'
        };

        await apiRequest(`/api/assets/${assetId}`, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        showToast(`Asset "${asset.title}" restored successfully!`, 'success');
        await loadData();
    } catch (error) {
        showToast('Failed to restore: ' + error.message, 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
}

/**
 * Render the assets table with current filters and tabs
 */
function renderAssets() {
    const tbody = document.getElementById('retire-tbody');
    if (!tbody) return;

    // Toggle Action column header visibility based on the active tab
    const actionHeader = document.querySelector('#retire-table th:last-child');
    if (actionHeader) {
        // Hide the column entirely when in the "Retired Assets" tab as requested
        actionHeader.style.display = currentTab === 'retired' ? 'none' : 'table-cell';
    }

    const statusFilter = document.getElementById('status-filter')?.value || 'ALL';
    const searchTerm = document.getElementById('search-input')?.value?.toLowerCase() || '';

    let filtered = [...allAssets];

    // 1. Status Filter (Dropdown)
    if (statusFilter !== 'ALL') {
        filtered = filtered.filter(a => normalizeValue(a.status) === statusFilter);
    }

    // 2. Tab Filter
    const titleEl = document.getElementById('table-title');
    if (currentTab === 'eligible') {
        // Now "Eligible" shows all non-retired assets as requested, with highlighting logic below
        filtered = filtered.filter(a => normalizeValue(a.status) !== 'RETIRED');
        if (titleEl) titleEl.textContent = 'Assets Eligible for Retirement';
    } else if (currentTab === 'retired') {
        filtered = filtered.filter(a => normalizeValue(a.status) === 'RETIRED');
        if (titleEl) titleEl.textContent = 'Retired Assets';
    } else {
        // "All Assets" tab - fallback or kept if needed
        if (titleEl) titleEl.textContent = 'All Assets';
    }

    // 3. Search Filter
    if (searchTerm) {
        filtered = filtered.filter(a => 
            (a.title || '').toLowerCase().includes(searchTerm) ||
            (a.serialNumber || '').toLowerCase().includes(searchTerm) ||
            (a.location || '').toLowerCase().includes(searchTerm) ||
            (a.category || '').toLowerCase().includes(searchTerm)
        );
    }

    // Update Counts
    const countEl = document.getElementById('total-count');
    if (countEl) countEl.textContent = `Total: ${filtered.length} assets`;

    if (filtered.length === 0) {
        // Adjust colspan based on whether the action column is hidden
        const colSpan = currentTab === 'retired' ? 6 : 7;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="empty-state">No assets found matching criteria</td></tr>`;
        updateStats();
        return;
    }

    tbody.innerHTML = filtered.map(asset => {
        const status = normalizeValue(asset.status);
        const condition = normalizeValue(asset.condition);
        const statusClass = `status-${status.toLowerCase()}`;
        const isRetired = status === 'RETIRED';
        const eligible = isEligibleForRetirement(asset);
        
        // Highlight poor or damaged condition
        const isCritical = condition === 'POOR' || condition === 'DAMAGED';
        const rowClass = isRetired ? 'retired-row' : (isCritical ? 'condition-critical' : '');

        let actionHtml = '';
        if (eligible) {
            actionHtml = `<button class="btn-retire" onclick="handleRetireClick(${asset.assetId}, '${asset.title.replace(/'/g, "\\'")}', this)">Retire</button>`;
        } else if (isRetired) {
            actionHtml = `<button class="btn-restore" onclick="restoreAsset(${asset.assetId}, this)">Restore</button>`;
        } else {
            actionHtml = `<span style="color: var(--muted); font-size: 0.75rem;">In Use / Active</span>`;
        }

        return `
            <tr class="${rowClass}">
                <td><strong>${asset.title || 'N/A'}</strong></td>
                <td>${asset.serialNumber || 'N/A'}</td>
                <td>${asset.category || 'N/A'}</td>
                <td>${asset.condition || 'N/A'}</td>
                <td>${asset.location || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${asset.status}</span></td>
                ${currentTab !== 'retired' ? `<td>${actionHtml}</td>` : ''}
            </tr>
        `;
    }).join('');

    updateStats();
}

/**
 * Handle direct retirement action from the table button
 */
window.handleRetireClick = async (assetId, title, button) => {
    if (!confirm(`Are you sure you want to retire "${title}"?`)) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Retiring...';

    try {
        await retireAsset(assetId);
        // Toast and reload handled inside retireAsset
    } catch (error) {
        showToast('Failed to retire asset: ' + error.message, 'error');
        button.disabled = false;
        button.textContent = originalText;
    }
};

/**
 * Update the statistics cards
 */
function updateStats() {
    const stats = {
        total: allAssets.length,
        available: allAssets.filter(a => normalizeValue(a.status) === 'AVAILABLE').length,
        loaned: allAssets.filter(a => normalizeValue(a.status) === 'LOANED').length,
        retired: allAssets.filter(a => normalizeValue(a.status) === 'RETIRED').length
    };

    const updateEl = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${val} Assets`;
    };

    updateEl('stat-total', stats.total);
    updateEl('stat-available', stats.available);
    updateEl('stat-loaned', stats.loaned);
    updateEl('stat-retired', stats.retired);
}


/**
 * Main data loading sequence
 */
async function loadData() {
    const tbody = document.getElementById('retire-tbody');
    if (tbody && allAssets.length === 0) {
        const colSpan = currentTab === 'retired' ? 6 : 7;
        tbody.innerHTML = `<tr><td colspan="${colSpan}" class="loading"><i class="fas fa-sync fa-spin"></i> Loading assets...</td></tr>`;
    }

    try {
        await fetchAssets();
        renderAssets();
    } catch (error) {
        console.error('Data load failed:', error);
    }
}

/**
 * Initialize event listeners
 */
function setupEventListeners() {
    document.getElementById('refresh-btn')?.addEventListener('click', loadData);
    document.getElementById('status-filter')?.addEventListener('change', renderAssets);
    document.getElementById('search-input')?.addEventListener('input', renderAssets);

    // Tab switching logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTab = this.dataset.tab;
            renderAssets();
        });
    });

    // Logout button - handled by sidebar but kept for standalone compatibility
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '../../signIn.html';
    });
}

/**
 * Page Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadData();
});
