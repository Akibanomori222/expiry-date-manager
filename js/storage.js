// storage.js - Firestore storage management with real-time sync

// In-memory cache for ingredients (synced with Firestore)
let ingredientsCache = [];
let isFirestoreInitialized = false;

/**
 * Initialize Firestore real-time listener
 */
function initializeFirestoreSync() {
    if (isFirestoreInitialized) {
        return;
    }

    console.log('Setting up Firestore real-time sync...');

    // Listen to real-time updates
    listenToIngredientsChanges((ingredients) => {
        ingredientsCache = ingredients;
        console.log('Cache updated with', ingredients.length, 'ingredients');

        // Trigger UI refresh if app is already loaded
        if (typeof refreshGanttDisplay === 'function') {
            refreshGanttDisplay();
        }
    });

    isFirestoreInitialized = true;
}

/**
 * Load ingredients from cache (synced with Firestore)
 * @returns {Array} Array of ingredient objects
 */
function loadIngredients() {
    return [...ingredientsCache]; // Return a copy to prevent direct modification
}

/**
 * Add a new ingredient
 * @param {Object} ingredient - Ingredient object to add
 * @returns {boolean} Success status
 */
function addIngredient(ingredient) {
    try {
        // Add to Firestore (async, but we don't wait)
        addIngredientToFirestore(ingredient)
            .then(docId => {
                console.log('Ingredient added to Firestore with ID:', docId);
            })
            .catch(error => {
                console.error('Failed to add ingredient to Firestore:', error);
                showNotification('保存に失敗しました', 'error');
            });

        return true;
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
        // Update in Firestore
        updateIngredientInFirestore(id, updates)
            .then(() => {
                console.log('Ingredient updated in Firestore:', id);
            })
            .catch(error => {
                console.error('Failed to update ingredient in Firestore:', error);
                showNotification('更新に失敗しました', 'error');
            });

        return true;
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
        // Delete from Firestore
        deleteIngredientFromFirestore(id)
            .then(() => {
                console.log('Ingredient deleted from Firestore:', id);
            })
            .catch(error => {
                console.error('Failed to delete ingredient from Firestore:', error);
                showNotification('削除に失敗しました', 'error');
            });

        return true;
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
        return ingredientsCache.find(ing => ing.id === id) || null;
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
        // Clear from Firestore
        clearAllIngredientsFromFirestore()
            .then(() => {
                console.log('All ingredients cleared from Firestore');
            })
            .catch(error => {
                console.error('Failed to clear Firestore:', error);
                showNotification('削除に失敗しました', 'error');
            });

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
        const ingredients = loadIngredients();
        const dataStr = JSON.stringify(ingredients);
        const sizeInBytes = new Blob([dataStr]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);

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

// Initialize Firestore sync when this file loads
// Wait a bit to ensure Firebase is loaded first
setTimeout(() => {
    if (typeof firebase !== 'undefined') {
        initializeFirestoreSync();
    } else {
        console.error('Firebase not loaded. Make sure Firebase scripts are included before storage.js');
    }
}, 500);
