// dataModel.js - Data model, validation, and business logic

/**
 * Generate a simple UUID
 * @returns {string} UUID string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Create a new ingredient object
 * @param {Object} data - Ingredient data
 * @returns {Object} Formatted ingredient object
 */
function createIngredient(data) {
    const now = new Date().toISOString();

    return {
        id: generateUUID(),
        name: (data.name || '').trim(),
        category: data.category || '',
        purchaseDate: data.purchaseDate || getTodayString(),
        expirationDate: data.expirationDate || '',
        quantity: (data.quantity || '').trim(),
        location: (data.location || '').trim(),
        notes: (data.notes || '').trim(),
        createdAt: now,
        updatedAt: now
    };
}

/**
 * Validate ingredient data
 * @param {Object} data - Ingredient data to validate
 * @returns {Object} Validation result { valid: boolean, errors: Object }
 */
function validateIngredient(data) {
    const errors = {};

    // Required: name
    if (!data.name || data.name.trim().length === 0) {
        errors.name = '名前を入力してください';
    } else if (data.name.trim().length > 100) {
        errors.name = '名前は100文字以内で入力してください';
    }

    // Required: category
    if (!data.category || data.category.trim().length === 0) {
        errors.category = 'カテゴリーを選択してください';
    }

    // Required: expirationDate
    if (!data.expirationDate) {
        errors.expirationDate = '賞味期限を入力してください';
    } else {
        // Validate date format
        const expDate = new Date(data.expirationDate);
        if (isNaN(expDate.getTime())) {
            errors.expirationDate = '有効な日付を入力してください';
        }
    }

    // Optional: purchaseDate validation
    if (data.purchaseDate) {
        const purDate = new Date(data.purchaseDate);
        if (isNaN(purDate.getTime())) {
            errors.purchaseDate = '有効な日付を入力してください';
        }

        // Check if purchase date is after expiration date
        if (data.expirationDate) {
            const expDate = new Date(data.expirationDate);
            if (!isNaN(purDate.getTime()) && !isNaN(expDate.getTime()) && purDate > expDate) {
                errors.purchaseDate = '購入日は賞味期限より前である必要があります';
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors: errors
    };
}

/**
 * Calculate days remaining until expiration
 * @param {string} expirationDate - ISO date string
 * @returns {number} Days remaining (negative if expired)
 */
function calculateDaysRemaining(expirationDate) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expDate = new Date(expirationDate);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    } catch (error) {
        console.error('Error calculating days remaining:', error);
        return 0;
    }
}

/**
 * Get expiration status
 * @param {Object} ingredient - Ingredient object
 * @returns {string} Status: 'expired', 'critical', 'warning', 'fresh'
 */
function getExpirationStatus(ingredient) {
    const daysRemaining = calculateDaysRemaining(ingredient.expirationDate);

    if (daysRemaining < 0) {
        return 'expired';  // 期限切れ
    } else if (daysRemaining <= 3) {
        return 'critical';  // 要注意（1-3日）
    } else if (daysRemaining <= 7) {
        return 'warning';  // 注意（4-7日）
    } else {
        return 'fresh';  // 新鮮（8日以上）
    }
}

/**
 * Get status label in Japanese
 * @param {string} status - Status code
 * @returns {string} Japanese label
 */
function getStatusLabel(status) {
    const labels = {
        'expired': '期限切れ',
        'critical': '要注意',
        'warning': '注意',
        'fresh': '新鮮'
    };
    return labels[status] || '不明';
}

/**
 * Sort ingredients by specified field
 * @param {Array} ingredients - Array of ingredients
 * @param {string} sortBy - Sort field: 'name', 'expiration', 'status', 'category'
 * @param {string} order - Sort order: 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
function sortIngredients(ingredients, sortBy = 'expiration', order = 'asc') {
    const sorted = [...ingredients];

    sorted.sort((a, b) => {
        let compareA, compareB;

        switch (sortBy) {
            case 'name':
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
                break;

            case 'expiration':
                compareA = new Date(a.expirationDate);
                compareB = new Date(b.expirationDate);
                break;

            case 'status':
                const statusOrder = { 'expired': 0, 'critical': 1, 'warning': 2, 'fresh': 3 };
                compareA = statusOrder[getExpirationStatus(a)];
                compareB = statusOrder[getExpirationStatus(b)];
                break;

            case 'category':
                compareA = a.category.toLowerCase();
                compareB = b.category.toLowerCase();
                break;

            case 'purchase':
                compareA = new Date(a.purchaseDate || '1900-01-01');
                compareB = new Date(b.purchaseDate || '1900-01-01');
                break;

            default:
                return 0;
        }

        if (compareA < compareB) return order === 'asc' ? -1 : 1;
        if (compareA > compareB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
}

/**
 * Filter ingredients by multiple criteria
 * @param {Array} ingredients - Array of ingredients
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered array
 */
function filterIngredients(ingredients, filters = {}) {
    let filtered = [...ingredients];

    // Filter by search query
    if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        filtered = filtered.filter(ing =>
            ing.name.toLowerCase().includes(query) ||
            ing.category.toLowerCase().includes(query) ||
            (ing.notes && ing.notes.toLowerCase().includes(query))
        );
    }

    // Filter by category
    if (filters.category && filters.category !== '') {
        filtered = filtered.filter(ing => ing.category === filters.category);
    }

    // Filter by status
    if (filters.status && filters.status !== '') {
        filtered = filtered.filter(ing => getExpirationStatus(ing) === filters.status);
    }

    // Filter by date range
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filtered = filtered.filter(ing => new Date(ing.expirationDate) >= startDate);
    }

    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filtered = filtered.filter(ing => new Date(ing.expirationDate) <= endDate);
    }

    return filtered;
}

/**
 * Get today's date as YYYY-MM-DD string
 * @returns {string} Today's date
 */
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Format date to Japanese format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (例: 2月11日)
 */
function formatDateJP(dateString) {
    try {
        const date = new Date(dateString);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    } catch (error) {
        return dateString;
    }
}

/**
 * Format date to full Japanese format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (例: 2026年2月11日)
 */
function formatDateFullJP(dateString) {
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    } catch (error) {
        return dateString;
    }
}

/**
 * Get statistics about ingredients
 * @param {Array} ingredients - Array of ingredients
 * @returns {Object} Statistics
 */
function getIngredientStats(ingredients) {
    const stats = {
        total: ingredients.length,
        expired: 0,
        critical: 0,
        warning: 0,
        fresh: 0,
        byCategory: {}
    };

    ingredients.forEach(ing => {
        const status = getExpirationStatus(ing);
        stats[status]++;

        // Count by category
        if (!stats.byCategory[ing.category]) {
            stats.byCategory[ing.category] = 0;
        }
        stats.byCategory[ing.category]++;
    });

    return stats;
}
