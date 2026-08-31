import { supabase } from './supabase.js';

const totalCustomersEl = document.getElementById('totalCustomers');
const totalUnitsEl = document.getElementById('totalUnits');
const dueForCleaningEl = document.getElementById('dueForCleaning');
const upcomingServicesEl = document.getElementById('upcomingServices');
const recentServicesEl = document.getElementById('recentServices');
const attentionListEl = document.getElementById('attentionList');

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

function daysBetween(dateA, dateB) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dateA - dateB) / msPerDay);
}

function calculateUnitStatus(unit) {
  if (!unit.next_cleaning_date) return 'Normal';

  const nextDate = new Date(`${unit.next_cleaning_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = daysBetween(nextDate, today);

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

async function loadDashboard() {
  const { data: customers, error: customerError } = await supabase.from('customers').select('*');
  if (customerError) {
    console.error(customerError);
    return;
  }

  const { data: units, error: unitError } = await supabase.from('aircon_units').select('*, customers(full_name)');
  if (unitError) {
    console.error(unitError);
    return;
  }

  const { data: services, error: serviceError } = await supabase.from('services').select('*, customers(full_name), aircon_units(brand, model, aircon_type)').order('service_date', { ascending: false }).limit(5);
  if (serviceError) {
    console.error(serviceError);
    return;
  }

  const totalCustomers = customers.length;
  const totalUnits = units.length;
  const dueUnits = units.filter((unit) => calculateUnitStatus(unit) === 'Due for Cleaning' || calculateUnitStatus(unit) === 'Overdue');
  const upcomingUnits = units.filter((unit) => calculateUnitStatus(unit) === 'Upcoming Service');

  totalCustomersEl.textContent = String(totalCustomers);
  totalUnitsEl.textContent = String(totalUnits);
  dueForCleaningEl.textContent = String(dueUnits.length);
  upcomingServicesEl.textContent = String(upcomingUnits.length);

  recentServicesEl.innerHTML = services.length
    ? services.map((service) => `
      <div class="border border-slate-200 rounded-xl p-3">
        <div class="flex justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-800">${service.customers?.full_name || 'Customer'}</p>
            <p class="text-sm text-slate-500">${service.aircon_units?.brand || 'Aircon'} ${service.aircon_units?.model || ''}</p>
          </div>
          <span class="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">${service.service_type}</span>
        </div>
        <p class="mt-2 text-sm text-slate-600">${formatDate(service.service_date)} · ${service.technician || 'Technician'}</p>
      </div>
    `).join('')
    : '<div class="empty-state">No completed service history yet.</div>';

  const attentionUnits = units.filter((unit) => {
    const status = calculateUnitStatus(unit);
    return status === 'Due for Cleaning' || status === 'Upcoming Service' || status === 'Overdue';
  });

  attentionListEl.innerHTML = attentionUnits.length
    ? attentionUnits.slice(0, 6).map((unit) => `
      <div class="border border-slate-200 rounded-xl p-3">
        <div class="flex justify-between items-start gap-2">
          <div>
            <p class="font-semibold text-slate-800">${unit.customers?.full_name || 'Customer'}</p>
            <p class="text-sm text-slate-500">${unit.aircon_type} · ${unit.brand} ${unit.model}</p>
          </div>
          <span class="status-badge ${getStatusClasses(calculateUnitStatus(unit))}">${calculateUnitStatus(unit)}</span>
        </div>
        <p class="mt-2 text-sm text-slate-600">Next cleaning: ${formatDate(unit.next_cleaning_date)}</p>
      </div>
    `).join('')
    : '<div class="empty-state">No units need attention right now.</div>';
}

loadDashboard();
