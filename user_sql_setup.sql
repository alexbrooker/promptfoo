-- Create a basic users table (Supabase already provides auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade,
  email text,
  name text,
  company text,
  chatbot_role text,
  industry text,
  use_case text,
  compliance_needs text[],
  country_of_operation text,
  terms_accepted boolean default false,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id );