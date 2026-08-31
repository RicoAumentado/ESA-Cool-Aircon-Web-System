create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_number text,
  address text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists aircon_units (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  aircon_type text not null default 'Split Type',
  brand text not null,
  model text not null,
  horsepower numeric,
  installation_date date,
  usage_frequency text not null default 'Regular usage',
  last_cleaning_date date,
  recommended_cleaning_interval integer not null default 6,
  next_cleaning_date date,
  status text default 'Normal',
  last_service_date date,
  created_at timestamptz default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  aircon_unit_id uuid not null references aircon_units(id) on delete cascade,
  service_type text not null,
  service_date date not null,
  technician text not null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_customers_full_name on customers(full_name);
create index if not exists idx_aircon_units_customer_id on aircon_units(customer_id);
create index if not exists idx_services_customer_id on services(customer_id);
create index if not exists idx_services_aircon_unit_id on services(aircon_unit_id);

alter table customers enable row level security;
alter table aircon_units enable row level security;
alter table services enable row level security;

create policy "Allow authenticated users to view customers" on customers for select using (auth.role() = 'authenticated');
create policy "Allow authenticated users to insert customers" on customers for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update customers" on customers for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete customers" on customers for delete using (auth.role() = 'authenticated');

create policy "Allow authenticated users to view aircon units" on aircon_units for select using (auth.role() = 'authenticated');
create policy "Allow authenticated users to insert aircon units" on aircon_units for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update aircon units" on aircon_units for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete aircon units" on aircon_units for delete using (auth.role() = 'authenticated');

create policy "Allow authenticated users to view services" on services for select using (auth.role() = 'authenticated');
create policy "Allow authenticated users to insert services" on services for insert with check (auth.role() = 'authenticated');
create policy "Allow authenticated users to update services" on services for update using (auth.role() = 'authenticated');
create policy "Allow authenticated users to delete services" on services for delete using (auth.role() = 'authenticated');
