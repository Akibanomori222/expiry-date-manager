// storage.js - localStorage management

const STORAGE_KEY = 'foodIngredients';

/**
 * Load ingredients from localStorage
 * @returns {Array} Array of ingredient objects
 */
function loadIngredients() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            return [];
        }
        const ingredients = JSON.parse(data);
        return Array.isArray(ingredients) ? ingredients : [];
    } catch (error) {
        console.error('Error loading ingredients from localStorage:', error);
        return [];
    }
}

/**
 * Save ingredients to localStorage
 * @param {Array} ingredients - Array of ingredient objects to save
 * @returns {boolean} Success status
 */
function saveIngredients(ingredients) {
    try {
        if (!Array.isArray(ingredients)) {
            throw new Error('Ingredients must be an array');
        }
        const data = JSON.stringify(ingredients);
        localStorage.setItem(STORAGE_KEY, data);
        return true;
    } catch (error) {
        console.error('Error saving ingredients to localStorage:', error);
        if (error.name === 'QuotaExceededError') {
            alert('保存容量が不足しています。古い食材を削除してください。');
        }
        return false;
    }
}

/**
 * Add a new ingredient
 * @param {Object} ingredient - Ingredient object to add
 * @returns {boolean} Success status
 */
function addIngredient(ingredient) {
    try {
        const ingredients = loadIngredients();
        ingredients.push(ingredient);
        return saveIngredients(ingredients);
    } catch (error) {
        console.error('Error adding ingredient:', error);
        return false;
    }
}

/**
 * Update an existing ingredient
 * @param {string} id - Ingredient ID
 * @param {Object} updates - Object containing fields to update
 * @returns {boolean} Success status
 */
function updateIngredient(id, updates) {
    try {
        const ingredients = loadIngredients();
        const index = ingredients.findIndex(ing => ing.id === id);

        if (index === -1) {
            throw new Error('Ingredient not found');
        }

        // Merge updates with existing ingredient
        ingredients[index] = {
            ...ingredients[index],
            ...updates,
            id: ingredients[index].id, // Preserve original ID
            updatedAt: new Date().toISOString()
        };

        return saveIngredients(ingredients);
    } catch (error) {
        console.error('Error updating ingredient:', error);
        return false;
    }
}

/**
 * Delete an ingredient by ID
 * @param {string} id - Ingredient ID to delete
 * @returns {boolean} Success status
 */
function deleteIngredient(id) {
    try {
        const ingredients = loadIngredients();
        const filtered = ingredients.filter(ing => ing.id !== id);

        if (filtered.length === ingredients.length) {
            throw new Error('Ingredient not found');
        }

        return saveIngredients(filtered);
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        return false;
    }
}

/**
 * Get a single ingredient by ID
 * @param {string} id - Ingredient ID
 * @returns {Object|null} Ingredient object or null if not found
 */
function getIngredientById(id) {
    try {
        const ingredients = loadIngredients();
        return ingredients.find(ing => ing.id === id) || null;
    } catch (error) {
        console.error('Error getting ingredient by ID:', error);
        return null;
    }
}

/**
 * Clear all ingredients from storage
 * @returns {boolean} Success status
 */
function clearAllIngredients() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing ingredients:', error);
        return false;
    }
}

/**
 * Get storage statistics
 * @returns {Object} Storage info
 */
function getStorageInfo() {
    try {
        const data = localStorage.getItem(STORAGE_KEY) || '';
        const sizeInBytes = new Blob([data]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const ingredients = loadIngredients();

        return {
            count: ingredients.length,
            sizeKB: sizeInKB,
            sizeBytes: sizeInBytes
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { count: 0, sizeKB: 0, sizeBytes: 0 };
    }
}
