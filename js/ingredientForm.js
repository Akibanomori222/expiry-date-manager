// ingredientForm.js - Form handling for adding and editing ingredients

let currentEditingId = null;

/**
 * Open the add ingredient form
 */
function openAddForm() {
    currentEditingId = null;

    const modal = document.getElementById('ingredientModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('ingredientForm');

    modalTitle.textContent = 'アイテムを追加';
    form.reset();
    clearFormErrors();

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Focus on name input
    setTimeout(() => {
        document.getElementById('ingredientName').focus();
    }, 100);
}

/**
 * Open the edit ingredient form
 * @param {string} id - Ingredient ID to edit
 */
function openEditForm(id) {
    const ingredient = getIngredientById(id);

    if (!ingredient) {
        showNotification('アイテムが見つかりません', 'error');
        return;
    }

    currentEditingId = id;

    const modal = document.getElementById('ingredientModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('ingredientForm');

    modalTitle.textContent = 'アイテムを編集';

    // Populate form with ingredient data
    document.getElementById('ingredientId').value = ingredient.id;
    document.getElementById('ingredientName').value = ingredient.name;
    document.getElementById('ingredientCategory').value = ingredient.category;
    document.getElementById('expirationDate').value = ingredient.expirationDate;
    document.getElementById('location').value = ingredient.location || '';
    document.getElementById('notes').value = ingredient.notes || '';

    clearFormErrors();

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    // Focus on name input
    setTimeout(() => {
        document.getElementById('ingredientName').focus();
    }, 100);
}

/**
 * Close the form modal
 */
function closeForm() {
    const modal = document.getElementById('ingredientModal');
    const form = document.getElementById('ingredientForm');

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    form.reset();
    clearFormErrors();
    currentEditingId = null;
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
function handleFormSubmit(event) {
    event.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('ingredientName').value,
        category: document.getElementById('ingredientCategory').value,
        expirationDate: document.getElementById('expirationDate').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value
    };

    // Validate
    const validation = validateIngredient(formData);

    if (!validation.valid) {
        displayFormErrors(validation.errors);
        return;
    }

    // Clear errors
    clearFormErrors();

    // Save or update
    if (currentEditingId) {
        // Update existing ingredient
        const success = updateIngredient(currentEditingId, formData);

        if (success) {
            showNotification('更新しました', 'success');
            closeForm();
            refreshGanttDisplay();
        } else {
            showNotification('更新に失敗しました', 'error');
        }
    } else {
        // Create new ingredient
        const ingredient = createIngredient(formData);
        const success = addIngredient(ingredient);

        if (success) {
            showNotification('追加しました', 'success');
            closeForm();
            refreshGanttDisplay();
        } else {
            showNotification('追加に失敗しました', 'error');
        }
    }
}

/**
 * Display form validation errors
 * @param {Object} errors - Error messages by field name
 */
function displayFormErrors(errors) {
    clearFormErrors();

    Object.keys(errors).forEach(field => {
        const errorElement = document.getElementById(`${field}Error`);
        const inputElement = document.getElementById(
            field === 'name' ? 'ingredientName' :
            field === 'category' ? 'ingredientCategory' :
            field
        );

        if (errorElement) {
            errorElement.textContent = errors[field];
        }

        if (inputElement) {
            inputElement.classList.add('error');
            inputElement.setAttribute('aria-invalid', 'true');
        }
    });

    // Show first error in notification
    const firstError = Object.values(errors)[0];
    showNotification(firstError, 'warning');
}

/**
 * Clear all form validation errors
 */
function clearFormErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
    });

    const inputElements = document.querySelectorAll('.form-input, .form-select');
    inputElements.forEach(el => {
        el.classList.remove('error');
        el.removeAttribute('aria-invalid');
    });
}

/**
 * Confirm and delete ingredient
 * @param {string} id - Ingredient ID to delete
 */
function confirmDeleteIngredient(id) {
    const ingredient = getIngredientById(id);

    if (!ingredient) {
        showNotification('アイテムが見つかりません', 'error');
        return;
    }

    const confirmed = confirm(`「${ingredient.name}」を食べましたか？ 🍽️`);

    if (confirmed) {
        const success = deleteIngredient(id);

        if (success) {
            showNotification('🎉 美味しくいただきました！', 'success');
            refreshGanttDisplay();
        } else {
            showNotification('削除に失敗しました', 'error');
        }
    }
}

/**
 * Initialize form event listeners
 */
function initFormListeners() {
    // Add button
    const addBtn = document.getElementById('addIngredientBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddForm);
    }

    // Form submit
    const form = document.getElementById('ingredientForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeForm);
    }

    // Close button
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeForm);
    }

    // Overlay click
    const overlay = document.getElementById('modalOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeForm);
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('ingredientModal');
            if (modal && modal.classList.contains('active')) {
                closeForm();
            }
        }
    });

    // Real-time validation on blur
    const nameInput = document.getElementById('ingredientName');
    if (nameInput) {
        nameInput.addEventListener('blur', () => {
            const value = nameInput.value.trim();
            const errorEl = document.getElementById('nameError');

            if (!value) {
                errorEl.textContent = '名前を入力してください';
                nameInput.classList.add('error');
            } else {
                errorEl.textContent = '';
                nameInput.classList.remove('error');
            }
        });
    }

    const categorySelect = document.getElementById('ingredientCategory');
    if (categorySelect) {
        categorySelect.addEventListener('blur', () => {
            const value = categorySelect.value;
            const errorEl = document.getElementById('categoryError');

            if (!value) {
                errorEl.textContent = 'カテゴリーを選択してください';
                categorySelect.classList.add('error');
            } else {
                errorEl.textContent = '';
                categorySelect.classList.remove('error');
            }
        });
    }

    const expirationInput = document.getElementById('expirationDate');
    if (expirationInput) {
        expirationInput.addEventListener('blur', () => {
            const value = expirationInput.value;
            const errorEl = document.getElementById('expirationDateError');

            if (!value) {
                errorEl.textContent = '賞味期限を入力してください';
                expirationInput.classList.add('error');
            } else {
                errorEl.textContent = '';
                expirationInput.classList.remove('error');
            }
        });
    }
}
