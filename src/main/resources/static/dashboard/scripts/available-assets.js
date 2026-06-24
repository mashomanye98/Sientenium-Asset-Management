document.addEventListener("DOMContentLoaded", () => {
    const productGrid = document.getElementById("productGrid");
    const searchInput = document.getElementById("searchInput");
    const filterButtons = document.querySelectorAll('.filter-chip');
    const locationMap = {
        'Cape Town': ['CPT', 'CT', 'Cape Town'],
        'Johannesburg': ['JHB', 'Joburg', 'Johannesburg'],
        'Durban': ['DBN', 'Durban']
    };

    let assets = [];
    let activeLocation = null;

    function formatCurrency(value) {
        if (value === null || value === undefined) return 'R 0.00';
        const number = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(number);
    }

    function getImageUrl(photoPath) {
        if (!photoPath) return null;
        if (photoPath.startsWith('/') || photoPath.startsWith('http')) {
            return photoPath;
        }
        return `/uploads/${photoPath}`;
    }

    function getFilteredAssets() {
        const query = searchInput.value.trim().toLowerCase();
        return assets.filter(asset => {
            const matchesStatus = asset.status === 'AVAILABLE';
            if (!matchesStatus) return false;

            const titleMatch = asset.title?.toLowerCase().includes(query);
            const categoryMatch = asset.category?.toLowerCase().includes(query);
            const locationMatch = asset.location?.toLowerCase().includes(query);
            const conditionMatch = asset.condition?.toLowerCase().includes(query);
            const universalMatch = query === '' || titleMatch || categoryMatch || locationMatch || conditionMatch;

            if (!universalMatch) return false;
            if (!activeLocation) return true;

            const allowed = locationMap[activeLocation] || [activeLocation];
            return allowed.some(code => asset.location?.toUpperCase().includes(code.toUpperCase()));
        });
    }

    function renderAssets(list) {
        productGrid.innerHTML = '';
        if (!list.length) {
            productGrid.innerHTML = '<div class="no-results"><i class="fas fa-box-open" style="font-size:2rem;margin-bottom:12px;display:block"></i>No assets match your filters.</div>';
            return;
        }

        list.forEach(asset => {
            const imageUrl = getImageUrl(asset.photoPath);
            const photoCount = imageUrl ? 1 : 0;
            const locations = asset.location ? [asset.location] : [];
            const title = asset.title || 'Untitled Asset';
            const brand = asset.category || 'General';
            const price = formatCurrency(asset.cost);
            const conditionBadge = asset.condition ? `${asset.condition}` : 'Unknown';

            // Location normalization for old data (Boardroom/Finance)
            let displayLocation = asset.location || 'Unknown location';
            if (displayLocation === 'Boardroom' || displayLocation.includes('Finance')) {
                displayLocation = 'Johannesburg'; // Default fallback for old data
            }

            const cardHtml = `
                <div class="product-card">
                    <div class="sale-tag">AVAILABLE</div>
                    <div class="discount-badge">${conditionBadge}</div>
                    <div class="product-img-wrap">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${title}" onerror="this.style.display='none'">` : `<div style="font-size:3rem;color:#cdd5e0;"><i class="fas fa-box-open"></i></div>`}
                        <div class="photo-count"><i class="fas fa-camera"></i> ${photoCount}</div>
                    </div>
                    <div class="product-info">
                        <div class="product-name">${title}</div>
                        <div class="product-brand">${brand}</div>
                        <div class="price-row">
                            <span class="price">${price}</span>
                        </div>
                        <div class="delivery-row"><i class="fas fa-map-marker-alt"></i> ${displayLocation}</div>
                        <button class="add-btn asset-apply-btn" data-asset-id="${asset.assetId}" type="button">Asset Application</button>
                    </div>
                </div>`;

            productGrid.insertAdjacentHTML('beforeend', cardHtml);
        });

        productGrid.querySelectorAll('.asset-apply-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const assetId = button.dataset.assetId;
                if (!assetId) return;

                const selectedAsset = assets.find(asset => String(asset.assetId) === String(assetId));
                if (selectedAsset) {
                    // Keep the clicked asset available for the next page.
                    sessionStorage.setItem('selectedLoanAsset', JSON.stringify(selectedAsset));
                }

                window.location.href = `loan-request.html?assetId=${encodeURIComponent(assetId)}`;
            });
        });
    }

    function applyFilters() {
        renderAssets(getFilteredAssets());
    }

    window.applyFilters = applyFilters;

    window.filterLocation = function (btn, loc) {
        if (activeLocation === loc) {
            activeLocation = null;
            filterButtons.forEach(c => c.classList.remove('active'));
        } else {
            activeLocation = loc;
            filterButtons.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
        }
        applyFilters();
    };

    async function fetchAssets() {
        productGrid.innerHTML = '<div class="no-results"><i class="fas fa-box-open" style="font-size:2rem;margin-bottom:12px;display:block"></i>Loading assets...</div>';
        try {
            const response = await fetch('/api/assets');
            if (!response.ok) throw new Error('Unable to load assets from the database.');
            assets = await response.json();
            applyFilters();
        } catch (error) {
            productGrid.innerHTML = `<div class="no-results">${error.message}</div>`;
            console.error(error);
        }
    }

    searchInput.addEventListener('input', applyFilters);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userName');
            window.location.href = '../../signIn.html';
        });
    }

    fetchAssets();
});
