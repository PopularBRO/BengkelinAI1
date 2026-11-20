-- BengkelinAI production-oriented foundation for Supabase
-- Apply once in Supabase Dashboard > SQL Editor.
-- Roles are assigned by an administrator; sign-up metadata never controls role.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_path text,
  role text not null default 'customer' check (role in ('customer','mechanic','workshop','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(coalesce(new.email,''),'@',1)),
    nullif(new.raw_user_meta_data->>'phone','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_type text not null check (vehicle_type in ('motorcycle','car')),
  brand text not null,
  model text not null,
  production_year int check (production_year between 1950 and 2100),
  license_plate text,
  odometer_km bigint check (odometer_km is null or odometer_km >= 0),
  vin_last6 text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  input_type text not null check (input_type in ('photo','sound')),
  status text not null default 'simulated' check (status in ('simulated','queued','processing','completed','failed')),
  storage_path text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  duration_seconds numeric(8,2),
  summary text,
  result_json jsonb not null default '{}'::jsonb,
  disclaimer text not null default 'Informasi awal, bukan diagnosis teknis. Perlu pemeriksaan mekanik profesional.',
  created_at timestamptz not null default now()
);

create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  vehicle_type text not null check (vehicle_type in ('motorcycle','car')),
  problem_category text not null,
  severity text not null check (severity in ('unknown','light','medium','heavy')),
  area text,
  estimated_min numeric(14,2) not null check (estimated_min >= 0),
  estimated_max numeric(14,2) not null check (estimated_max >= estimated_min),
  labor_amount numeric(14,2) not null default 0,
  parts_amount numeric(14,2) not null default 0,
  currency char(3) not null default 'IDR',
  is_simulated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  description text,
  contact_phone text,
  address text not null,
  city text not null,
  province text not null,
  postal_code text,
  vehicle_types text[] not null default '{}',
  services text[] not null default '{}',
  operating_hours jsonb not null default '{}'::jsonb,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_active boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mechanics (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  workshop_id uuid references public.workshops(id) on delete set null,
  display_name text not null,
  bio text,
  specialties text[] not null default '{}',
  vehicle_types text[] not null default '{}',
  is_available boolean not null default false,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role text not null check (requested_role in ('mechanic','workshop')),
  organization_name text,
  contact_phone text not null,
  address text not null,
  city text not null,
  province text not null,
  experience_years int check (experience_years is null or experience_years between 0 and 60),
  message text not null,
  status text not null default 'pending' check (status in ('pending','under_review','approved','rejected')),
  admin_note text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  workshop_id uuid references public.workshops(id) on delete set null,
  mechanic_id uuid references public.mechanics(id) on delete set null,
  vehicle_type text not null check (vehicle_type in ('motorcycle','car')),
  vehicle_description text not null,
  requested_time text not null,
  contact_name text not null,
  contact_phone text not null,
  address text not null,
  problem_description text not null,
  customer_consent boolean not null default false check (customer_consent = true),
  status text not null default 'submitted' check (status in ('submitted','confirmed','in_progress','completed','cancelled','rejected')),
  customer_note text,
  mechanic_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  task_name text not null,
  vehicle_label text not null,
  due_date date not null,
  due_odometer_km bigint check (due_odometer_km is null or due_odometer_km >= 0),
  note text,
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  workshop_id uuid references public.workshops(id) on delete set null,
  service_date date not null default current_date,
  title text not null,
  description text,
  odometer_km bigint check (odometer_km is null or odometer_km >= 0),
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency char(3) not null default 'IDR',
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  service_request_id uuid references public.service_requests(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  review_text text,
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz not null default now(),
  unique (user_id, service_request_id)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null default 'Pesan dari website BengkelinAI',
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists vehicles_user_created_idx on public.vehicles(user_id, created_at desc);
create index if not exists diagnoses_user_created_idx on public.diagnoses(user_id, created_at desc);
create index if not exists estimates_user_created_idx on public.estimates(user_id, created_at desc);
create index if not exists workshops_city_idx on public.workshops(city);
create index if not exists workshops_status_idx on public.workshops(is_active, verification_status);
create index if not exists mechanics_workshop_idx on public.mechanics(workshop_id);
create index if not exists partner_applications_user_idx on public.partner_applications(user_id, created_at desc);
create index if not exists service_requests_customer_idx on public.service_requests(requested_by, created_at desc);
create index if not exists service_requests_assignment_idx on public.service_requests(workshop_id, mechanic_id, status);
create index if not exists reminders_user_date_idx on public.maintenance_reminders(user_id, due_date);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read, created_at desc);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;

create or replace function public.can_access_service_request(_request_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.service_requests sr
    where sr.id = _request_id and (
      sr.requested_by = (select auth.uid()) or public.is_admin() or
      exists (select 1 from public.mechanics m where m.id = sr.mechanic_id and m.profile_id = (select auth.uid())) or
      exists (select 1 from public.workshops w where w.id = sr.workshop_id and w.owner_id = (select auth.uid()))
    )
  );
$$;

create or replace function public.update_service_request_status(_request_id uuid, _new_status text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_row public.service_requests%rowtype;
  v_user uuid := auth.uid();
  v_assigned boolean := false;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_row from public.service_requests where id = _request_id for update;
  if not found then raise exception 'Service request not found'; end if;
  select (
    public.is_admin() or
    exists (select 1 from public.mechanics m where m.id = v_row.mechanic_id and m.profile_id = v_user) or
    exists (select 1 from public.workshops w where w.id = v_row.workshop_id and w.owner_id = v_user)
  ) into v_assigned;

  if v_row.requested_by = v_user then
    if _new_status <> 'cancelled' then raise exception 'Customer may only cancel their own request'; end if;
  elsif not v_assigned then
    raise exception 'Not authorized to update this request';
  end if;

  if not (
    (v_row.status = 'submitted' and _new_status in ('confirmed','cancelled','rejected')) or
    (v_row.status = 'confirmed' and _new_status in ('in_progress','cancelled')) or
    (v_row.status = 'in_progress' and _new_status = 'completed')
  ) then raise exception 'Invalid status transition'; end if;

  update public.service_requests set status = _new_status, updated_at = now() where id = _request_id;
  return jsonb_build_object('id', _request_id, 'status', _new_status);
end;
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists vehicles_touch_updated_at on public.vehicles;
create trigger vehicles_touch_updated_at before update on public.vehicles for each row execute function public.touch_updated_at();
drop trigger if exists workshops_touch_updated_at on public.workshops;
create trigger workshops_touch_updated_at before update on public.workshops for each row execute function public.touch_updated_at();
drop trigger if exists mechanics_touch_updated_at on public.mechanics;
create trigger mechanics_touch_updated_at before update on public.mechanics for each row execute function public.touch_updated_at();
drop trigger if exists partner_applications_touch_updated_at on public.partner_applications;
create trigger partner_applications_touch_updated_at before update on public.partner_applications for each row execute function public.touch_updated_at();
drop trigger if exists service_requests_touch_updated_at on public.service_requests;
create trigger service_requests_touch_updated_at before update on public.service_requests for each row execute function public.touch_updated_at();
drop trigger if exists reminders_touch_updated_at on public.maintenance_reminders;
create trigger reminders_touch_updated_at before update on public.maintenance_reminders for each row execute function public.touch_updated_at();

-- RLS for every exposed table. Grants and policies are both required.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','vehicles','diagnoses','estimates','workshops','mechanics','partner_applications','service_requests','maintenance_reminders','service_history','reviews','contact_messages','notifications'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Profiles: users can read their own profile and update only non-role fields.
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(full_name, phone, avatar_path) ON public.profiles TO authenticated;
CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT TO authenticated USING (id = (select auth.uid()) OR public.is_admin());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

-- Personal data.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
CREATE POLICY vehicles_owner_all ON public.vehicles FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT ON public.diagnoses TO authenticated;
CREATE POLICY diagnoses_owner_select ON public.diagnoses FOR SELECT TO authenticated USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY diagnoses_owner_insert ON public.diagnoses FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT ON public.estimates TO authenticated;
CREATE POLICY estimates_owner_select ON public.estimates FOR SELECT TO authenticated USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY estimates_owner_insert ON public.estimates FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_reminders TO authenticated;
CREATE POLICY reminders_owner_all ON public.maintenance_reminders FOR ALL TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

GRANT SELECT, INSERT ON public.service_history TO authenticated;
CREATE POLICY service_history_owner_select ON public.service_history FOR SELECT TO authenticated USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY service_history_owner_insert ON public.service_history FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

-- Public directory: only active and verified businesses/mechanics are visible anonymously.
GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT INSERT(owner_id,name,description,contact_phone,address,city,province,postal_code,vehicle_types,services,operating_hours,latitude,longitude) ON public.workshops TO authenticated;
GRANT UPDATE(name,description,contact_phone,address,city,province,postal_code,vehicle_types,services,operating_hours,latitude,longitude) ON public.workshops TO authenticated;
CREATE POLICY workshops_public_or_owner_select ON public.workshops FOR SELECT TO anon, authenticated USING ((is_active = true AND verification_status = 'verified') OR owner_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY workshops_owner_insert ON public.workshops FOR INSERT TO authenticated WITH CHECK (owner_id = (select auth.uid()) AND exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'workshop'));
CREATE POLICY workshops_owner_update ON public.workshops FOR UPDATE TO authenticated USING (owner_id = (select auth.uid()) OR public.is_admin()) WITH CHECK (owner_id = (select auth.uid()) OR public.is_admin());

GRANT SELECT ON public.mechanics TO anon, authenticated;
GRANT INSERT(profile_id,workshop_id,display_name,bio,specialties,vehicle_types) ON public.mechanics TO authenticated;
GRANT UPDATE(workshop_id,display_name,bio,specialties,vehicle_types,is_available) ON public.mechanics TO authenticated;
CREATE POLICY mechanics_public_or_owner_select ON public.mechanics FOR SELECT TO anon, authenticated USING ((approval_status = 'approved' AND is_available = true) OR profile_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY mechanics_owner_insert ON public.mechanics FOR INSERT TO authenticated WITH CHECK (profile_id = (select auth.uid()) AND exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'mechanic'));
CREATE POLICY mechanics_owner_update ON public.mechanics FOR UPDATE TO authenticated USING (profile_id = (select auth.uid()) OR public.is_admin()) WITH CHECK (profile_id = (select auth.uid()) OR public.is_admin());

-- Partner applications are private to the applicant and admin reviewers.
GRANT SELECT, INSERT ON public.partner_applications TO authenticated;
GRANT UPDATE(status, admin_note, reviewed_by, reviewed_at) ON public.partner_applications TO authenticated;
CREATE POLICY partner_apps_select_own_admin ON public.partner_applications FOR SELECT TO authenticated USING (user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY partner_apps_insert_own ON public.partner_applications FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()) AND status = 'pending');
CREATE POLICY partner_apps_admin_update ON public.partner_applications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service requests: customers and assigned partners can read; status changes go through the guarded RPC.
GRANT SELECT, INSERT ON public.service_requests TO authenticated;
CREATE POLICY service_requests_read_related ON public.service_requests FOR SELECT TO authenticated USING (public.can_access_service_request(id));
CREATE POLICY service_requests_insert_customer ON public.service_requests FOR INSERT TO authenticated WITH CHECK (requested_by = (select auth.uid()) AND customer_consent = true);
REVOKE EXECUTE ON FUNCTION public.update_service_request_status(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_service_request_status(uuid,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_service_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_service_request(uuid) TO authenticated;

-- Reviews: public can see published reviews; authenticated users submit reviews as themselves.
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
CREATE POLICY reviews_public_read_published ON public.reviews FOR SELECT TO anon, authenticated USING (status = 'published' OR user_id = (select auth.uid()) OR public.is_admin());
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()) AND status = 'pending');

-- Contact form: anyone can submit; messages are not readable from the public client.
GRANT INSERT(name,email,subject,message) ON public.contact_messages TO anon, authenticated;
GRANT SELECT ON public.contact_messages TO authenticated;
CREATE POLICY contact_messages_admin_read ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY contact_message_insert ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (length(trim(name)) between 2 and 120 AND length(trim(email)) between 5 and 254 AND length(trim(message)) between 5 and 5000);

-- Notifications can only be read and marked read by their recipient. Inserts are server-only.
GRANT SELECT, UPDATE(is_read) ON public.notifications TO authenticated;
CREATE POLICY notifications_owner_select ON public.notifications FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- Private object storage. File paths must start with the authenticated user's UUID.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('diagnosis-media','diagnosis-media',false,12582912,ARRAY['image/jpeg','image/png','image/webp','audio/webm','audio/ogg','audio/mpeg','audio/mp4','audio/wav']),
  ('avatars','avatars',false,3145728,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

CREATE POLICY diagnosis_media_select_own ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'diagnosis-media' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY diagnosis_media_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'diagnosis-media' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY diagnosis_media_update_own ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'diagnosis-media' AND (storage.foldername(name))[1] = (select auth.uid())::text) WITH CHECK (bucket_id = 'diagnosis-media' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY diagnosis_media_delete_own ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'diagnosis-media' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY avatars_select_own ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text) WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);

-- First administrator: create a user through signup, then run this manually with that user's UUID:
-- update public.profiles set role = 'admin' where id = 'YOUR_AUTH_USER_UUID';
-- Never expose a Supabase service_role/secret key in frontend files.
