// ganttChart.js - Gantt chart rendering and visualization

const TIMELINE_DAYS = 90; // 3 months

/**
 * Create timeline header with dates
 * @returns {DocumentFragment} Timeline header element
 */
function createTimelineHeader() {
    const fragment = document.createDocumentFragment();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < TIMELINE_DAYS; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const dateEl = document.createElement('div');
        dateEl.className = 'timeline-date';
        dateEl.textContent = `${date.getMonth() + 1}/${date.getDate()}`;

        // Mark special dates
        if (i === 0) {
            dateEl.classList.add('today');
        }
        if (date.getDay() === 0) {  // Sunday
            dateEl.classList.add('week-start');
        }
        if (date.getDate() === 1) {  // First day of month
            dateEl.classList.add('month-start');
        }

        dateEl.setAttribute('data-date', date.toISOString().split('T')[0]);
        fragment.appendChild(dateEl);
    }

    return fragment;
}

/**
 * Calculate bar position and width based on dates
 * @param {Object} ingredient - Ingredient object
 * @returns {Object} Position data { left, width, visible }
 */
function calculateBarPosition(ingredient) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const purchaseDate = ingredient.purchaseDate ?
        new Date(ingredient.purchaseDate) :
        new Date(today);
    purchaseDate.setHours(0, 0, 0, 0);

    const expirationDate = new Date(ingredient.expirationDate);
    expirationDate.setHours(0, 0, 0, 0);

    // Calculate position from today
    const daysFromToday = Math.floor((purchaseDate - today) / (1000 * 60 * 60 * 24));
    const leftPercent = Math.max(0, (daysFromToday / TIMELINE_DAYS) * 100);

    // Calculate duration
    const duration = Math.floor((expirationDate - purchaseDate) / (1000 * 60 * 60 * 24));
    const widthPercent = (duration / TIMELINE_DAYS) * 100;

    // Check if visible in timeline
    const expirationDaysFromToday = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));
    const visible = expirationDaysFromToday >= 0 && daysFromToday < TIMELINE_DAYS;

    return {
        left: Math.min(leftPercent, 100),
        width: Math.max(0, Math.min(widthPercent, 100 - leftPercent)),
        visible: visible,
        daysFromToday: daysFromToday,
        duration: duration
    };
}

/**
 * Create ingredient row element
 * @param {Object} ingredient - Ingredient object
 * @param {Function} onEdit - Edit callback
 * @param {Function} onDelete - Delete callback
 * @returns {HTMLElement} Row element
 */
function createIngredientRow(ingredient, onEdit, onDelete) {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.setAttribute('data-id', ingredient.id);

    // Create label column
    const labelCol = document.createElement('div');
    labelCol.className = 'ingredient-label';

    const name = document.createElement('div');
    name.className = 'ingredient-name';
    name.textContent = ingredient.name;

    const category = document.createElement('div');
    category.className = 'ingredient-category';
    category.textContent = ingredient.category;

    const meta = document.createElement('div');
    meta.className = 'ingredient-meta';

    if (ingredient.quantity) {
        const quantity = document.createElement('span');
        quantity.textContent = ingredient.quantity;
        meta.appendChild(quantity);
    }

    if (ingredient.location) {
        const location = document.createElement('span');
        location.textContent = ingredient.location;
        meta.appendChild(location);
    }

    const actions = document.createElement('div');
    actions.className = 'ingredient-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn action-btn-edit';
    editBtn.textContent = '✏️';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        onEdit(ingredient.id);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn action-btn-ate';
    deleteBtn.innerHTML = '🍽️ 食べた！';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        // Add celebration animation
        deleteBtn.classList.add('celebrating');
        setTimeout(() => {
            onDelete(ingredient.id);
        }, 300);
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    labelCol.appendChild(name);
    labelCol.appendChild(category);
    if (meta.children.length > 0) {
        labelCol.appendChild(meta);
    }
    labelCol.appendChild(actions);

    // Create timeline column
    const timelineCol = document.createElement('div');
    timelineCol.className = 'timeline-bars';

    // Calculate bar position
    const position = calculateBarPosition(ingredient);

    if (position.visible && position.width > 0) {
        const bar = document.createElement('div');
        bar.className = 'timeline-bar';

        // Apply status class
        const status = getExpirationStatus(ingredient);
        bar.classList.add(`status-${status}`);

        // Set position
        bar.style.left = `${position.left}%`;
        bar.style.width = `${position.width}%`;

        // Bar content
        const barContent = document.createElement('div');
        barContent.className = 'timeline-bar-content';

        const daysRemaining = calculateDaysRemaining(ingredient.expirationDate);
        const barText = document.createElement('span');
        barText.className = 'bar-text';

        if (daysRemaining < 0) {
            barText.textContent = `期限切れ (${Math.abs(daysRemaining)}日前)`;
        } else if (daysRemaining === 0) {
            barText.textContent = '今日期限';
        } else {
            barText.textContent = `あと${daysRemaining}日`;
        }

        barContent.appendChild(barText);
        bar.appendChild(barContent);

        // Add tooltip
        bar.title = `${ingredient.name}\n購入: ${formatDateJP(ingredient.purchaseDate || getTodayString())}\n期限: ${formatDateJP(ingredient.expirationDate)}\nあと${daysRemaining}日`;

        timelineCol.appendChild(bar);
    }

    row.appendChild(labelCol);
    row.appendChild(timelineCol);

    return row;
}

/**
 * Create "today" indicator line
 * @returns {HTMLElement} Today indicator element
 */
function createTodayIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'today-indicator';
    indicator.style.left = '0%';
    return indicator;
}

/**
 * Render the Gantt chart
 * @param {Array} ingredients - Array of ingredients to display
 * @param {Function} onEdit - Edit callback
 * @param {Function} onDelete - Delete callback
 */
function renderGanttChart(ingredients, onEdit, onDelete) {
    const timelineHeader = document.getElementById('timelineHeader');
    const ganttBody = document.getElementById('ganttBody');
    const emptyState = document.getElementById('emptyState');

    // DOM not ready yet, skip rendering
    if (!timelineHeader || !ganttBody || !emptyState) {
        return;
    }

    // Clear existing content
    timelineHeader.innerHTML = '';
    ganttBody.innerHTML = '';

    // Render timeline header
    const headerFragment = createTimelineHeader();
    timelineHeader.appendChild(headerFragment);

    // Check if there are ingredients
    if (!ingredients || ingredients.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Sort ingredients by expiration date
    const sortedIngredients = sortIngredients(ingredients, 'expiration', 'asc');

    // Render ingredient rows
    const fragment = document.createDocumentFragment();

    sortedIngredients.forEach(ingredient => {
        const row = createIngredientRow(ingredient, onEdit, onDelete);
        fragment.appendChild(row);
    });

    ganttBody.appendChild(fragment);

    // Add today indicator to all timeline bars
    addTodayIndicators();
}

/**
 * Add "today" indicator lines to all timeline bars
 */
function addTodayIndicators() {
    const timelineBars = document.querySelectorAll('.timeline-bars');

    timelineBars.forEach(timeline => {
        const indicator = createTodayIndicator();
        timeline.appendChild(indicator);
    });
}

/**
 * Update the Gantt chart (convenience function)
 */
function updateGanttChart() {
    const ingredients = loadIngredients();
    renderGanttChart(ingredients, openEditForm, confirmDeleteIngredient);
}

/**
 * Show no results message
 * @param {string} message - Message to display
 */
function showNoResults(message = '検索条件に一致するアイテムが見つかりません') {
    const ganttBody = document.getElementById('ganttBody');
    ganttBody.innerHTML = `
        <div class="no-results">
            <p class="no-results-text">${message}</p>
            <p class="no-results-hint">検索条件やフィルターを変更してください</p>
        </div>
    `;
}

/**
 * Show loading state
 */
function showLoading() {
    const ganttBody = document.getElementById('ganttBody');
    ganttBody.innerHTML = `
        <div class="gantt-loading">
            <div class="loading-spinner"></div>
        </div>
    `;
}

/**
 * Refresh the display based on current filters
 */
function refreshGanttDisplay() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilterEl = document.getElementById('categoryFilter');
    const statusFilterEl = document.getElementById('statusFilter');

    // DOM not ready yet, skip refresh
    if (!searchInput || !categoryFilterEl || !statusFilterEl) {
        return;
    }

    const searchQuery = searchInput.value;
    const categoryFilter = categoryFilterEl.value;
    const statusFilter = statusFilterEl.value;

    let ingredients = loadIngredients();

    // Apply filters
    if (searchQuery || categoryFilter || statusFilter) {
        ingredients = filterIngredients(ingredients, {
            search: searchQuery,
            category: categoryFilter,
            status: statusFilter
        });

        if (ingredients.length === 0) {
            showNoResults();
            return;
        }
    }

    renderGanttChart(ingredients, openEditForm, confirmDeleteIngredient);
}
