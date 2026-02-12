// app.js - Main application initialization and coordination

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing Food Ingredient Manager...');

    // Initialize event listeners
    initFormListeners();
    initSearchListeners();

    // Start Firestore real-time sync (this will automatically load and display data)
    initializeFirestoreSync();

    console.log('Application initialized successfully!');
}

/**
 * Load ingredients from storage and display in Gantt chart
 */
function loadAndDisplayIngredients() {
    try {
        const ingredients = loadIngredients();
        renderGanttChart(ingredients, openEditForm, confirmDeleteIngredient);

        console.log(`Loaded ${ingredients.length} ingredients`);
    } catch (error) {
        console.error('Error loading ingredients:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

/**
 * Show a notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type: 'success', 'error', 'warning'
 */
function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (!toast || !toastMessage) {
        console.warn('Toast elements not found');
        return;
    }

    // Set message
    toastMessage.textContent = message;

    // Remove existing type classes
    toast.classList.remove('success', 'error', 'warning');

    // Add type class
    if (type) {
        toast.classList.add(type);
    }

    // Show toast
    toast.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

/**
 * Hide the notification toast
 */
function hideNotification() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
    }
}

/**
 * Handle errors globally
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 */
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);

    const message = error.message || '予期しないエラーが発生しました';
    showNotification(message, 'error');
}

/**
 * Add sample ingredients for testing (optional)
 */
function addSampleIngredients() {
    const sampleData = [
        {
            name: 'チョコレート',
            category: 'お菓子',
            expirationDate: getDateString(15),
            location: '冷蔵庫',
            notes: 'いただきもの'
        },
        {
            name: 'クッキー',
            category: 'お菓子',
            expirationDate: getDateString(30),
            location: '棚',
            notes: ''
        },
        {
            name: '鶏むね肉',
            category: '肉類',
            expirationDate: getDateString(7),
            location: '冷蔵庫',
            notes: ''
        },
        {
            name: '牛乳',
            category: '乳製品・卵',
            expirationDate: getDateString(5),
            location: '冷蔵庫',
            notes: ''
        },
        {
            name: 'ヨーグルト',
            category: '乳製品・卵',
            expirationDate: getDateString(3),
            location: '冷蔵庫',
            notes: '期限近い'
        }
    ];

    sampleData.forEach(data => {
        const ingredient = createIngredient(data);
        addIngredient(ingredient);
    });

    showNotification('サンプルデータを追加しました', 'success');
    refreshGanttDisplay();
}

/**
 * Get date string with offset from today
 * @param {number} daysOffset - Days to offset from today
 * @returns {string} Date string in YYYY-MM-DD format
 */
function getDateString(daysOffset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
}

/**
 * Export ingredients as JSON
 */
function exportIngredientsJSON() {
    try {
        const ingredients = loadIngredients();
        const dataStr = JSON.stringify(ingredients, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ingredients_${getTodayString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('データをエクスポートしました', 'success');
    } catch (error) {
        handleError(error, 'exportIngredientsJSON');
    }
}

/**
 * Import ingredients from JSON file
 * @param {File} file - JSON file to import
 */
function importIngredientsJSON(file) {
    try {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format');
                }

                // Validate and save
                data.forEach(item => {
                    const validation = validateIngredient(item);
                    if (validation.valid) {
                        const ingredient = createIngredient(item);
                        addIngredient(ingredient);
                    }
                });

                showNotification('データをインポートしました', 'success');
                refreshGanttDisplay();
            } catch (error) {
                handleError(error, 'importIngredientsJSON - parse');
            }
        };

        reader.readAsText(file);
    } catch (error) {
        handleError(error, 'importIngredientsJSON');
    }
}

/**
 * Clear all data with confirmation
 */
function clearAllData() {
    const confirmed = confirm('すべてのデータを削除してもよろしいですか？この操作は取り消せません。');

    if (confirmed) {
        const success = clearAllIngredients();

        if (success) {
            showNotification('すべてのデータを削除しました', 'success');
            refreshGanttDisplay();
        } else {
            showNotification('削除に失敗しました', 'error');
        }
    }
}

/**
 * Log application statistics
 */
function logStats() {
    const ingredients = loadIngredients();
    const stats = getIngredientStats(ingredients);
    const storageInfo = getStorageInfo();

    console.log('=== 賞味期限管理アプリ 統計情報 ===');
    console.log(`総数: ${stats.total}`);
    console.log(`新鮮: ${stats.fresh}`);
    console.log(`注意: ${stats.warning}`);
    console.log(`要注意: ${stats.critical}`);
    console.log(`期限切れ: ${stats.expired}`);
    console.log('\nカテゴリー別:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
    });
    console.log(`\nストレージ使用量: ${storageInfo.sizeKB} KB`);
    console.log('===========================');
}

// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM already loaded
    initApp();
}

// Expose utility functions to window for console access
window.addSampleIngredients = addSampleIngredients;
window.exportIngredientsJSON = exportIngredientsJSON;
window.clearAllData = clearAllData;
window.logStats = logStats;

// Log helpful message to console
console.log('%c賞味期限管理アプリ', 'font-size: 20px; font-weight: bold; color: #3B82F6;');
console.log('便利なコマンド:');
console.log('  addSampleIngredients() - サンプルデータを追加');
console.log('  exportIngredientsJSON() - データをJSON形式でエクスポート');
console.log('  clearAllData() - すべてのデータを削除');
console.log('  logStats() - 統計情報を表示');
