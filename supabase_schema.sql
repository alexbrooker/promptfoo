-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.organizations (
  name text NOT NULL,
  owner_id uuid,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  subscription_tier text DEFAULT 'team'::text,
  max_users integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  pending_test_plan_config jsonb,
  scan_credits integer DEFAULT 0,
  credits_used integer DEFAULT 0,
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  display_name text,
  organization_id uuid,
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])),
  usage_quota integer DEFAULT 5,
  usage_current integer DEFAULT 0,
  usage_reset_date date DEFAULT (CURRENT_DATE + '1 mon'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company text,
  chatbot_role text,
  industry text,
  use_case text,
  compliance_needs ARRAY,
  country_of_operation text,
  terms_accepted boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  name text,
  stripe_customer_id text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.subscriptions (
  user_id uuid,
  organization_id uuid,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan_id text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'incomplete'::text])),
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.usage_logs (
  user_id uuid,
  action text NOT NULL,
  eval_id text,
  metadata jsonb,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  config_type text NOT NULL DEFAULT 'redteam'::text,
  user_id uuid,
  config_id text NOT NULL,
  config_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_configs_pkey PRIMARY KEY (id),
  CONSTRAINT user_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_datasets (
  user_id uuid,
  dataset_id text NOT NULL,
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_datasets_pkey PRIMARY KEY (id),
  CONSTRAINT user_datasets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_eval_access (
  user_id uuid,
  eval_id text NOT NULL,
  granted_by uuid,
  expires_at timestamp with time zone,
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  access_level text DEFAULT 'owner'::text CHECK (access_level = ANY (ARRAY['owner'::text, 'viewer'::text, 'shared'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_eval_access_pkey PRIMARY KEY (id),
  CONSTRAINT user_eval_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id),
  CONSTRAINT user_eval_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);