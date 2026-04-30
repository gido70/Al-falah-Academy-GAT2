-- Alfalah Libraries: central database + storage sync final setup
-- Safe version after existing schools table was created manually

-- 1) Schools table and required columns
create table if not exists public.schools (
  id bigint generated always as identity primary key,
  code text,
  name text,
  city text,
  branch text,
  created_at timestamptz default now()
);
alter table public.schools add column if not exists code text;
alter table public.schools add column if not exists name text;
alter table public.schools add column if not exists city text;
alter table public.schools add column if not exists branch text;
create unique index if not exists schools_code_unique_idx on public.schools (code);

insert into public.schools (code, name, city, branch) values
('dan','فرع الدانة','أبوظبي','الدانة'),
('mzd','فرع محمد بن زايد','أبوظبي','محمد بن زايد'),
('bny','فرع بني ياس','أبوظبي','بني ياس'),
('khb','فرع الخبيصي','العين','الخبيصي'),
('jmi','فرع الجيمي','العين','الجيمي'),
('shj','مدرسة الفلاح الخاصة','الشارقة','الشارقة')
on conflict (code) do update
set name=excluded.name,
    city=excluded.city,
    branch=excluded.branch;

-- 2) Evaluation records
create table if not exists public.library_evaluations (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  school_code text,
  visit_date date,
  librarian_name text,
  total_score numeric,
  final_level text,
  strengths text,
  weaknesses text,
  recommendations text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.library_evaluations add column if not exists school_code text;
alter table public.library_evaluations add column if not exists updated_at timestamptz default now();
create index if not exists library_evaluations_school_idx on public.library_evaluations (school_id);
create index if not exists library_evaluations_code_idx on public.library_evaluations (school_code);

-- 3) Weekly work logs
create table if not exists public.daily_work_logs (
  id bigint generated always as identity primary key,
  week_number int,
  week_title text,
  work_date date,
  day_name text,
  check_in time,
  check_out time,
  task_type text,
  task_details text,
  tasks text,
  notes text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.daily_work_logs add column if not exists week_number int;
alter table public.daily_work_logs add column if not exists week_title text;
alter table public.daily_work_logs add column if not exists day_name text;
alter table public.daily_work_logs add column if not exists task_type text;
alter table public.daily_work_logs add column if not exists task_details text;
alter table public.daily_work_logs add column if not exists tasks text;
alter table public.daily_work_logs add column if not exists full_data jsonb;
alter table public.daily_work_logs add column if not exists updated_at timestamptz default now();
create index if not exists daily_work_logs_week_number_idx on public.daily_work_logs (week_number);

-- 4) Management reports
create table if not exists public.management_reports (
  id bigint generated always as identity primary key,
  report_week text,
  report_date date,
  summary text,
  achievements text,
  challenges text,
  next_steps text,
  full_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.management_reports add column if not exists updated_at timestamptz default now();

-- 5) AI reviews
create table if not exists public.ai_reviews (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  evaluation_id bigint references public.library_evaluations(id),
  review_text text,
  score numeric,
  ai_score numeric,
  ai_summary text,
  ai_strengths text,
  ai_weaknesses text,
  ai_recommendations text,
  full_data jsonb,
  created_at timestamptz default now()
);

-- 6) School files metadata
create table if not exists public.school_files (
  id bigint generated always as identity primary key,
  school_id bigint references public.schools(id),
  school_code text,
  evaluation_id bigint references public.library_evaluations(id),
  file_category text not null,
  file_name text not null,
  file_path text not null,
  file_url text,
  file_type text,
  file_size bigint,
  notes text,
  created_at timestamptz default now()
);
alter table public.school_files add column if not exists school_code text;
create index if not exists school_files_school_code_idx on public.school_files (school_code);
create index if not exists school_files_category_idx on public.school_files (file_category);

-- 7) Storage buckets
insert into storage.buckets (id, name, public) values
('library-images', 'library-images', true),
('library-documents', 'library-documents', true),
('specialist-certificates', 'specialist-certificates', true)
on conflict (id) do update set public=true;

-- 8) RLS
alter table public.schools enable row level security;
alter table public.library_evaluations enable row level security;
alter table public.daily_work_logs enable row level security;
alter table public.management_reports enable row level security;
alter table public.ai_reviews enable row level security;
alter table public.school_files enable row level security;

-- 9) Reset table policies safely
drop policy if exists "allow all schools" on public.schools;
drop policy if exists "allow all evaluations" on public.library_evaluations;
drop policy if exists "allow all daily logs" on public.daily_work_logs;
drop policy if exists "allow all management reports" on public.management_reports;
drop policy if exists "allow all ai reviews" on public.ai_reviews;
drop policy if exists "allow all school files" on public.school_files;

create policy "allow all schools" on public.schools for all to anon, authenticated using (true) with check (true);
create policy "allow all evaluations" on public.library_evaluations for all to anon, authenticated using (true) with check (true);
create policy "allow all daily logs" on public.daily_work_logs for all to anon, authenticated using (true) with check (true);
create policy "allow all management reports" on public.management_reports for all to anon, authenticated using (true) with check (true);
create policy "allow all ai reviews" on public.ai_reviews for all to anon, authenticated using (true) with check (true);
create policy "allow all school files" on public.school_files for all to anon, authenticated using (true) with check (true);

-- 10) Reset storage policies safely
drop policy if exists "alfalah read storage" on storage.objects;
drop policy if exists "alfalah upload storage" on storage.objects;
drop policy if exists "alfalah update storage" on storage.objects;
drop policy if exists "alfalah delete storage" on storage.objects;

create policy "alfalah read storage" on storage.objects for select to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah upload storage" on storage.objects for insert to anon, authenticated
with check (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah update storage" on storage.objects for update to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'))
with check (bucket_id in ('library-images','library-documents','specialist-certificates'));
create policy "alfalah delete storage" on storage.objects for delete to anon, authenticated
using (bucket_id in ('library-images','library-documents','specialist-certificates'));
