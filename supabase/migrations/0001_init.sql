-- Auto-generated from base44/entities/*.jsonc by scripts/gen-schema.js
-- Safe to hand-edit after generation; re-running the generator will overwrite this file.

create extension if not exists "pgcrypto";

-- ArtistBooking
create table if not exists artist_bookings (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  artist_id text not null,
  artist_name text,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  booking_type text default 'live_performance' not null check (booking_type in ('live_performance', 'feature', 'collaboration', 'songwriting', 'brand_ambassador', 'event_appearance', 'studio_session', 'voice_over', 'message')),
  event_date date,
  venue text,
  budget numeric default 0,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined', 'completed'))
);

create index if not exists idx_artist_bookings_created_by on artist_bookings(created_by);
create index if not exists idx_artist_bookings_created_date on artist_bookings(created_date desc);

alter table artist_bookings enable row level security;
drop policy if exists "artist_bookings_select_authenticated" on artist_bookings;
create policy "artist_bookings_select_authenticated" on artist_bookings for select using (auth.role() = 'authenticated');
drop policy if exists "artist_bookings_insert_own" on artist_bookings;
create policy "artist_bookings_insert_own" on artist_bookings for insert with check (auth.uid() = created_by);
drop policy if exists "artist_bookings_update_own_or_admin" on artist_bookings;
create policy "artist_bookings_update_own_or_admin" on artist_bookings for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "artist_bookings_delete_own_or_admin" on artist_bookings;
create policy "artist_bookings_delete_own_or_admin" on artist_bookings for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_artist_bookings() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_artist_bookings on artist_bookings;
create trigger trg_updated_date_artist_bookings before update on artist_bookings for each row execute function set_updated_date_artist_bookings();

-- ArtistProfile
create table if not exists artist_profiles (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  stage_name text,
  bio text,
  genre text,
  country text,
  city text,
  location text,
  manager_name text,
  booking_email text,
  phone text,
  whatsapp text,
  booking_fee numeric default 0,
  performance_fee numeric default 0,
  feature_price numeric default 0,
  collaboration_price numeric default 0,
  songwriting_price numeric default 0,
  studio_session_price numeric default 0,
  music_video_price numeric default 0,
  services jsonb,
  spotify_url text,
  apple_music_url text,
  instagram_url text,
  twitter_url text,
  tiktok_url text,
  youtube_url text,
  facebook_url text,
  audiomack_url text,
  soundcloud_url text,
  boomplay_url text,
  deezer_url text,
  bandcamp_url text,
  mixcloud_url text,
  telegram_url text,
  threads_url text,
  snapchat_url text,
  linkedin_url text,
  twitch_url text,
  pinterest_url text,
  website_url text,
  avatar_url text,
  banner_url text,
  gallery_photos jsonb,
  gallery_videos jsonb,
  verified boolean default false,
  monthly_listeners numeric default 0,
  followers numeric default 0,
  total_streams numeric default 0,
  availability_calendar text,
  payment_details text
);

create index if not exists idx_artist_profiles_created_by on artist_profiles(created_by);
create index if not exists idx_artist_profiles_created_date on artist_profiles(created_date desc);

alter table artist_profiles enable row level security;
drop policy if exists "artist_profiles_select_authenticated" on artist_profiles;
create policy "artist_profiles_select_authenticated" on artist_profiles for select using (auth.role() = 'authenticated');
drop policy if exists "artist_profiles_insert_own" on artist_profiles;
create policy "artist_profiles_insert_own" on artist_profiles for insert with check (auth.uid() = created_by);
drop policy if exists "artist_profiles_update_own_or_admin" on artist_profiles;
create policy "artist_profiles_update_own_or_admin" on artist_profiles for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "artist_profiles_delete_own_or_admin" on artist_profiles;
create policy "artist_profiles_delete_own_or_admin" on artist_profiles for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_artist_profiles() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_artist_profiles on artist_profiles;
create trigger trg_updated_date_artist_profiles before update on artist_profiles for each row execute function set_updated_date_artist_profiles();

-- ArtistReview
create table if not exists artist_reviews (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  artist_id text not null,
  reviewer_name text not null,
  reviewer_type text default 'fan' check (reviewer_type in ('fan', 'client', 'promoter', 'artist')),
  rating numeric default 5 not null,
  title text,
  body text,
  booking_type text,
  status text default 'completed' check (status in ('pending', 'completed'))
);

create index if not exists idx_artist_reviews_created_by on artist_reviews(created_by);
create index if not exists idx_artist_reviews_created_date on artist_reviews(created_date desc);

alter table artist_reviews enable row level security;
drop policy if exists "artist_reviews_select_authenticated" on artist_reviews;
create policy "artist_reviews_select_authenticated" on artist_reviews for select using (auth.role() = 'authenticated');
drop policy if exists "artist_reviews_insert_own" on artist_reviews;
create policy "artist_reviews_insert_own" on artist_reviews for insert with check (auth.uid() = created_by);
drop policy if exists "artist_reviews_update_own_or_admin" on artist_reviews;
create policy "artist_reviews_update_own_or_admin" on artist_reviews for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "artist_reviews_delete_own_or_admin" on artist_reviews;
create policy "artist_reviews_delete_own_or_admin" on artist_reviews for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_artist_reviews() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_artist_reviews on artist_reviews;
create trigger trg_updated_date_artist_reviews before update on artist_reviews for each row execute function set_updated_date_artist_reviews();

-- AvailabilitySlot
create table if not exists availability_slots (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  artist_id text not null,
  artist_name text,
  date date not null,
  start_time text not null,
  end_time text,
  title text,
  booking_type text default 'any' check (booking_type in ('any', 'live_performance', 'feature', 'collaboration', 'songwriting', 'studio_session', 'voice_over', 'event_appearance', 'brand_ambassador')),
  status text default 'open' check (status in ('open', 'booked', 'cancelled')),
  notes text,
  booked_by_booking_id text,
  booked_by_name text
);

create index if not exists idx_availability_slots_created_by on availability_slots(created_by);
create index if not exists idx_availability_slots_created_date on availability_slots(created_date desc);

alter table availability_slots enable row level security;
drop policy if exists "availability_slots_select_authenticated" on availability_slots;
create policy "availability_slots_select_authenticated" on availability_slots for select using (auth.role() = 'authenticated');
drop policy if exists "availability_slots_insert_own" on availability_slots;
create policy "availability_slots_insert_own" on availability_slots for insert with check (auth.uid() = created_by);
drop policy if exists "availability_slots_update_own_or_admin" on availability_slots;
create policy "availability_slots_update_own_or_admin" on availability_slots for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "availability_slots_delete_own_or_admin" on availability_slots;
create policy "availability_slots_delete_own_or_admin" on availability_slots for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_availability_slots() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_availability_slots on availability_slots;
create trigger trg_updated_date_availability_slots before update on availability_slots for each row execute function set_updated_date_availability_slots();

-- Beat
create table if not exists beats (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  producer text not null,
  genre text,
  mood text,
  bpm numeric,
  key text,
  description text,
  price numeric default 0,
  exclusive_price numeric,
  license text default 'basic' check (license in ('basic', 'premium', 'exclusive')),
  artwork_url text,
  tags jsonb,
  sales numeric default 0
);

create index if not exists idx_beats_created_by on beats(created_by);
create index if not exists idx_beats_created_date on beats(created_date desc);

alter table beats enable row level security;
drop policy if exists "beats_select_authenticated" on beats;
create policy "beats_select_authenticated" on beats for select using (auth.role() = 'authenticated');
drop policy if exists "beats_insert_own" on beats;
create policy "beats_insert_own" on beats for insert with check (auth.uid() = created_by);
drop policy if exists "beats_update_own_or_admin" on beats;
create policy "beats_update_own_or_admin" on beats for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "beats_delete_own_or_admin" on beats;
create policy "beats_delete_own_or_admin" on beats for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_beats() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_beats on beats;
create trigger trg_updated_date_beats before update on beats for each row execute function set_updated_date_beats();

-- Beneficiary
create table if not exists beneficiarys (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  nickname text,
  account_number text,
  bank_name text,
  bank_code text,
  currency text default 'NGN',
  country text,
  email text,
  type text default 'bank' check (type in ('bank', 'mobile_money', 'crypto', 'email'))
);

create index if not exists idx_beneficiarys_created_by on beneficiarys(created_by);
create index if not exists idx_beneficiarys_created_date on beneficiarys(created_date desc);

alter table beneficiarys enable row level security;
drop policy if exists "beneficiarys_select_authenticated" on beneficiarys;
create policy "beneficiarys_select_authenticated" on beneficiarys for select using (auth.role() = 'authenticated');
drop policy if exists "beneficiarys_insert_own" on beneficiarys;
create policy "beneficiarys_insert_own" on beneficiarys for insert with check (auth.uid() = created_by);
drop policy if exists "beneficiarys_update_own_or_admin" on beneficiarys;
create policy "beneficiarys_update_own_or_admin" on beneficiarys for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "beneficiarys_delete_own_or_admin" on beneficiarys;
create policy "beneficiarys_delete_own_or_admin" on beneficiarys for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_beneficiarys() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_beneficiarys on beneficiarys;
create trigger trg_updated_date_beneficiarys before update on beneficiarys for each row execute function set_updated_date_beneficiarys();

-- Campaign
create table if not exists campaigns (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  song text,
  package text default 'starter' check (package in ('starter', 'street_favorite', 'recognized_artist', 'top_chart')),
  platform text,
  status text default 'draft' check (status in ('draft', 'active', 'completed')),
  budget numeric default 0,
  reach numeric default 0,
  streams numeric default 0,
  clicks numeric default 0,
  growth numeric default 0
);

create index if not exists idx_campaigns_created_by on campaigns(created_by);
create index if not exists idx_campaigns_created_date on campaigns(created_date desc);

alter table campaigns enable row level security;
drop policy if exists "campaigns_select_authenticated" on campaigns;
create policy "campaigns_select_authenticated" on campaigns for select using (auth.role() = 'authenticated');
drop policy if exists "campaigns_insert_own" on campaigns;
create policy "campaigns_insert_own" on campaigns for insert with check (auth.uid() = created_by);
drop policy if exists "campaigns_update_own_or_admin" on campaigns;
create policy "campaigns_update_own_or_admin" on campaigns for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "campaigns_delete_own_or_admin" on campaigns;
create policy "campaigns_delete_own_or_admin" on campaigns for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_campaigns() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_campaigns on campaigns;
create trigger trg_updated_date_campaigns before update on campaigns for each row execute function set_updated_date_campaigns();

-- Event
create table if not exists events (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  artist text not null,
  description text,
  date date,
  time text,
  venue text,
  location text,
  artwork_url text,
  is_free boolean default false,
  status text default 'draft' check (status in ('draft', 'on_sale', 'sold_out', 'cancelled', 'completed')),
  total_tickets numeric default 100,
  tickets_sold numeric default 0,
  general_price numeric default 0,
  vip_price numeric default 0,
  early_bird_price numeric default 0,
  early_bird_available numeric default 0,
  currency text default 'NGN',
  revenue numeric default 0
);

create index if not exists idx_events_created_by on events(created_by);
create index if not exists idx_events_created_date on events(created_date desc);

alter table events enable row level security;
drop policy if exists "events_select_authenticated" on events;
create policy "events_select_authenticated" on events for select using (auth.role() = 'authenticated');
drop policy if exists "events_insert_own" on events;
create policy "events_insert_own" on events for insert with check (auth.uid() = created_by);
drop policy if exists "events_update_own_or_admin" on events;
create policy "events_update_own_or_admin" on events for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "events_delete_own_or_admin" on events;
create policy "events_delete_own_or_admin" on events for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_events() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_events on events;
create trigger trg_updated_date_events before update on events for each row execute function set_updated_date_events();

-- Investment
create table if not exists investments (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  shares numeric default 0 not null,
  price_per_share numeric default 0,
  amount numeric default 0,
  currency text default 'USD',
  status text default 'confirmed' check (status in ('pending', 'confirmed'))
);

create index if not exists idx_investments_created_by on investments(created_by);
create index if not exists idx_investments_created_date on investments(created_date desc);

alter table investments enable row level security;
drop policy if exists "investments_select_authenticated" on investments;
create policy "investments_select_authenticated" on investments for select using (auth.role() = 'authenticated');
drop policy if exists "investments_insert_own" on investments;
create policy "investments_insert_own" on investments for insert with check (auth.uid() = created_by);
drop policy if exists "investments_update_own_or_admin" on investments;
create policy "investments_update_own_or_admin" on investments for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "investments_delete_own_or_admin" on investments;
create policy "investments_delete_own_or_admin" on investments for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_investments() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_investments on investments;
create trigger trg_updated_date_investments before update on investments for each row execute function set_updated_date_investments();

-- KycDocument
create table if not exists kyc_documents (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  type text default 'nin' not null check (type in ('bvn', 'nin', 'passport', 'drivers_license', 'utility_bill', 'cac', 'tin')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  document_url text,
  notes text,
  verified_at text
);

create index if not exists idx_kyc_documents_created_by on kyc_documents(created_by);
create index if not exists idx_kyc_documents_created_date on kyc_documents(created_date desc);

alter table kyc_documents enable row level security;
drop policy if exists "kyc_documents_select_authenticated" on kyc_documents;
create policy "kyc_documents_select_authenticated" on kyc_documents for select using (auth.role() = 'authenticated');
drop policy if exists "kyc_documents_insert_own" on kyc_documents;
create policy "kyc_documents_insert_own" on kyc_documents for insert with check (auth.uid() = created_by);
drop policy if exists "kyc_documents_update_own_or_admin" on kyc_documents;
create policy "kyc_documents_update_own_or_admin" on kyc_documents for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "kyc_documents_delete_own_or_admin" on kyc_documents;
create policy "kyc_documents_delete_own_or_admin" on kyc_documents for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_kyc_documents() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_kyc_documents on kyc_documents;
create trigger trg_updated_date_kyc_documents before update on kyc_documents for each row execute function set_updated_date_kyc_documents();

-- Label
create table if not exists labels (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  description text,
  logo_url text,
  website text,
  country text,
  status text default 'active' check (status in ('active', 'suspended')),
  artist_count numeric default 0,
  total_releases numeric default 0,
  revenue numeric default 0
);

create index if not exists idx_labels_created_by on labels(created_by);
create index if not exists idx_labels_created_date on labels(created_date desc);

alter table labels enable row level security;
drop policy if exists "labels_select_authenticated" on labels;
create policy "labels_select_authenticated" on labels for select using (auth.role() = 'authenticated');
drop policy if exists "labels_insert_own" on labels;
create policy "labels_insert_own" on labels for insert with check (auth.uid() = created_by);
drop policy if exists "labels_update_own_or_admin" on labels;
create policy "labels_update_own_or_admin" on labels for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "labels_delete_own_or_admin" on labels;
create policy "labels_delete_own_or_admin" on labels for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_labels() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_labels on labels;
create trigger trg_updated_date_labels before update on labels for each row execute function set_updated_date_labels();

-- Notification
create table if not exists notifications (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'success', 'warning', 'error')),
  category text default 'system' check (category in ('distribution', 'promotion', 'royalty', 'payment', 'investment', 'system', 'support')),
  read boolean default false,
  action_url text
);

create index if not exists idx_notifications_created_by on notifications(created_by);
create index if not exists idx_notifications_created_date on notifications(created_date desc);

alter table notifications enable row level security;
drop policy if exists "notifications_select_authenticated" on notifications;
create policy "notifications_select_authenticated" on notifications for select using (auth.role() = 'authenticated');
drop policy if exists "notifications_insert_own" on notifications;
create policy "notifications_insert_own" on notifications for insert with check (auth.uid() = created_by);
drop policy if exists "notifications_update_own_or_admin" on notifications;
create policy "notifications_update_own_or_admin" on notifications for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "notifications_delete_own_or_admin" on notifications;
create policy "notifications_delete_own_or_admin" on notifications for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_notifications() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_notifications on notifications;
create trigger trg_updated_date_notifications before update on notifications for each row execute function set_updated_date_notifications();

-- Order
create table if not exists orders (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  product_id text not null,
  product_name text,
  product_type text,
  amount numeric default 0 not null,
  currency text default 'NGN',
  status text default 'completed' check (status in ('pending', 'completed', 'refunded', 'cancelled')),
  buyer_name text,
  buyer_email text,
  payment_method text
);

create index if not exists idx_orders_created_by on orders(created_by);
create index if not exists idx_orders_created_date on orders(created_date desc);

alter table orders enable row level security;
drop policy if exists "orders_select_authenticated" on orders;
create policy "orders_select_authenticated" on orders for select using (auth.role() = 'authenticated');
drop policy if exists "orders_insert_own" on orders;
create policy "orders_insert_own" on orders for insert with check (auth.uid() = created_by);
drop policy if exists "orders_update_own_or_admin" on orders;
create policy "orders_update_own_or_admin" on orders for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "orders_delete_own_or_admin" on orders;
create policy "orders_delete_own_or_admin" on orders for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_orders() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_orders on orders;
create trigger trg_updated_date_orders before update on orders for each row execute function set_updated_date_orders();

-- Product
create table if not exists products (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  name text not null,
  type text default 'digital_download' check (type in ('merch', 'album', 'single', 'beat_pack', 'sample_pack', 'drum_kit', 'preset', 'template', 'course', 'ebook', 'digital_download', 'membership')),
  description text,
  price numeric default 0,
  currency text default 'NGN',
  inventory numeric default -1,
  artwork_url text,
  file_url text,
  status text default 'active' check (status in ('draft', 'active', 'archived')),
  sales numeric default 0,
  digital boolean default true
);

create index if not exists idx_products_created_by on products(created_by);
create index if not exists idx_products_created_date on products(created_date desc);

alter table products enable row level security;
drop policy if exists "products_select_authenticated" on products;
create policy "products_select_authenticated" on products for select using (auth.role() = 'authenticated');
drop policy if exists "products_insert_own" on products;
create policy "products_insert_own" on products for insert with check (auth.uid() = created_by);
drop policy if exists "products_update_own_or_admin" on products;
create policy "products_update_own_or_admin" on products for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "products_delete_own_or_admin" on products;
create policy "products_delete_own_or_admin" on products for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_products() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_products on products;
create trigger trg_updated_date_products before update on products for each row execute function set_updated_date_products();

-- Release
create table if not exists releases (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  artist text not null,
  featured_artist text,
  genre text,
  language text,
  type text default 'single' check (type in ('single', 'album', 'ep')),
  status text default 'draft' check (status in ('draft', 'scheduled', 'in_review', 'live', 'rejected', 'archived', 'takedown')),
  release_date date,
  artwork_url text,
  audio_url text,
  royalties numeric default 0,
  streams numeric default 0,
  payment_status text default 'unpaid' check (payment_status in ('unpaid', 'pending', 'confirmed', 'failed')),
  payment_transaction_id text,
  distribution_unlocked boolean default false,
  territories jsonb default '["worldwide"]'::jsonb,
  platforms jsonb,
  content_id_status text default 'not_enrolled' check (content_id_status in ('not_enrolled', 'pending', 'active', 'rejected')),
  version text default 'v1',
  metadata_valid boolean default false,
  fast_review boolean default false,
  distribution_attempts numeric default 0,
  last_distributed_at text,
  correction_notes text,
  takedown_status text default 'none' check (takedown_status in ('none', 'requested', 'processing', 'completed')),
  takedown_reason text
);

create index if not exists idx_releases_created_by on releases(created_by);
create index if not exists idx_releases_created_date on releases(created_date desc);

alter table releases enable row level security;
drop policy if exists "releases_select_authenticated" on releases;
create policy "releases_select_authenticated" on releases for select using (auth.role() = 'authenticated');
drop policy if exists "releases_insert_own" on releases;
create policy "releases_insert_own" on releases for insert with check (auth.uid() = created_by);
drop policy if exists "releases_update_own_or_admin" on releases;
create policy "releases_update_own_or_admin" on releases for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "releases_delete_own_or_admin" on releases;
create policy "releases_delete_own_or_admin" on releases for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_releases() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_releases on releases;
create trigger trg_updated_date_releases before update on releases for each row execute function set_updated_date_releases();

-- RoyaltyStatement
create table if not exists royalty_statements (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  period text not null,
  type text default 'streaming' check (type in ('streaming', 'publishing', 'producer', 'sync', 'performance', 'ticket')),
  amount numeric default 0 not null,
  currency text default 'NGN',
  status text default 'pending' check (status in ('pending', 'paid', 'withdrawn')),
  streams numeric default 0,
  songs numeric default 0,
  artist_share numeric default 0,
  producer_share numeric default 0,
  xedruo_share numeric default 0
);

create index if not exists idx_royalty_statements_created_by on royalty_statements(created_by);
create index if not exists idx_royalty_statements_created_date on royalty_statements(created_date desc);

alter table royalty_statements enable row level security;
drop policy if exists "royalty_statements_select_authenticated" on royalty_statements;
create policy "royalty_statements_select_authenticated" on royalty_statements for select using (auth.role() = 'authenticated');
drop policy if exists "royalty_statements_insert_own" on royalty_statements;
create policy "royalty_statements_insert_own" on royalty_statements for insert with check (auth.uid() = created_by);
drop policy if exists "royalty_statements_update_own_or_admin" on royalty_statements;
create policy "royalty_statements_update_own_or_admin" on royalty_statements for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "royalty_statements_delete_own_or_admin" on royalty_statements;
create policy "royalty_statements_delete_own_or_admin" on royalty_statements for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_royalty_statements() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_royalty_statements on royalty_statements;
create trigger trg_updated_date_royalty_statements before update on royalty_statements for each row execute function set_updated_date_royalty_statements();

-- Song
create table if not exists songs (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  artist text not null,
  composers jsonb,
  lyricists jsonb,
  publishers jsonb,
  isrc text,
  iswc text,
  upc text,
  genre text,
  language text,
  duration numeric,
  release_date date,
  splits jsonb,
  status text default 'pending' check (status in ('pending', 'registered', 'rejected')),
  sync_available boolean default false,
  content_id boolean default false
);

create index if not exists idx_songs_created_by on songs(created_by);
create index if not exists idx_songs_created_date on songs(created_date desc);

alter table songs enable row level security;
drop policy if exists "songs_select_authenticated" on songs;
create policy "songs_select_authenticated" on songs for select using (auth.role() = 'authenticated');
drop policy if exists "songs_insert_own" on songs;
create policy "songs_insert_own" on songs for insert with check (auth.uid() = created_by);
drop policy if exists "songs_update_own_or_admin" on songs;
create policy "songs_update_own_or_admin" on songs for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "songs_delete_own_or_admin" on songs;
create policy "songs_delete_own_or_admin" on songs for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_songs() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_songs on songs;
create trigger trg_updated_date_songs before update on songs for each row execute function set_updated_date_songs();

-- StudioBooking
create table if not exists studio_bookings (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  service text not null check (service in ('studio', 'mixing')),
  name text not null,
  email text not null,
  phone text not null,
  date text not null,
  notes text,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled'))
);

create index if not exists idx_studio_bookings_created_by on studio_bookings(created_by);
create index if not exists idx_studio_bookings_created_date on studio_bookings(created_date desc);

alter table studio_bookings enable row level security;
drop policy if exists "studio_bookings_select_authenticated" on studio_bookings;
create policy "studio_bookings_select_authenticated" on studio_bookings for select using (auth.role() = 'authenticated');
drop policy if exists "studio_bookings_insert_own" on studio_bookings;
create policy "studio_bookings_insert_own" on studio_bookings for insert with check (auth.uid() = created_by);
drop policy if exists "studio_bookings_update_own_or_admin" on studio_bookings;
create policy "studio_bookings_update_own_or_admin" on studio_bookings for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "studio_bookings_delete_own_or_admin" on studio_bookings;
create policy "studio_bookings_delete_own_or_admin" on studio_bookings for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_studio_bookings() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_studio_bookings on studio_bookings;
create trigger trg_updated_date_studio_bookings before update on studio_bookings for each row execute function set_updated_date_studio_bookings();

-- SupportTicket
create table if not exists support_tickets (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  title text not null,
  description text not null,
  category text default 'other' check (category in ('distribution', 'payment', 'royalty', 'technical', 'account', 'other')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  response text,
  user_email text
);

create index if not exists idx_support_tickets_created_by on support_tickets(created_by);
create index if not exists idx_support_tickets_created_date on support_tickets(created_date desc);

alter table support_tickets enable row level security;
drop policy if exists "support_tickets_select_authenticated" on support_tickets;
create policy "support_tickets_select_authenticated" on support_tickets for select using (auth.role() = 'authenticated');
drop policy if exists "support_tickets_insert_own" on support_tickets;
create policy "support_tickets_insert_own" on support_tickets for insert with check (auth.uid() = created_by);
drop policy if exists "support_tickets_update_own_or_admin" on support_tickets;
create policy "support_tickets_update_own_or_admin" on support_tickets for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "support_tickets_delete_own_or_admin" on support_tickets;
create policy "support_tickets_delete_own_or_admin" on support_tickets for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_support_tickets() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_support_tickets on support_tickets;
create trigger trg_updated_date_support_tickets before update on support_tickets for each row execute function set_updated_date_support_tickets();

-- TicketPurchase
create table if not exists ticket_purchases (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  event_id text not null,
  event_title text,
  event_date text,
  venue text,
  ticket_type text default 'general' check (ticket_type in ('general', 'vip', 'early_bird', 'free')),
  quantity numeric default 1,
  amount_paid numeric default 0,
  currency text default 'NGN',
  buyer_name text not null,
  buyer_email text not null,
  buyer_phone text,
  payment_status text default 'pending' check (payment_status in ('free', 'confirmed', 'failed', 'pending')),
  qr_code text,
  ticket_number text,
  artist_share numeric default 0,
  producer_share numeric default 0,
  xedruo_share numeric default 0
);

create index if not exists idx_ticket_purchases_created_by on ticket_purchases(created_by);
create index if not exists idx_ticket_purchases_created_date on ticket_purchases(created_date desc);

alter table ticket_purchases enable row level security;
drop policy if exists "ticket_purchases_select_authenticated" on ticket_purchases;
create policy "ticket_purchases_select_authenticated" on ticket_purchases for select using (auth.role() = 'authenticated');
drop policy if exists "ticket_purchases_insert_own" on ticket_purchases;
create policy "ticket_purchases_insert_own" on ticket_purchases for insert with check (auth.uid() = created_by);
drop policy if exists "ticket_purchases_update_own_or_admin" on ticket_purchases;
create policy "ticket_purchases_update_own_or_admin" on ticket_purchases for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "ticket_purchases_delete_own_or_admin" on ticket_purchases;
create policy "ticket_purchases_delete_own_or_admin" on ticket_purchases for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_ticket_purchases() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_ticket_purchases on ticket_purchases;
create trigger trg_updated_date_ticket_purchases before update on ticket_purchases for each row execute function set_updated_date_ticket_purchases();

-- User
create table if not exists user_profiles (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  role text not null check (role in ('admin', 'user'))
);

create index if not exists idx_user_profiles_created_by on user_profiles(created_by);
create index if not exists idx_user_profiles_created_date on user_profiles(created_date desc);

alter table user_profiles enable row level security;
drop policy if exists "user_profiles_select_authenticated" on user_profiles;
create policy "user_profiles_select_authenticated" on user_profiles for select using (auth.role() = 'authenticated');
drop policy if exists "user_profiles_insert_own" on user_profiles;
create policy "user_profiles_insert_own" on user_profiles for insert with check (auth.uid() = created_by);
drop policy if exists "user_profiles_update_own_or_admin" on user_profiles;
create policy "user_profiles_update_own_or_admin" on user_profiles for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "user_profiles_delete_own_or_admin" on user_profiles;
create policy "user_profiles_delete_own_or_admin" on user_profiles for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_user_profiles() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_user_profiles on user_profiles;
create trigger trg_updated_date_user_profiles before update on user_profiles for each row execute function set_updated_date_user_profiles();

-- WalletTransaction
create table if not exists wallet_transactions (

  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  description text,
  type text default 'credit' check (type in ('credit', 'debit')),
  amount numeric default 0 not null,
  currency text default 'NGN' check (currency in ('NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR')),
  category text default 'royalty' check (category in ('royalty', 'beat_sale', 'transfer', 'withdrawal', 'subscription', 'payment_link', 'ticket_sale', 'event_revenue')),
  status text default 'completed' check (status in ('pending', 'completed', 'failed')),
  artist_share numeric default 0,
  producer_share numeric default 0,
  xedruo_share numeric default 0,
  linked_release_id text,
  linked_event_id text
);

create index if not exists idx_wallet_transactions_created_by on wallet_transactions(created_by);
create index if not exists idx_wallet_transactions_created_date on wallet_transactions(created_date desc);

alter table wallet_transactions enable row level security;
drop policy if exists "wallet_transactions_select_authenticated" on wallet_transactions;
create policy "wallet_transactions_select_authenticated" on wallet_transactions for select using (auth.role() = 'authenticated');
drop policy if exists "wallet_transactions_insert_own" on wallet_transactions;
create policy "wallet_transactions_insert_own" on wallet_transactions for insert with check (auth.uid() = created_by);
drop policy if exists "wallet_transactions_update_own_or_admin" on wallet_transactions;
create policy "wallet_transactions_update_own_or_admin" on wallet_transactions for update using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);
drop policy if exists "wallet_transactions_delete_own_or_admin" on wallet_transactions;
create policy "wallet_transactions_delete_own_or_admin" on wallet_transactions for delete using (
  auth.uid() = created_by or exists (select 1 from user_profiles up where up.id = auth.uid() and up.role = 'admin')
);

create or replace function set_updated_date_wallet_transactions() returns trigger as $$
begin new.updated_date = now(); return new; end;
$$ language plpgsql;
drop trigger if exists trg_updated_date_wallet_transactions on wallet_transactions;
create trigger trg_updated_date_wallet_transactions before update on wallet_transactions for each row execute function set_updated_date_wallet_transactions();

