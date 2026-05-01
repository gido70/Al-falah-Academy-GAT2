-- Alfalah final database support for central saving
alter table public.library_evaluations add column if not exists school_code text;
alter table public.library_evaluations add column if not exists updated_at timestamptz default now();
alter table public.daily_work_logs add column if not exists week_number int;
alter table public.daily_work_logs add column if not exists week_title text;
alter table public.daily_work_logs add column if not exists full_data jsonb;
alter table public.daily_work_logs add column if not exists updated_at timestamptz default now();
alter table public.management_reports add column if not exists full_data jsonb;
alter table public.management_reports add column if not exists updated_at timestamptz default now();
alter table public.ai_reviews add column if not exists full_data jsonb;
alter table public.school_files add column if not exists school_code text;
create unique index if not exists daily_work_logs_week_number_idx on public.daily_work_logs (week_number);
create index if not exists idx_eval_school on public.library_evaluations (school_id);
create index if not exists idx_files_school on public.school_files (school_id);
insert into storage.buckets (id,name,public) values ('library-images','library-images',true),('library-documents','library-documents',true),('specialist-certificates','specialist-certificates',true) on conflict (id) do update set public=true;
