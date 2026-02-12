// storage.js - Firestore storage management with real-time sync

// In-memory cache for ingredients (synced with Firestore)
let ingredientsCache = [];

/**
 * Initialize Firestore real-time listener
 * Called from app.js after DOM is ready
 */
function initializeFirestoreSync() {
    console.log('Setting up Firestore real-time sync...');

    listenToIngredientsChanges((ingredients) => {
        ingredientsCache = ingredients;
        console.log('Firestore sync: received', ingredients.length, 'ingredients');

        // Refresh UI
        refreshGanttDisplay();
    });
}

/**
 * Load ingredients from cache (synced with Firestore)
 */
function loadIngredients() {
    return [...ingredientsCache];
}

/**
 * Add a new ingredient (async)
 */
function addIngredient(ingredient) {
    addIngredientToFirestore(ingredient)
        .then(docId => {
            console.log('Added to Firestore:', docId);
        })
        .catch(error => {
            console.error('Failed to add:', error);
            showNotification('保存に失敗しました。ネットワークを確認してください。', 'error');
        });
    return true;
}

/**
 * Update an existing ingredient (async)
 */
function updateIngredient(id, updates) {
    updateIngredientInFirestore(id, updates)
        .then(() => {
            console.log('Updated in Firestore:', id);
        })
        .catch(error => {
            console.error('Failed to update:', error);
            showNotification('更新に失敗しました', 'error');
        });
    return true;
}

/**
 * Delete an ingredient by ID (async)
 */
function deleteIngredient(id) {
    deleteIngredientFromFirestore(id)
        .then(() => {
            console.log('Deleted from Firestore:', id);
        })
        .catch(error => {
            console.error('Failed to delete:', error);
            showNotification('削除に失敗しました', 'error');
        });
    return true;
}

/**
 * Get a single ingredient by ID
 */
function getIngredientById(id) {
    return ingredientsCache.find(ing => ing.id === id) || null;
}

/**
 * Clear all ingredients (async)
 */
function clearAllIngredients() {
    clearAllIngredientsFromFirestore()
        .then(() => {
            console.log('All cleared from Firestore');
        })
        .catch(error => {
            console.error('Failed to clear:', error);
            showNotification('削除に失敗しました', 'error');
        });
    return true;
}

/**
 * Get storage statistics
 */
function getStorageInfo() {
    return {
        count: ingredientsCache.length,
        sizeKB: 0,
        sizeBytes: 0
    };
}
