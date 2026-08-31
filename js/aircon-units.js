import { supabase } from './supabase.js';

const unitTableBody = document.getElementById('unitTableBody');
const unitCustomerFilter = document.getElementById('unitCustomerFilter');
const unitSearch = document.getElementById('unitSearch');
const unitModal = document.getElementById('unitModal');
const unitForm = document.getElementById('unitForm');
const unitModalTitle = document.getElementById('unitModalTitle');

const addUnitBtn = document.getElementById('addUnitBtn');
const closeUnitModal = document.getElementById('closeUnitModal');
const cancelUnitBtn = document.getElementById('cancelUnitBtn');
const unitCustomerIdSelect = document.getElementById('unitCustomerId');

let units = [];
let customers = [];

function formatDate(dateValue) {
  if (!dateValue) return 'Not set';
  const date = new Date(dateValue + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function calculateUnitStatus(unit) {
  if (!unit.next_cleaning_date) return 'Normal';
  const nextDate = new Date(`${unit.next_cleaning_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((nextDate - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 14) return 'Due for Cleaning';
  if (diffDays <= 30) return 'Upcoming Service';
  return 'Normal';
}

function getStatusClasses(status) {
  const map = {
    Normal: 'status-normal',
    'Upcoming Service': 'status-upcoming',
    'Due for Cleaning': 'status-due',
    Overdue: 'status-overdue'
  };

  return map[status] || 'status-normal';
}

function openUnitModal(unit = null) {
  unitModal.classList.remove('hidden');

  if (!unit) {
    unitModalTitle.textContent = 'Add Aircon Unit';
    unitForm.reset();
    document.getElementById('unitId').value = '';
    return;
  }

  unitModalTitle.textContent = 'Edit Aircon Unit';
  document.getElementById('unitId').value = unit.id;
  document.getElementById('unitCustomerId').value = unit.customer_id || '';
  document.getElementById('unitType').value = unit.aircon_type || 'Split Type';
  document.getElementById('unitBrand').value = unit.brand || '';
  document.getElementById('unitModel').value = unit.model || '';
  document.getElementById('unitHorsepower').value = unit.horsepower || '';
  document.getElementById('unitInstallationDate').value = unit.installation_date || '';
  document.getElementById('unitUsageFrequency').value = unit.usage_frequency || 'Regular usage';
  document.getElementById('unitLastCleaningDate').value = unit.last_cleaning_date || '';
  document.getElementById('unitRecommendedInterval').value = unit.recommended_cleaning_interval || 6;
  document.getElementById('unitStatus').value = unit.status || 'Normal';
}

function closeUnitModalDialog() {
  unitModal.classList.add('hidden');
  unitForm.reset();
  document.getElementById('unitId').value = '';
}

function renderUnitRows(list) {
  if (!unitTableBody) return;

  if (!list.length) {
    unitTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No aircon units found.</td></tr>';
    return;
  }

  unitTableBody.innerHTML = list.map((unit) => {
    const status = calculateUnitStatus(unit);
    return `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-slate-700">${unit.customers?.full_name || 'Customer'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-slate-700">${unit.aircon_type || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-slate-700">${unit.brand || 'N/A'} / ${unit.model || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-slate-700">${formatDate(unit.last_cleaning_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-slate-700">${formatDate(unit.next_cleaning_date)}</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="status-badge ${getStatusClasses(status)}">${status}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right">
          <div class="flex justify-end gap-2">
            <button data-action="edit" data-id="${unit.id}" class="table-action-btn edit">Edit</button>
            <button data-action="delete" data-id="${unit.id}" class="table-action-btn delete">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadCustomersForSelect() {
  const { data, error } = await supabase.from('customers').select('*').order('full_name');
  if (error) {
    console.error(error);
    return;
  }

  customers = data || [];
  const options = customers.map((customer) => `<option value="${customer.id}">${customer.full_name}</option>`).join('');

  if (unitCustomerIdSelect) {
    unitCustomerIdSelect.innerHTML = '<option value="">Select customer</option>' + options;
  }

  if (unitCustomerFilter) {
    unitCustomerFilter.innerHTML = '<option value="">All customers</option>' + options;
  }
}

async function loadUnits() {
  const { data, error } = await supabase.from('aircon_units').select('*, customers(full_name)').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }

  units = data || [];
  applyUnitFilters();
}

function applyUnitFilters() {
  const selectedCustomer = unitCustomerFilter?.value || '';
  const searchValue = unitSearch?.value.trim().toLowerCase() || '';

  const filtered = units.filter((unit) => {
    const matchesCustomer = !selectedCustomer || unit.customer_id === selectedCustomer;
    const searchable = `${unit.brand || ''} ${unit.model || ''} ${unit.aircon_type || ''}`.toLowerCase();
    const matchesSearch = !searchValue || searchable.includes(searchValue);
    return matchesCustomer && matchesSearch;
  });

  renderUnitRows(filtered);
}

if (unitCustomerFilter) {
  unitCustomerFilter.addEventListener('change', applyUnitFilters);
}

if (unitSearch) {
  unitSearch.addEventListener('input', applyUnitFilters);
}

if (addUnitBtn) {
  addUnitBtn.addEventListener('click', async () => {
    await loadCustomersForSelect();
    openUnitModal();
  });
}

if (closeUnitModal) closeUnitModal.addEventListener('click', closeUnitModalDialog);
if (cancelUnitBtn) cancelUnitBtn.addEventListener('click', closeUnitModalDialog);

if (unitModal) {
  unitModal.addEventListener('click', (event) => {
    if (event.target === unitModal) closeUnitModalDialog();
  });
}

if (unitForm) {
  unitForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = document.getElementById('unitId').value;
    const payload = {
      customer_id: document.getElementById('unitCustomerId').value,
      aircon_type: document.getElementById('unitType').value,
      brand: document.getElementById('unitBrand').value.trim(),
      model: document.getElementById('unitModel').value.trim(),
      horsepower: Number(document.getElementById('unitHorsepower').value || 0),
      installation_date: document.getElementById('unitInstallationDate').value,
      usage_frequency: document.getElementById('unitUsageFrequency').value,
      last_cleaning_date: document.getElementById('unitLastCleaningDate').value,
      recommended_cleaning_interval: Number(document.getElementById('unitRecommendedInterval').value || 6),
      status: document.getElementById('unitStatus').value
    };

    if (!payload.customer_id || !payload.brand || !payload.model || !payload.recommended_cleaning_interval) {
      alert('Please fill in customer, brand, model, and cleaning interval.');
      return;
    }

    if (payload.last_cleaning_date) {
      const intervalMonths = Number(payload.recommended_cleaning_interval || 6);
      const calculatedDate = new Date(payload.last_cleaning_date + 'T00:00:00');
      calculatedDate.setMonth(calculatedDate.getMonth() + intervalMonths);
      payload.next_cleaning_date = calculatedDate.toISOString().split('T')[0];
    } else {
      payload.next_cleaning_date = null;
    }

    let result;
    if (id) {
      result = await supabase.from('aircon_units').update(payload).eq('id', id).select();
    } else {
      result = await supabase.from('aircon_units').insert([payload]).select();
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    closeUnitModalDialog();
    await loadUnits();
  });
}

if (unitTableBody) {
  unitTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const unitId = button.dataset.id;
    const action = button.dataset.action;
    const unit = units.find((entry) => entry.id === unitId);
    if (!unit) return;

    if (action === 'edit') {
      await loadCustomersForSelect();
      openUnitModal(unit);
    }

    if (action === 'delete') {
      const confirmDelete = window.confirm(`Delete this aircon unit for ${unit.brand || 'selected brand'}?`);
      if (!confirmDelete) return;

      const { error } = await supabase.from('aircon_units').delete().eq('id', unitId);
      if (error) {
        alert(error.message);
      } else {
        await loadUnits();
      }
    }
  });
}

await loadCustomersForSelect();
await loadUnits();
