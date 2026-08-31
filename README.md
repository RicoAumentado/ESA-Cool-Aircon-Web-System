# ESA Cool Aircon Service Management System

A simple but professional air-conditioning customer monitoring and service management website built with HTML, Tailwind CSS, JavaScript, and Supabase.

## Features

- Technician login and logout using Supabase Auth
- Secure session persistence with refresh protection
- Dashboard with customer and unit statistics
- Customer CRUD management
- Aircon unit management per customer
- Automatic maintenance schedule calculations
- Service history logging
- Responsive design for desktop, tablet, and mobile
- Ready for deployment on Vercel

## Project Structure

```text
aircon-monitoring-system/
├── index.html
├── login.html
├── dashboard.html
├── customers.html
├── aircon-units.html
├── services.html
├── css/
│   └── style.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── customers.js
│   ├── aircon-units.js
│   └── services.js
├── assets/
│   └── images/
├── package.json
├── database/
│   └── schema.sql
├── README.md
└── .gitignore
```

## Step-by-Step Setup

### 1) Create a Supabase project

1. Go to https://supabase.com
2. Create a new project
3. Copy your project URL and anon key
4. Update the values inside `js/supabase.js`

### 2) Create the database schema

Open the SQL editor in Supabase and paste the contents of `database/schema.sql`.

### 3) Create the first technician account

In Supabase Auth > Users, create the first admin account.

Example:

- Email: admin@esacool.com
- Password: use a strong password

This is the main technician account that can sign in to the system.

### 4) Update the Supabase config

Edit `js/supabase.js` and replace:

```js
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

with your actual values.

### 5) Run the app locally

```bash
npm install
npm start
```

Then visit:

```text
http://localhost:3000
```

### 6) Deploy on Vercel

1. Push this project to GitHub
2. Import it into Vercel
3. Set the project to use the static site settings
4. Deploy the project
5. Keep the same Supabase environment values in your frontend config

## Supabase SQL Schema

The database schema is defined below.

```sql
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
```

### Relationships

- One customer can have many aircon units
- One aircon unit belongs to one customer
- One aircon unit can have many service records
- Each service record belongs to one customer and one aircon unit

### Recommended Row Level Security (RLS)

```sql
alter table customers enable row level security;
alter table aircon_units enable row level security;
alter table services enable row level security;

create policy "Allow authenticated users to view customers"
on customers for select
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert customers"
on customers for insert
with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update customers"
on customers for update
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete customers"
on customers for delete
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to view aircon units"
on aircon_units for select
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert aircon units"
on aircon_units for insert
with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update aircon units"
on aircon_units for update
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete aircon units"
on aircon_units for delete
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to view services"
on services for select
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to insert services"
on services for insert
with check (auth.role() = 'authenticated');

create policy "Allow authenticated users to update services"
on services for update
using (auth.role() = 'authenticated');

create policy "Allow authenticated users to delete services"
on services for delete
using (auth.role() = 'authenticated');
```

## Maintenance Logic

The system calculates the next cleaning date like this:

```text
Next Cleaning Date = Last Cleaning Date + Recommended Cleaning Interval
```

Examples of statuses:

- Normal
- Upcoming Service
- Due for Cleaning
- Overdue

## Notes

This project is intentionally kept simple and beginner-friendly. The code uses vanilla JavaScript instead of a frontend framework, making it easier to understand and deploy on Vercel.

## Important

Before using the app, make sure your Supabase URL and anon key are correctly added. Without them, the pages cannot load data from the database.
