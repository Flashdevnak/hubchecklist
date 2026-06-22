-- MVP-002 Supabase schema, auth profile structure, roles, and RLS draft.
-- Scope note: this migration creates the database foundation only. QR scan,
-- OCR, Android WebView, photo upload, export, backup execution, and cleanup
-- execution are intentionally left for later MVPs.

create extension if not exists "pgcrypto";

create type public.user_role as enum ('staff', 'supervisor', 'admin');
create type public.vehicle_record_status as enum (
  'draft',
  'waiting_phone',
  'waiting_flash_search',
  'flash_loaded',
  'need_review',
  'ready_for_photo',
  'pending_photo',
  'complete',
  'voided',
  'error'
);
create type public.vehicle_photo_kind as enum (
  'vehicle_front',
  'vehicle_side',
  'vehicle_rear',
  'paper',
  'flash_screenshot',
  'other'
);
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'blocked');

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role public.user_role not null default 'staff',
  branch_id uuid references public.branches(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.responsible_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  employee_code text not null,
  display_name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, employee_code)
);

create table public.vehicle_records (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  responsible_profile_id uuid references public.responsible_profiles(id) on delete set null,
  responsible_employee_code text not null,
  responsible_display_name text not null,
  work_date date not null default current_date,
  vehicle_barcode text not null,
  driver_phone text,
  flash_url text,
  status public.vehicle_record_status not null default 'draft',
  created_by uuid not null references public.users(id) on delete restrict default auth.uid(),
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, work_date, vehicle_barcode)
);

create table public.route_rows (
  id uuid primary key default gen_random_uuid(),
  vehicle_record_id uuid not null references public.vehicle_records(id) on delete cascade,
  row_index integer not null,
  route_code text,
  route_name text,
  destination text,
  status_text text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (vehicle_record_id, row_index)
);

create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_record_id uuid not null references public.vehicle_records(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  photo_kind public.vehicle_photo_kind not null,
  storage_bucket text,
  storage_path text,
  public_url text,
  content_type text,
  file_size_bytes bigint,
  width integer,
  height integer,
  captured_by uuid not null references public.users(id) on delete restrict default auth.uid(),
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.edit_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_record_id uuid not null references public.vehicle_records(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  edited_by uuid not null references public.users(id) on delete restrict default auth.uid(),
  action text not null,
  changed_fields jsonb not null default '{}'::jsonb,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  requested_by uuid not null references public.users(id) on delete restrict default auth.uid(),
  status public.job_status not null default 'queued',
  backup_date date not null default current_date,
  storage_bucket text,
  storage_path text,
  manifest jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete restrict,
  requested_by uuid not null references public.users(id) on delete restrict default auth.uid(),
  status public.job_status not null default 'queued',
  cutoff_date date not null,
  requires_backup_job_id uuid references public.backup_jobs(id) on delete restrict,
  deleted_photo_count integer not null default 0,
  freed_bytes bigint not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.storage_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references public.branches(id) on delete set null,
  bucket_name text not null,
  total_bytes bigint not null default 0,
  object_count integer not null default 0,
  captured_at timestamptz not null default now()
);

create table public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index users_branch_id_idx on public.users(branch_id);
create index responsible_profiles_user_id_idx on public.responsible_profiles(user_id);
create index responsible_profiles_branch_id_idx on public.responsible_profiles(branch_id);
create index vehicle_records_branch_work_date_idx on public.vehicle_records(branch_id, work_date);
create index vehicle_records_created_by_idx on public.vehicle_records(created_by);
create index route_rows_vehicle_record_id_idx on public.route_rows(vehicle_record_id);
create index vehicle_photos_vehicle_record_id_idx on public.vehicle_photos(vehicle_record_id);
create index vehicle_photos_branch_id_idx on public.vehicle_photos(branch_id);
create index edit_history_vehicle_record_id_idx on public.edit_history(vehicle_record_id);
create index backup_jobs_branch_id_idx on public.backup_jobs(branch_id);
create index cleanup_jobs_branch_id_idx on public.cleanup_jobs(branch_id);
create index storage_usage_snapshots_branch_id_idx on public.storage_usage_snapshots(branch_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger branches_set_updated_at
before update on public.branches
for each row execute function public.set_updated_at();

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger responsible_profiles_set_updated_at
before update on public.responsible_profiles
for each row execute function public.set_updated_at();

create trigger vehicle_records_set_updated_at
before update on public.vehicle_records
for each row execute function public.set_updated_at();

create or replace function public.app_current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid() and is_active = true;
$$;

create or replace function public.app_current_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.users where id = auth.uid() and is_active = true;
$$;

create or replace function public.app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.app_current_role() = 'admin', false);
$$;

create or replace function public.app_is_supervisor_for_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.app_current_role() in ('supervisor', 'admin')
    and (
      public.app_is_admin()
      or public.app_current_branch_id() = target_branch_id
    ),
    false
  );
$$;

create or replace function public.app_can_read_vehicle_record(target_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vehicle_records vr
    where vr.id = target_record_id
      and (
        vr.created_by = auth.uid()
        or public.app_is_supervisor_for_branch(vr.branch_id)
      )
  );
$$;

create or replace function public.app_can_write_vehicle_record(target_record_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.vehicle_records vr
    where vr.id = target_record_id
      and (
        vr.created_by = auth.uid()
        or public.app_is_supervisor_for_branch(vr.branch_id)
      )
  );
$$;

alter table public.branches enable row level security;
alter table public.users enable row level security;
alter table public.responsible_profiles enable row level security;
alter table public.vehicle_records enable row level security;
alter table public.route_rows enable row level security;
alter table public.vehicle_photos enable row level security;
alter table public.edit_history enable row level security;
alter table public.backup_jobs enable row level security;
alter table public.cleanup_jobs enable row level security;
alter table public.storage_usage_snapshots enable row level security;
alter table public.app_settings enable row level security;

-- RLS draft policy model:
-- staff: view/create their own records and owned child rows.
-- supervisor: view branch records and create branch-scoped operational jobs.
-- admin: manage all records and configuration.

create policy branches_read_authenticated
on public.branches for select
to authenticated
using (is_active = true or public.app_is_admin());

create policy branches_admin_manage
on public.branches for all
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy users_read_self_branch_or_admin
on public.users for select
to authenticated
using (
  id = auth.uid()
  or public.app_is_admin()
  or (
    public.app_current_role() = 'supervisor'
    and branch_id = public.app_current_branch_id()
  )
);

create policy users_admin_manage
on public.users for all
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy responsible_profiles_read_self_branch_or_admin
on public.responsible_profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy responsible_profiles_staff_create_own
on public.responsible_profiles for insert
to authenticated
with check (
  user_id = auth.uid()
  and branch_id = public.app_current_branch_id()
);

create policy responsible_profiles_owner_or_admin_update
on public.responsible_profiles for update
to authenticated
using (user_id = auth.uid() or public.app_is_admin())
with check (user_id = auth.uid() or public.app_is_admin());

create policy responsible_profiles_admin_delete
on public.responsible_profiles for delete
to authenticated
using (public.app_is_admin());

create policy vehicle_records_read_self_branch_or_admin
on public.vehicle_records for select
to authenticated
using (
  created_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy vehicle_records_staff_create_own
on public.vehicle_records for insert
to authenticated
with check (
  created_by = auth.uid()
  and branch_id = public.app_current_branch_id()
);

create policy vehicle_records_owner_supervisor_admin_update
on public.vehicle_records for update
to authenticated
using (
  created_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
)
with check (
  created_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy vehicle_records_admin_delete
on public.vehicle_records for delete
to authenticated
using (public.app_is_admin());

create policy route_rows_read_by_record_scope
on public.route_rows for select
to authenticated
using (public.app_can_read_vehicle_record(vehicle_record_id));

create policy route_rows_write_by_record_scope
on public.route_rows for all
to authenticated
using (public.app_can_write_vehicle_record(vehicle_record_id))
with check (public.app_can_write_vehicle_record(vehicle_record_id));

create policy vehicle_photos_read_by_branch_scope
on public.vehicle_photos for select
to authenticated
using (
  captured_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy vehicle_photos_create_own
on public.vehicle_photos for insert
to authenticated
with check (
  captured_by = auth.uid()
  and public.app_can_write_vehicle_record(vehicle_record_id)
);

create policy vehicle_photos_owner_supervisor_admin_update
on public.vehicle_photos for update
to authenticated
using (
  captured_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
)
with check (
  captured_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy vehicle_photos_admin_delete
on public.vehicle_photos for delete
to authenticated
using (public.app_is_admin());

create policy edit_history_read_by_branch_scope
on public.edit_history for select
to authenticated
using (
  edited_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy edit_history_create_for_visible_record
on public.edit_history for insert
to authenticated
with check (
  edited_by = auth.uid()
  and public.app_can_read_vehicle_record(vehicle_record_id)
);

create policy backup_jobs_read_self_branch_or_admin
on public.backup_jobs for select
to authenticated
using (
  requested_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy backup_jobs_create_branch_scope
on public.backup_jobs for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (
    branch_id = public.app_current_branch_id()
    or public.app_is_admin()
  )
);

create policy backup_jobs_supervisor_admin_update
on public.backup_jobs for update
to authenticated
using (public.app_is_supervisor_for_branch(branch_id))
with check (public.app_is_supervisor_for_branch(branch_id));

create policy cleanup_jobs_read_self_branch_or_admin
on public.cleanup_jobs for select
to authenticated
using (
  requested_by = auth.uid()
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy cleanup_jobs_create_branch_scope
on public.cleanup_jobs for insert
to authenticated
with check (
  requested_by = auth.uid()
  and (
    branch_id = public.app_current_branch_id()
    or public.app_is_admin()
  )
);

create policy cleanup_jobs_supervisor_admin_update
on public.cleanup_jobs for update
to authenticated
using (public.app_is_supervisor_for_branch(branch_id))
with check (public.app_is_supervisor_for_branch(branch_id));

create policy storage_usage_snapshots_read_branch_or_admin
on public.storage_usage_snapshots for select
to authenticated
using (
  branch_id is null
  or public.app_is_supervisor_for_branch(branch_id)
);

create policy storage_usage_snapshots_admin_manage
on public.storage_usage_snapshots for all
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

create policy app_settings_read_authenticated
on public.app_settings for select
to authenticated
using (true);

create policy app_settings_admin_manage
on public.app_settings for all
to authenticated
using (public.app_is_admin())
with check (public.app_is_admin());

insert into public.app_settings (key, value, description)
values
  (
    'mvp_status',
    '{"current":"MVP-002","implemented":["schema","auth_profile_structure","roles","rls_draft"],"placeholders":["qr_scan","ocr","android_webview","r2_upload","photo_upload","export_21_6","backup_execution","cleanup_execution"]}'::jsonb,
    'Honest MVP capability marker used to avoid fake completed features.'
  )
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = now();
