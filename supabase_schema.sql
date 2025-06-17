-- Supabase Schema Export
-- Generated from existing database structure

-- Table: organizations
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    subscription_tier text DEFAULT 'team'::text,
    max_users integer DEFAULT 5,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Table: profiles
CREATE TABLE public.profiles (
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
    PRIMARY KEY (id)
);

-- Table: subscriptions
CREATE TABLE public.subscriptions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    organization_id uuid,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text UNIQUE,
    plan_id text NOT NULL,
    status text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'canceled'::text, 'past_due'::text, 'incomplete'::text])),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Table: usage_logs
CREATE TABLE public.usage_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    action text NOT NULL,
    eval_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Table: user_eval_access
CREATE TABLE public.user_eval_access (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    eval_id text NOT NULL,
    access_level text DEFAULT 'owner'::text CHECK (access_level = ANY (ARRAY['owner'::text, 'viewer'::text, 'shared'::text])),
    granted_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    PRIMARY KEY (id)
);

-- Foreign Key Constraints
ALTER TABLE public.organizations ADD CONSTRAINT fk_organizations_owner FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.user_eval_access ADD CONSTRAINT user_eval_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.user_eval_access ADD CONSTRAINT user_eval_access_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id);