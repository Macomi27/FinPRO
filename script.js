/**
 * FinPRO - Simple Financial Tracker
 * Pure Vanilla JavaScript (Client-side with localStorage)
 */

(function () {
  'use strict';

  // Storage Key
  const STORAGE_KEY = 'finpro_transactions_data';

  // State
  let transactions = [];
  let editingId = null;
  let currentFilter = 'all';
  let searchQuery = '';
  let transactionToDelete = null;

  // DOM Elements
  const totalIncomingEl = document.getElementById('total-incoming');
  const totalOutgoingEl = document.getElementById('total-outgoing');
  const netBalanceEl = document.getElementById('net-balance');

  const form = document.getElementById('transaction-form');
  const formTitle = document.getElementById('form-title');
  const editIdInput = document.getElementById('edit-id');
  const itemInput = document.getElementById('item-input');
  const amountInput = document.getElementById('amount-input');
  const itemError = document.getElementById('item-error');
  const amountError = document.getElementById('amount-error');
  const submitBtnText = document.getElementById('submit-btn-text');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  const transactionsList = document.getElementById('transactions-list');
  const itemCountEl = document.getElementById('item-count');
  const emptyState = document.getElementById('empty-state');
  const emptyStateTitle = document.getElementById('empty-state-title');
  const emptyStateText = document.getElementById('empty-state-text');

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterTabs = document.querySelectorAll('.filter-tab');

  // Modal Elements
  const confirmModal = document.getElementById('confirm-modal');
  const confirmModalMessage = document.getElementById('confirm-modal-message');
  const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  // --- Currency & Date Formatting Helpers ---
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    
    // Check if same calendar day
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  // --- LocalStorage Operations ---
  function loadTransactions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      transactions = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(transactions)) transactions = [];
    } catch (e) {
      console.error('Could not load transactions from localStorage:', e);
      transactions = [];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Could not save transactions to localStorage:', e);
      alert('Unable to save transaction. Local storage might be full or disabled.');
    }
  }

  // --- Financial Summary Calculation ---
  function updateSummary() {
    let incoming = 0;
    let outgoing = 0;

    transactions.forEach((txn) => {
      const val = parseFloat(txn.amount) || 0;
      if (txn.type === 'incoming') {
        incoming += val;
      } else {
        outgoing += val;
      }
    });

    const net = incoming - outgoing;

    totalIncomingEl.textContent = formatCurrency(incoming);
    totalOutgoingEl.textContent = formatCurrency(outgoing);
    netBalanceEl.textContent = formatCurrency(net);

    // Dynamic Net Balance Color
    netBalanceEl.classList.remove('positive', 'negative');
    if (net > 0) {
      netBalanceEl.style.color = 'var(--income)';
    } else if (net < 0) {
      netBalanceEl.style.color = 'var(--expense)';
    } else {
      netBalanceEl.style.color = '#ffffff';
    }
  }

  // --- Render Transaction List ---
  function renderTransactions() {
    updateSummary();

    // Filter by type
    let filtered = transactions.filter((txn) => {
      if (currentFilter === 'all') return true;
      return txn.type === currentFilter;
    });

    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((txn) => {
        const itemMatch = txn.item.toLowerCase().includes(q);
        const amountMatch = txn.amount.toString().includes(q) || formatCurrency(txn.amount).toLowerCase().includes(q);
        return itemMatch || amountMatch;
      });
    }

    // Update item count badge
    itemCountEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`;

    // Handle Empty State
    if (filtered.length === 0) {
      transactionsList.innerHTML = '';
      emptyState.style.display = 'flex';

      if (transactions.length === 0) {
        emptyStateTitle.textContent = 'No transactions yet';
        emptyStateText.textContent = 'Your financial list is clean and fresh. Add your first incoming or outgoing transaction above to get started!';
      } else {
        emptyStateTitle.textContent = 'No matching transactions';
        emptyStateText.textContent = `No records found matching "${searchQuery}". Try a different keyword or clear your search.`;
      }
      return;
    }

    emptyState.style.display = 'none';

    // Render Rows
    transactionsList.innerHTML = filtered
      .map((txn) => {
        const isIncoming = txn.type === 'incoming';
        const sign = isIncoming ? '+' : '-';
        const typeBadgeText = isIncoming ? 'Incoming' : 'Outgoing';
        const arrowSvg = isIncoming
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;

        return `
          <li class="transaction-item" data-id="${txn.id}">
            <div class="txn-left">
              <div class="txn-icon ${txn.type}" aria-hidden="true">
                ${arrowSvg}
              </div>
              <div class="txn-details">
                <span class="txn-item-name" title="${escapeHtml(txn.item)}">${escapeHtml(txn.item)}</span>
                <div class="txn-meta">
                  <span class="txn-type-badge ${txn.type}">${typeBadgeText}</span>
                  <span>•</span>
                  <span>${formatDate(txn.date)}</span>
                </div>
              </div>
            </div>

            <div class="txn-right">
              <span class="txn-amount ${txn.type}">
                ${sign}${formatCurrency(txn.amount)}
              </span>
              <div class="txn-actions">
                <button type="button" class="icon-btn edit-btn" data-action="edit" data-id="${txn.id}" title="Edit transaction" aria-label="Edit ${escapeHtml(txn.item)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button type="button" class="icon-btn delete-btn" data-action="delete" data-id="${txn.id}" title="Delete transaction" aria-label="Delete ${escapeHtml(txn.item)}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </li>
        `;
      })
      .join('');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Form Validation & Submission ---
  function clearErrors() {
    itemError.textContent = '';
    amountError.textContent = '';
  }

  function resetForm() {
    form.reset();
    editIdInput.value = '';
    editingId = null;
    formTitle.textContent = 'Add Transaction';
    submitBtnText.textContent = 'Add Record';
    cancelEditBtn.style.display = 'none';
    clearErrors();
    document.getElementById('type-incoming').checked = true;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const itemVal = itemInput.value.trim();
    const amountVal = parseFloat(amountInput.value);
    const selectedType = form.elements['type'].value;

    let hasError = false;

    if (!itemVal) {
      itemError.textContent = 'Please enter a description or item name.';
      itemInput.focus();
      hasError = true;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      amountError.textContent = 'Please enter a valid amount greater than $0.00.';
      if (!hasError) amountInput.focus();
      hasError = true;
    }

    if (hasError) return;

    if (editingId) {
      // Update existing record
      const index = transactions.findIndex((t) => t.id === editingId);
      if (index !== -1) {
        transactions[index].item = itemVal;
        transactions[index].amount = Math.round(amountVal * 100) / 100;
        transactions[index].type = selectedType;
      }
      resetForm();
    } else {
      // Add new record
      const newTxn = {
        id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        item: itemVal,
        amount: Math.round(amountVal * 100) / 100,
        type: selectedType,
        date: new Date().toISOString(),
      };
      transactions.unshift(newTxn);
      resetForm();
    }

    saveTransactions();
    renderTransactions();
  });

  // --- Edit Transaction Workflow ---
  function startEdit(id) {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;

    editingId = id;
    editIdInput.value = txn.id;
    itemInput.value = txn.item;
    amountInput.value = txn.amount.toFixed(2);

    if (txn.type === 'incoming') {
      document.getElementById('type-incoming').checked = true;
    } else {
      document.getElementById('type-outgoing').checked = true;
    }

    formTitle.textContent = 'Edit Transaction';
    submitBtnText.textContent = 'Update Record';
    cancelEditBtn.style.display = 'inline-block';
    clearErrors();

    // Scroll form into view smoothly
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    itemInput.focus();
  }

  cancelEditBtn.addEventListener('click', resetForm);

  // --- Delete Transaction with Confirmation Modal ---
  function showDeleteConfirm(id) {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;

    transactionToDelete = txn;
    confirmModalMessage.textContent = `Are you sure you want to delete "${txn.item}" (${formatCurrency(txn.amount)})? This action cannot be undone.`;
    confirmModal.style.display = 'flex';
  }

  function closeDeleteModal() {
    confirmModal.style.display = 'none';
    transactionToDelete = null;
  }

  confirmCancelBtn.addEventListener('click', closeDeleteModal);

  confirmDeleteBtn.addEventListener('click', function () {
    if (!transactionToDelete) return;
    const id = transactionToDelete.id;
    transactions = transactions.filter((t) => t.id !== id);

    // If currently editing this transaction, reset form
    if (editingId === id) {
      resetForm();
    }

    saveTransactions();
    closeDeleteModal();
    renderTransactions();
  });

  // Close modal when clicking outside modal card
  confirmModal.addEventListener('click', function (e) {
    if (e.target === confirmModal) {
      closeDeleteModal();
    }
  });

  // Keyboard shortcut: Escape closes modal
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && confirmModal.style.display === 'flex') {
      closeDeleteModal();
    }
  });

  // --- Event Delegation for Edit & Delete buttons ---
  transactionsList.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'edit') {
      startEdit(id);
    } else if (action === 'delete') {
      showDeleteConfirm(id);
    }
  });

  // --- Search Feature ---
  searchInput.addEventListener('input', function () {
    searchQuery = searchInput.value;
    clearSearchBtn.style.display = searchQuery.length > 0 ? 'block' : 'none';
    renderTransactions();
  });

  clearSearchBtn.addEventListener('click', function () {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderTransactions();
  });

  // --- Filter Tabs ---
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      filterTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter');
      renderTransactions();
    });
  });

  // --- Initialization ---
  loadTransactions();
  renderTransactions();
})();

