
/* ========================================
   SPENDWISE — Forms, Modals, Filters
   Loaded on pages that need interaction
======================================== */

(() => {
    'use strict';

    /* ---------- 1. Modal Manager ---------- */
    function openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        const focusable = modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable) {
            setTimeout(() => focusable.focus(), 50);
        }
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;

        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Delegate open/close
    document.addEventListener('click', e => {
        const opener = e.target.closest('[data-open-modal]');

        if (opener) {
            e.preventDefault();
            openModal(opener.dataset.openModal);
        }

        const closer = e.target.closest('[data-close-modal]');

        if (closer) {
            e.preventDefault();

            const modal = closer.closest('.modal');

            if (modal) {
                closeModal(modal.id);
            }
        }
    });

    // ESC to close
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m => {
                closeModal(m.id);
            });
        }
    });

    // Trap focus inside modal
    document.addEventListener('focusin', e => {
        const openModalEl = document.querySelector('.modal[aria-hidden="false"]');

        if (openModalEl && !openModalEl.contains(e.target)) {
            e.stopPropagation();

            const focusable = openModalEl.querySelector(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusable) focusable.focus();
        }
    });


    /* ---------- 2. Password Toggle ---------- */
    document.addEventListener('click', e => {
        const btn = e.target.closest('[data-toggle-password]');

        if (!btn) return;

        const targetId = btn.dataset.togglePassword;
        const input = document.getElementById(targetId);

        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁';
        }
    });


    /* ---------- 3. Form Validation Helpers ---------- */
    function showError(input, msg) {
        const field = input.closest('.form-field');

        if (!field) return;

        const err = field.querySelector(
            `.form-error[data-for="${input.id}"]`
        );

        if (err) {
            err.textContent = msg;
            err.classList.add('visible');
        }

        input.classList.add('error');
    }

    function clearError(input) {
        const field = input.closest('.form-field');

        if (!field) return;

        const err = field.querySelector(
            `.form-error[data-for="${input.id}"]`
        );

        if (err) {
            err.textContent = '';
            err.classList.remove('visible');
        }

        input.classList.remove('error');
    }

    function validateField(input) {
        clearError(input);

        if (input.required && !input.value.trim()) {
            showError(input, 'This field is required');
            return false;
        }

        if (
            input.type === 'email' &&
            input.value &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)
        ) {
            showError(input, 'Enter a valid email');
            return false;
        }

        if (
            input.type === 'number' &&
            input.value &&
            parseFloat(input.value) < (parseFloat(input.min) || 0)
        ) {
            showError(input, `Value must be at least ${input.min || 0}`);
            return false;
        }

        if (input.minLength && input.value.length < input.minLength) {
            showError(input, `Minimum ${input.minLength} characters`);
            return false;
        }

        if (input.id === 'reg-confirm') {
            const pwd = document.getElementById('reg-password');

            if (pwd && input.value !== pwd.value) {
                showError(input, 'Passwords do not match');
                return false;
            }
        }

        return true;
    }

    // Live validation
    document.addEventListener('input', e => {
        if (e.target.matches('input, select, textarea')) {
            validateField(e.target);
        }
    });

    // Blur validation
    document.addEventListener('blur', e => {
        if (
            e.target.matches(
                'input[required], select[required], textarea[required]'
            )
        ) {
            validateField(e.target);
        }
    }, true);


    /* ---------- 4. Expense Form Submit (Add/Edit) ---------- */
    const expenseForm = document.getElementById('expense-form');

    if (expenseForm) {
        expenseForm.addEventListener('submit', e => {
            const inputs = expenseForm.querySelectorAll(
                'input[required], select[required]'
            );

            let valid = true;

            inputs.forEach(input => {
                if (!validateField(input)) {
                    valid = false;
                }
            });

            // Stop submission only if validation fails.
            // Otherwise, Django receives a normal POST request.
            if (!valid) {
                e.preventDefault();
            }
        });
    }


    /* ---------- 5. Profile Form Submit ---------- */
    const profileForm = document.getElementById('profile-form');

    if (profileForm) {
        profileForm.addEventListener('submit', async e => {
            e.preventDefault();

            const data = new FormData(profileForm);

            try {
                const res = await fetch(profileForm.action, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': data.get('csrfmiddlewaretoken') || ''
                    },
                    body: JSON.stringify(Object.fromEntries(data)),
                });

                if (res.ok) {
                    window.toast.success('Profile updated');
                } else {
                    window.toast.error('Failed to update');
                }
            } catch {
                window.toast.error('Network error');
            }
        });
    }


    /* ---------- 6. Preferences Save ---------- */
    const savePrefs = document.getElementById('save-prefs');

    if (savePrefs) {
        savePrefs.addEventListener('click', () => {
            const currency = document.getElementById('currency-select')?.value;
            const theme = document.getElementById('theme-toggle')?.checked;

            if (currency) {
                localStorage.setItem('sw_currency', currency);

                if (window.setCurrency) {
                    window.setCurrency(currency);
                }
            }

            if (theme) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }

            localStorage.setItem(
                'sw_theme',
                theme ? 'dark' : 'light'
            );

            window.toast.success('Preferences saved');
        });
    }

    // Apply saved theme on load
    if (localStorage.getItem('sw_theme') === 'dark') {
        document.body.classList.add('dark');
    }


    /* ---------- 7. Transactions Page: Search, Filters, Category Chips ---------- */
    const txRows = document.getElementById('tx-rows');
    const txEmpty = document.getElementById('tx-empty');
    const txCount = document.getElementById('tx-count');
    const searchInput = document.getElementById('search-input');
    const chipButtons = document.querySelectorAll('#chip-row .chip');
    const filterApply = document.getElementById('filter-apply');
    const filterClear = document.getElementById('filter-clear');
    const filterCategory = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');
    const filterFrom = document.getElementById('filter-from');
    const filterTo = document.getElementById('filter-to');

    let currentFilters = {
        search: '',
        category: 'all',
        type: 'all',
        from: null,
        to: null,
    };

    function parseDateSafe(val) {
        if (!val) return null;

        const d = new Date(val);

        return isNaN(d) ? null : d;
    }

    function rowMatches(row) {
        const cat = row.dataset.category;
        const title = (row.dataset.title || '').toLowerCase();
        const type = row.dataset.type;

        // Search
        if (
            currentFilters.search &&
            !title.includes(currentFilters.search)
        ) {
            return false;
        }

        // Category
        if (
            currentFilters.category !== 'all' &&
            cat !== currentFilters.category
        ) {
            return false;
        }

        // Type
        if (
            currentFilters.type !== 'all' &&
            type !== currentFilters.type
        ) {
            return false;
        }

        // Date range
        const dateCell = row.querySelector('td:nth-child(4)');

        if (dateCell) {
            const rowDate = parseDateSafe(dateCell.textContent.trim());

            if (currentFilters.from && rowDate < currentFilters.from) {
                return false;
            }

            if (currentFilters.to && rowDate > currentFilters.to) {
                return false;
            }
        }

        return true;
    }

    function applyFilters() {
        if (!txRows) return;

        let visible = 0;

        txRows.querySelectorAll('tr').forEach(row => {
            const show = rowMatches(row);

            row.style.display = show ? '' : 'none';

            if (show) visible++;
        });

        if (txEmpty) {
            txEmpty.hidden = visible > 0;
        }

        if (txCount) {
            const total = txRows.querySelectorAll('tr').length;

            txCount.textContent =
                `Showing ${visible} of ${total} transaction${total !== 1 ? 's' : ''}`;
        }
    }

    // Search input
    if (searchInput) {
        let debounce;

        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);

            debounce = setTimeout(() => {
                currentFilters.search = searchInput.value.trim().toLowerCase();
                applyFilters();
            }, 150);
        });
    }

    // Category chips
    chipButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            chipButtons.forEach(b => b.classList.remove('active'));

            btn.classList.add('active');

            currentFilters.category = btn.dataset.category;

            applyFilters();
        });
    });

    // Filter modal apply
    if (filterApply) {
        filterApply.addEventListener('click', () => {
            currentFilters.category = filterCategory?.value || 'all';
            currentFilters.type = filterType?.value || 'all';
            currentFilters.from = parseDateSafe(filterFrom?.value);
            currentFilters.to = parseDateSafe(filterTo?.value);

            // Sync chips
            chipButtons.forEach(b => {
                b.classList.toggle(
                    'active',
                    b.dataset.category === currentFilters.category
                );
            });

            applyFilters();
            closeModal('filter-modal');
        });
    }

    // Clear filters
    if (filterClear) {
        filterClear.addEventListener('click', () => {
            if (filterCategory) filterCategory.value = 'all';
            if (filterType) filterType.value = 'all';
            if (filterFrom) filterFrom.value = '';
            if (filterTo) filterTo.value = '';

            currentFilters.category = 'all';
            currentFilters.type = 'all';
            currentFilters.from = null;
            currentFilters.to = null;

            chipButtons.forEach(b => {
                b.classList.toggle(
                    'active',
                    b.dataset.category === 'all'
                );
            });

            applyFilters();
        });
    }




    /* ---------- 8. Export / Delete Account (Settings) ---------- */
    const exportBtn = document.getElementById('export-btn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.toast.info('CSV export — implement Django view');
        });
    }

    const deleteBtn = document.getElementById('delete-account');

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (
                confirm(
                    'This permanently deletes your account and all data. Are you absolutely sure?'
                )
            ) {
                window.toast.warning('Account deletion — implement Django view');
            }
        });
    }

})();
