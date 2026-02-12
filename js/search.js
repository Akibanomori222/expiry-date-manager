// search.js - Search and filter functionality

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle search input
 * @param {string} query - Search query
 */
function handleSearchInput(query) {
    refreshGanttDisplay();
}

/**
 * Handle category filter change
 */
function handleCategoryFilter() {
    refreshGanttDisplay();
}

/**
 * Handle status filter change
 */
function handleStatusFilter() {
    refreshGanttDisplay();
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    refreshGanttDisplay();
    showNotification('フィルターをクリアしました', 'success');
}

/**
 * Get current filter values
 * @returns {Object} Current filter values
 */
function getCurrentFilters() {
    return {
        search: document.getElementById('searchInput').value,
        category: document.getElementById('categoryFilter').value,
        status: document.getElementById('statusFilter').value
    };
}

/**
 * Check if any filters are active
 * @returns {boolean} True if filters are active
 */
function hasActiveFilters() {
    const filters = getCurrentFilters();
    return !!(filters.search || filters.category || filters.status);
}

/**
 * Update clear button visibility
 */
function updateClearButtonState() {
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        if (hasActiveFilters()) {
            clearBtn.style.opacity = '1';
            clearBtn.style.pointerEvents = 'auto';
        } else {
            clearBtn.style.opacity = '0.5';
            clearBtn.style.pointerEvents = 'none';
        }
    }
}

/**
 * Initialize search and filter event listeners
 */
function initSearchListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            const query = searchInput.value;
            handleSearchInput(query);
            updateClearButtonState();
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);

        // Clear search on ESC
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                handleSearchInput('');
                updateClearButtonState();
            }
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            handleCategoryFilter();
            updateClearButtonState();
        });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            handleStatusFilter();
            updateClearButtonState();
        });
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearAllFilters();
            updateClearButtonState();
        });
    }

    // Initial state
    updateClearButtonState();
}

/**
 * Search ingredients by query
 * @param {Array} ingredients - Array of ingredients
 * @param {string} query - Search query
 * @returns {Array} Filtered ingredients
 */
function searchIngredients(ingredients, query) {
    if (!query || query.trim().length === 0) {
        return ingredients;
    }

    const lowerQuery = query.toLowerCase().trim();

    return ingredients.filter(ingredient => {
        return (
            ingredient.name.toLowerCase().includes(lowerQuery) ||
            ingredient.category.toLowerCase().includes(lowerQuery) ||
            (ingredient.notes && ingredient.notes.toLowerCase().includes(lowerQuery)) ||
            (ingredient.location && ingredient.location.toLowerCase().includes(lowerQuery))
        );
    });
}

/**
 * Filter ingredients by category
 * @param {Array} ingredients - Array of ingredients
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered ingredients
 */
function filterByCategory(ingredients, category) {
    if (!category || category === '') {
        return ingredients;
    }

    return ingredients.filter(ingredient => ingredient.category === category);
}

/**
 * Filter ingredients by status
 * @param {Array} ingredients - Array of ingredients
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered ingredients
 */
function filterByStatus(ingredients, status) {
    if (!status || status === '') {
        return ingredients;
    }

    return ingredients.filter(ingredient => getExpirationStatus(ingredient) === status);
}

/**
 * Apply all active filters to ingredients
 * @param {Array} ingredients - Array of ingredients
 * @returns {Array} Filtered ingredients
 */
function applyAllFilters(ingredients) {
    const filters = getCurrentFilters();

    let filtered = [...ingredients];

    // Apply search
    if (filters.search) {
        filtered = searchIngredients(filtered, filters.search);
    }

    // Apply category filter
    if (filters.category) {
        filtered = filterByCategory(filtered, filters.category);
    }

    // Apply status filter
    if (filters.status) {
        filtered = filterByStatus(filtered, filters.status);
    }

    return filtered;
}

/**
 * Get filter summary text
 * @returns {string} Summary of active filters
 */
function getFilterSummary() {
    const filters = getCurrentFilters();
    const parts = [];

    if (filters.search) {
        parts.push(`検索: "${filters.search}"`);
    }

    if (filters.category) {
        parts.push(`カテゴリー: ${filters.category}`);
    }

    if (filters.status) {
        const statusLabels = {
            'fresh': '新鮮',
            'warning': '注意',
            'critical': '要注意',
            'expired': '期限切れ'
        };
        parts.push(`ステータス: ${statusLabels[filters.status] || filters.status}`);
    }

    return parts.length > 0 ? parts.join(', ') : 'フィルターなし';
}
