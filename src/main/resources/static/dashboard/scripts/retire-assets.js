// API Base URL
const API_BASE_URL = window.location.origin;

// Store data
let allAssets = [];
let currentTab = 'eligible';

function normalizeValue(value) {
    return String(value || '').toUpperCase();
}

function isEligibleForRetirement(asset) {
    var status = normalizeValue(asset.status);
    var condition = normalizeValue(asset.condition);
    return status === 'AVAILABLE' && (condition === 'POOR' || condition === 'DAMAGED');
}

// Helper function to show toast notifications
function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function() {
        toast.remove();
    }, 4000);
}

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Make API request with headers
async function apiRequest(url, options) {
    options = options || {};
    var headers = {
        'Content-Type': 'application/json'
    };

    // Copy existing headers
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }

    var token = getAuthToken();
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    try {
        var response = await fetch(API_BASE_URL + url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body || null
        });

        if (!response.ok) {
            var errorText = await response.text();
            throw new Error(errorText || 'HTTP ' + response.status);
        }

        if (response.status === 204) {
            return null;
        }

        var data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Fetch all assets
async function fetchAssets() {
    try {
        console.log('Fetching assets from:', API_BASE_URL + '/api/assets');
        var assets = await apiRequest('/api/assets');
        console.log('Raw assets response:', assets);

        // Handle different response formats
        if (Array.isArray(assets)) {
            allAssets = assets;
        } else if (assets && typeof assets === 'object') {
            allAssets = assets.content || assets.data || [];
        } else {
            allAssets = [];
        }

        console.log('Processed assets:', allAssets);
        console.log('Number of assets loaded:', allAssets.length);

        if (allAssets.length === 0) {
            showToast('No assets found in the system', 'info');
        }

        return allAssets;
    } catch (error) {
        console.error('Error fetching assets:', error);
        showToast('Failed to load assets: ' + error.message, 'error');
        allAssets = [];
        return [];
    }
}

// Retire an asset
async function retireAsset(assetId, reason, notes) {
    try {
        var asset = null;
        for (var i = 0; i < allAssets.length; i++) {
            if (allAssets[i].assetId === assetId) {
                asset = allAssets[i];
                break;
            }
        }

        if (!asset) {
            throw new Error('Asset not found');
        }

        // Check if asset is loaned
        if (normalizeValue(asset.status) === 'LOANED') {
            throw new Error('Cannot retire an asset that is currently loaned out. Please check it in first.');
        }

        // Create a proper request DTO with all required fields
        var requestData = {
            title: asset.title || 'N/A',
            category: asset.category || 'IT_EQUIPMENT',
            serialNumber: asset.serialNumber || 'N/A',
            acquisitionDate: asset.acquisitionDate || new Date().toISOString().split('T')[0],
            cost: asset.cost || 0,
            location: asset.location || 'N/A',
            condition: asset.condition || 'GOOD',
            photoPath: asset.photoPath || null,
            status: 'RETIRED'
        };

        console.log('Retiring asset with data:', requestData);

        // Update asset status to RETIRED
        var updatedAsset = await apiRequest('/api/assets/' + assetId, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        // Record audit log
        try {
            await apiRequest('/api/audit-logs', {
                method: 'POST',
                body: JSON.stringify({
                    userId: 1,
                    entityType: 'ASSET',
                    entityId: assetId,
                    action: 'DELETE'
                })
            });
        } catch (auditError) {
            console.warn('Audit log failed but asset was retired:', auditError);
        }

        showToast('Asset "' + asset.title + '" retired successfully!', 'success');
        await loadData();
        return updatedAsset;
    } catch (error) {
        console.error('Error retiring asset:', error);
        showToast('Failed to retire asset: ' + error.message, 'error');
        throw error;
    }
}

// Restore an asset (undo retirement)
async function restoreAsset(assetId) {
    if (!confirm('Are you sure you want to restore this asset?')) {
        return;
    }

    try {
        var asset = null;
        for (var i = 0; i < allAssets.length; i++) {
            if (allAssets[i].assetId === assetId) {
                asset = allAssets[i];
                break;
            }
        }

        if (!asset) {
            throw new Error('Asset not found');
        }

        // Create a proper request DTO
        var requestData = {
            title: asset.title || 'N/A',
            category: asset.category || 'IT_EQUIPMENT',
            serialNumber: asset.serialNumber || 'N/A',
            acquisitionDate: asset.acquisitionDate || new Date().toISOString().split('T')[0],
            cost: asset.cost || 0,
            location: asset.location || 'N/A',
            condition: asset.condition || 'GOOD',
            photoPath: asset.photoPath || null,
            status: 'AVAILABLE'
        };

        console.log('Restoring asset with data:', requestData);

        // Update asset status back to AVAILABLE
        var updatedAsset = await apiRequest('/api/assets/' + assetId, {
            method: 'PUT',
            body: JSON.stringify(requestData)
        });

        // Record audit log
        try {
            await apiRequest('/api/audit-logs', {
                method: 'POST',
                body: JSON.stringify({
                    userId: 1,
                    entityType: 'ASSET',
                    entityId: assetId,
                    action: 'UPDATE'
                })
            });
        } catch (auditError) {
            console.warn('Audit log failed but asset was restored:', auditError);
        }

        showToast('Asset "' + asset.title + '" restored successfully!', 'success');
        await loadData();
        return updatedAsset;
    } catch (error) {
        console.error('Error restoring asset:', error);
        showToast('Failed to restore asset: ' + error.message, 'error');
        throw error;
    }
}

// Render assets table
function renderAssets() {
    console.log('Rendering assets. Current allAssets:', allAssets);

    var tbody = document.getElementById('retire-tbody');
    var statusFilter = document.getElementById('status-filter').value;
    var searchTerm = document.getElementById('search-input').value.toLowerCase();

    // Make sure allAssets is an array
    if (!Array.isArray(allAssets)) {
        console.error('allAssets is not an array:', allAssets);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error: Invalid data format</td></tr>';
        return;
    }

    var filtered = [];
    for (var i = 0; i < allAssets.length; i++) {
        filtered.push(allAssets[i]);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
        var tempFiltered = [];
        for (var j = 0; j < filtered.length; j++) {
            if (normalizeValue(filtered[j].status) === statusFilter) {
                tempFiltered.push(filtered[j]);
            }
        }
        filtered = tempFiltered;
    }

    // Apply tab filter
    if (currentTab === 'eligible') {
        var tempFiltered = [];
        for (var k = 0; k < filtered.length; k++) {
            if (isEligibleForRetirement(filtered[k])) {
                tempFiltered.push(filtered[k]);
            }
        }
        filtered = tempFiltered;
        document.getElementById('table-title').textContent = 'Assets Eligible for Retirement';
    } else if (currentTab === 'retired') {
        var tempFiltered = [];
        for (var l = 0; l < filtered.length; l++) {
            if (normalizeValue(filtered[l].status) === 'RETIRED') {
                tempFiltered.push(filtered[l]);
            }
        }
        filtered = tempFiltered;
        document.getElementById('table-title').textContent = 'Retired Assets';
    } else {
        document.getElementById('table-title').textContent = 'All Assets';
    }

    // Apply search filter
    if (searchTerm) {
        var tempFiltered = [];
        for (var m = 0; m < filtered.length; m++) {
            var asset = filtered[m];
            var title = asset.title || '';
            var serial = asset.serialNumber || '';
            var location = asset.location || '';
            if (title.toLowerCase().includes(searchTerm) ||
                serial.toLowerCase().includes(searchTerm) ||
                location.toLowerCase().includes(searchTerm)) {
                tempFiltered.push(asset);
            }
        }
        filtered = tempFiltered;
    }

    // Update count
    document.getElementById('total-count').textContent = 'Total: ' + filtered.length + ' assets';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No assets found</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    for (var n = 0; n < filtered.length; n++) {
        var asset = filtered[n];
        var row = document.createElement('tr');

        var assetStatus = normalizeValue(asset.status);
        if (assetStatus === 'RETIRED') {
            row.className = 'retired-row';
        }

        var statusClass = 'status-available';
        if (assetStatus === 'LOANED') {
            statusClass = 'status-loaned';
        } else if (assetStatus === 'RETIRED') {
            statusClass = 'status-retired';
        }

        var actionHtml = '';
        if (isEligibleForRetirement(asset)) {
            actionHtml = '<button class="btn-retire" data-asset-id="' + asset.assetId + '" data-asset-title="' + (asset.title || 'N/A') + '">Retire</button>';
        } else if (assetStatus === 'RETIRED') {
            actionHtml = '<button class="btn-restore" data-asset-id="' + asset.assetId + '" data-asset-title="' + (asset.title || 'N/A') + '">Restore</button>';
        } else {
            actionHtml = '<span style="color: var(--muted); font-size: 0.75rem;">Cannot retire</span>';
        }

        row.innerHTML = `
            <td><strong>${asset.title || 'N/A'}</strong></td>
            <td>${asset.serialNumber || 'N/A'}</td>
            <td>${asset.category || 'N/A'}</td>
            <td>${asset.condition || 'N/A'}</td>
            <td>${asset.location || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${asset.status || 'N/A'}</span></td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(row);
    }

    // Attach event listeners to retire buttons
    var retireBtns = document.querySelectorAll('.btn-retire');
    for (var o = 0; o < retireBtns.length; o++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                var assetId = parseInt(this.dataset.assetId);
                var assetTitle = this.dataset.assetTitle;
                document.getElementById('retire-asset').value = assetId;
                document.getElementById('retire-asset').dispatchEvent(new Event('change'));
                document.getElementById('retire-form').scrollIntoView({ behavior: 'smooth' });
                showToast('Selected "' + assetTitle + '" for retirement', 'info');
            });
        })(retireBtns[o]);
    }

    // Attach event listeners to restore buttons
    var restoreBtns = document.querySelectorAll('.btn-restore');
    for (var p = 0; p < restoreBtns.length; p++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                var assetId = parseInt(this.dataset.assetId);
                restoreAsset(assetId);
            });
        })(restoreBtns[p]);
    }

    // Update stats
    updateStats();
}

// Update stats
function updateStats() {
    if (!Array.isArray(allAssets)) {
        return;
    }

    var total = allAssets.length;
    var available = 0;
    var loaned = 0;
    var retired = 0;

    for (var i = 0; i < allAssets.length; i++) {
        var status = normalizeValue(allAssets[i].status);
        if (status === 'AVAILABLE') available++;
        else if (status === 'LOANED') loaned++;
        else if (status === 'RETIRED') retired++;
    }

    document.getElementById('stat-total').textContent = total + ' Assets';
    document.getElementById('stat-available').textContent = available + ' Assets';
    document.getElementById('stat-loaned').textContent = loaned + ' Assets';
    document.getElementById('stat-retired').textContent = retired + ' Assets';

    // Update sidebar badge
    var pendingCount = document.getElementById('pending-count');
    if (pendingCount) {
        pendingCount.textContent = available;
    }
}

// Populate retire form dropdown
function populateRetireForm() {
    var select = document.getElementById('retire-asset');
    var currentValue = select.value;

    select.innerHTML = '<option value="">-- Select an asset --</option>';

    if (!Array.isArray(allAssets)) {
        return;
    }

    // Only poor or damaged available assets are eligible for retirement
    for (var i = 0; i < allAssets.length; i++) {
        var asset = allAssets[i];
        if (isEligibleForRetirement(asset)) {
            var option = document.createElement('option');
            option.value = asset.assetId;
            option.textContent = (asset.title || 'N/A') + ' (' + (asset.serialNumber || 'No SN') + ')';
            select.appendChild(option);
        }
    }

    if (currentValue) {
        select.value = currentValue;
    }
}

// Handle retire form submission
async function handleRetireSubmit(event) {
    event.preventDefault();

    var assetId = parseInt(document.getElementById('retire-asset').value);
    var reason = document.getElementById('retire-reason').value;
    var notes = document.getElementById('retire-notes').value;
    var submitBtn = document.getElementById('retire-submit-btn');
    var messageDiv = document.getElementById('retire-form-message');

    // Validation
    if (!assetId) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Please select an asset.</span>';
        return;
    }
    if (!reason) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">Please select a reason for retirement.</span>';
        return;
    }

    // Find the asset for confirmation
    var asset = null;
    for (var i = 0; i < allAssets.length; i++) {
        if (allAssets[i].assetId === assetId) {
            asset = allAssets[i];
            break;
        }
    }

    if (!confirm('Are you sure you want to retire "' + (asset?.title || 'N/A') + '"?\nReason: ' + reason + '\n\nThis action will mark the asset as RETIRED.')) {
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Processing...';
    messageDiv.innerHTML = '';

    try {
        await retireAsset(assetId, reason, notes);
        messageDiv.innerHTML = '<span style="color: #10b981;">✓ Asset retired successfully!</span>';
        document.getElementById('retire-form').reset();
        populateRetireForm();
    } catch (error) {
        messageDiv.innerHTML = '<span style="color: #dc2626;">✗ ' + error.message + '</span>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i> Retire Asset';
    }
}

// Load all data
async function loadData() {
    console.log('Loading data...');
    try {
        await fetchAssets();
        renderAssets();
        populateRetireForm();
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data: ' + error.message, 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', loadData);
    document.getElementById('status-filter').addEventListener('change', renderAssets);
    document.getElementById('search-input').addEventListener('input', renderAssets);
    document.getElementById('retire-form').addEventListener('submit', handleRetireSubmit);

    // Tab switching
    var tabBtns = document.querySelectorAll('.tab-btn');
    for (var i = 0; i < tabBtns.length; i++) {
        (function(btn) {
            btn.addEventListener('click', function() {
                var allBtns = document.querySelectorAll('.tab-btn');
                for (var j = 0; j < allBtns.length; j++) {
                    allBtns[j].classList.remove('active');
                }
                this.classList.add('active');
                currentTab = this.dataset.tab;
                renderAssets();
            });
        })(tabBtns[i]);
    }

    document.getElementById('logout-btn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = '../../signIn.html';
    });

    document.getElementById('retire-asset').addEventListener('change', function() {
        document.getElementById('retire-form-message').innerHTML = '';
    });

    document.getElementById('retire-reason').addEventListener('change', function() {
        document.getElementById('retire-form-message').innerHTML = '';
    });
}

// Update user name
function updateUserInfo() {
    var userNameElement = document.getElementById('user-name');
    if (!userNameElement) {
        return;
    }

    var currentUser = {};
    try {
        currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
    } catch (error) {
        currentUser = {};
    }

    var userName = currentUser.fullName || localStorage.getItem('userName') || userNameElement.textContent || 'System Administrator';
    userNameElement.textContent = userName;
}

// Initialize
function init() {
    console.log('Initializing retire assets page...');
    updateUserInfo();
    setupEventListeners();
    loadData();
}

// Run initialization
document.addEventListener('DOMContentLoaded', init);
