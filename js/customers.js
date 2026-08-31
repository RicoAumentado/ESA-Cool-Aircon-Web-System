import { supabase } from './supabase.js';

const customerTableBody = document.getElementById('customerTableBody');
const customerSearch = document.getElementById('customerSearch');
const customerModal = document.getElementById('customerModal');
const customerForm = document.getElementById('customerForm');
const customerModalTitle = document.getElementById('customerModalTitle');

const customerIdInput = document.getElementById('customerId');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const customerAddressInput = document.getElementById('customerAddress');
const customerNotesInput = document.getElementById('customerNotes');

const addCustomerBtn = document.getElementById('addCustomerBtn');
const closeCustomerModal = document.getElementById('closeCustomerModal');
const cancelCustomerBtn = document.getElementById('cancelCustomerBtn');

let customers = [];

function openCustomerModal(customer = null) {
  customerModal.classList.remove('hidden');

  if (!customer) {
    customerModalTitle.textContent = 'Add Customer';
    customerForm.reset();
    customerIdInput.value = '';
    return;
  }

  customerModalTitle.textContent = 'Edit Customer';
  customerIdInput.value = customer.id;
  customerNameInput.value = customer.full_name || '';
  customerPhoneInput.value = customer.phone_number || '';
  customerAddressInput.value = customer.address || '';
  customerNotesInput.value = customer.notes || '';
}

function closeCustomerModalDialog() {
  customerModal.classList.add('hidden');
  customerForm.reset();
  customerIdInput.value = '';
}

function formatCustomerTableRow(customer) {
  return `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="font-semibold text-slate-800">${customer.full_name || 'Unnamed Customer'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-600">${customer.phone_number || '—'}</td>
      <td class="px-6 py-4 text-slate-600 max-w-xs">${customer.address || '—'}</td>
      <td class="px-6 py-4 text-slate-600 max-w-sm">${customer.notes || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <div class="flex justify-end gap-2">
          <button data-action="edit" data-id="${customer.id}" class="table-action-btn edit">Edit</button>
          <button data-action="delete" data-id="${customer.id}" class="table-action-btn delete">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function renderCustomers(list) {
  if (!customerTableBody) return;

  if (!list.length) {
    customerTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No customers found.</td></tr>';
    return;
  }

  customerTableBody.innerHTML = list.map(formatCustomerTableRow).join('');
}

async function loadCustomers() {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }

  customers = data || [];
  renderCustomers(customers);
}

function applySearch() {
  const query = customerSearch.value.trim().toLowerCase();
  if (!query) {
    renderCustomers(customers);
    return;
  }

  const filtered = customers.filter((customer) => {
    const searchable = `${customer.full_name || ''} ${customer.phone_number || ''}`.toLowerCase();
    return searchable.includes(query);
  });

  renderCustomers(filtered);
}

if (customerSearch) {
  customerSearch.addEventListener('input', applySearch);
}

if (addCustomerBtn) {
  addCustomerBtn.addEventListener('click', () => openCustomerModal());
}

if (closeCustomerModal) {
  closeCustomerModal.addEventListener('click', closeCustomerModalDialog);
}

if (cancelCustomerBtn) {
  cancelCustomerBtn.addEventListener('click', closeCustomerModalDialog);
}

if (customerModal) {
  customerModal.addEventListener('click', (event) => {
    if (event.target === customerModal) closeCustomerModalDialog();
  });
}

if (customerForm) {
  customerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
      full_name: customerNameInput.value.trim(),
      phone_number: customerPhoneInput.value.trim(),
      address: customerAddressInput.value.trim(),
      notes: customerNotesInput.value.trim()
    };

    if (!payload.full_name || !payload.phone_number) {
      alert('Full name and phone number are required.');
      return;
    }

    const customerId = customerIdInput.value;

    let result;
    if (customerId) {
      result = await supabase.from('customers').update(payload).eq('id', customerId).select();
    } else {
      result = await supabase.from('customers').insert([payload]).select();
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    closeCustomerModalDialog();
    await loadCustomers();
  });
}

if (customerTableBody) {
  customerTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const customerId = button.dataset.id;
    const action = button.dataset.action;
    const customer = customers.find((entry) => entry.id === customerId);

    if (!customer) return;

    if (action === 'edit') {
      openCustomerModal(customer);
    }

    if (action === 'delete') {
      const confirmDelete = window.confirm(`Delete ${customer.full_name}? This will also remove their aircon units.`);
      if (!confirmDelete) return;

      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) {
        alert(error.message);
      } else {
        await loadCustomers();
      }
    }
  });
}

loadCustomers();
