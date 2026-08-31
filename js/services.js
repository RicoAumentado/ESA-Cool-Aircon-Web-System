import { supabase } from './supabase.js';

const serviceTableBody = document.getElementById('serviceTableBody');
const serviceCustomerIdSelect = document.getElementById('serviceCustomerId');
const serviceUnitIdSelect = document.getElementById('serviceUnitId');
const serviceModal = document.getElementById('serviceModal');
const serviceForm = document.getElementById('serviceForm');
const serviceModalTitle = document.getElementById('serviceModalTitle');

const addServiceBtn = document.getElementById('addServiceBtn');
const closeServiceModal = document.getElementById('closeServiceModal');
const cancelServiceBtn = document.getElementById('cancelServiceBtn');

let services = [];
let customers = [];
let units = [];

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

function openServiceModal(service = null) {
  serviceModal.classList.remove('hidden');

  if (!service) {
    serviceModalTitle.textContent = 'Add Service';
    serviceForm.reset();
    document.getElementById('serviceId').value = '';
    return;
  }

  serviceModalTitle.textContent = 'Edit Service';
  document.getElementById('serviceId').value = service.id;
  document.getElementById('serviceCustomerId').value = service.customer_id || '';
  document.getElementById('serviceUnitId').value = service.aircon_unit_id || '';
  document.getElementById('serviceType').value = service.service_type || 'General Cleaning';
  document.getElementById('serviceDate').value = service.service_date || '';
  document.getElementById('serviceTechnician').value = service.technician || '';
  document.getElementById('serviceNotes').value = service.notes || '';
}

function closeServiceModalDialog() {
  serviceModal.classList.add('hidden');
  serviceForm.reset();
  document.getElementById('serviceId').value = '';
}

async function loadCustomerOptions() {
  const { data, error } = await supabase.from('customers').select('*').order('full_name');
  if (error) {
    console.error(error);
    return;
  }

  customers = data || [];
  const options = customers.map((customer) => `<option value="${customer.id}">${customer.full_name}</option>`).join('');

  if (serviceCustomerIdSelect) {
    serviceCustomerIdSelect.innerHTML = '<option value="">Select customer</option>' + options;
  }
}

async function loadUnitOptions(customerId = '') {
  let query = supabase.from('aircon_units').select('*');
  if (customerId) query = query.eq('customer_id', customerId);

  const { data, error } = await query.order('brand');
  if (error) {
    console.error(error);
    return;
  }

  units = data || [];
  const options = units.map((unit) => `<option value="${unit.id}">${unit.brand} ${unit.model}</option>`).join('');

  if (serviceUnitIdSelect) {
    serviceUnitIdSelect.innerHTML = '<option value="">Select unit</option>' + options;
  }
}

async function loadServices() {
  const { data, error } = await supabase.from('services').select('*, customers(full_name), aircon_units(brand, model, aircon_type)').order('service_date', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }

  services = data || [];

  if (!serviceTableBody) return;
  if (!services.length) {
    serviceTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No service records found.</td></tr>';
    return;
  }

  serviceTableBody.innerHTML = services.map((service) => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-slate-700">${service.customers?.full_name || 'Customer'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-700">${service.aircon_units?.brand || 'Aircon'} ${service.aircon_units?.model || ''}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-700">${service.service_type}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-700">${formatDate(service.service_date)}</td>
      <td class="px-6 py-4 whitespace-nowrap text-slate-700">${service.technician || 'N/A'}</td>
      <td class="px-6 py-4 text-slate-600 max-w-md">${service.notes || '—'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-right">
        <div class="flex justify-end gap-2">
          <button data-action="edit" data-id="${service.id}" class="table-action-btn edit">Edit</button>
          <button data-action="delete" data-id="${service.id}" class="table-action-btn delete">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function addMonths(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

async function updateAirconUnitAfterService(unitId, serviceDate, serviceType) {
  if (!unitId) return;

  const { data: unit, error: unitFetchError } = await supabase.from('aircon_units').select('*').eq('id', unitId).single();
  if (unitFetchError || !unit) return;

  const cleaningTypes = ['General Cleaning', 'Chemical Cleaning', 'Maintenance', 'Inspection'];
  const payload = {
    last_service_date: serviceDate,
    status: 'Normal'
  };

  if (cleaningTypes.includes(serviceType)) {
    payload.last_cleaning_date = serviceDate;
    payload.next_cleaning_date = addMonths(serviceDate, Number(unit.recommended_cleaning_interval || 6));
  }

  const { error } = await supabase.from('aircon_units').update(payload).eq('id', unitId);
  if (error) {
    console.error(error);
  }
}

if (serviceCustomerIdSelect) {
  serviceCustomerIdSelect.addEventListener('change', async (event) => {
    await loadUnitOptions(event.target.value);
  });
}

if (addServiceBtn) {
  addServiceBtn.addEventListener('click', async () => {
    await loadCustomerOptions();
    await loadUnitOptions();
    openServiceModal();
  });
}

if (closeServiceModal) closeServiceModal.addEventListener('click', closeServiceModalDialog);
if (cancelServiceBtn) cancelServiceBtn.addEventListener('click', closeServiceModalDialog);

if (serviceModal) {
  serviceModal.addEventListener('click', (event) => {
    if (event.target === serviceModal) closeServiceModalDialog();
  });
}

if (serviceForm) {
  serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const serviceId = document.getElementById('serviceId').value;
    const payload = {
      customer_id: document.getElementById('serviceCustomerId').value,
      aircon_unit_id: document.getElementById('serviceUnitId').value,
      service_type: document.getElementById('serviceType').value,
      service_date: document.getElementById('serviceDate').value,
      technician: document.getElementById('serviceTechnician').value.trim(),
      notes: document.getElementById('serviceNotes').value.trim()
    };

    if (!payload.customer_id || !payload.aircon_unit_id || !payload.service_date || !payload.technician) {
      alert('Please complete the customer, aircon unit, date, and technician fields.');
      return;
    }

    let result;
    if (serviceId) {
      result = await supabase.from('services').update(payload).eq('id', serviceId).select();
    } else {
      result = await supabase.from('services').insert([payload]).select();
    }

    if (result.error) {
      alert(result.error.message);
      return;
    }

    const createdService = result.data?.[0];
    if (createdService) {
      await updateAirconUnitAfterService(createdService.aircon_unit_id, createdService.service_date, createdService.service_type);
    }

    closeServiceModalDialog();
    await loadServices();
  });
}

if (serviceTableBody) {
  serviceTableBody.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const serviceId = button.dataset.id;
    const action = button.dataset.action;
    const service = services.find((entry) => entry.id === serviceId);
    if (!service) return;

    if (action === 'edit') {
      await loadCustomerOptions();
      await loadUnitOptions(service.customer_id);
      openServiceModal(service);
    }

    if (action === 'delete') {
      const confirmDelete = window.confirm('Delete this service record?');
      if (!confirmDelete) return;

      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) {
        alert(error.message);
      } else {
        await loadServices();
      }
    }
  });
}

await loadCustomerOptions();
await loadUnitOptions();
await loadServices();
