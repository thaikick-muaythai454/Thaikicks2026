-- SUPABASE FULL BACKUP & MIGRATION SCRIPT
-- Project: Thaikick
-- Date: 2026-02-05

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. SCHEMAS & TABLES
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL PRIMARY KEY,
  email text,
  name text,
  role text DEFAULT 'customer'::text CHECK (role IN ('admin', 'owner', 'customer')),
  avatar_url text,
  is_affiliate boolean DEFAULT false,
  affiliate_code text UNIQUE,
  affiliate_earnings numeric DEFAULT 0,
  affiliate_status text DEFAULT 'none'::text CHECK (affiliate_status IN ('none', 'pending', 'active', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.gyms (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  location text,
  description text,
  images text[],
  base_price numeric NOT NULL,
  owner_id uuid REFERENCES public.users(id),
  is_flash_sale boolean DEFAULT false,
  flash_sale_discount integer DEFAULT 0,
  affiliate_percentage numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trainers (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  name text NOT NULL,
  specialty text,
  languages text[],
  image_url text,
  price_per_session numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trainer_schedules (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  trainer_id uuid NOT NULL REFERENCES public.trainers(id),
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  duration text,
  max_students integer,
  design_data jsonb DEFAULT '{}'::jsonb,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  gym_id uuid NOT NULL REFERENCES public.gyms(id),
  trainer_id uuid REFERENCES public.trainers(id),
  course_id uuid REFERENCES public.courses(id),
  date date NOT NULL,
  start_time time,
  end_time time,
  status text DEFAULT 'confirmed'::text CHECK (status IN ('confirmed', 'completed', 'cancelled')),
  type text DEFAULT 'standard'::text CHECK (type IN ('standard', 'private')),
  total_price numeric NOT NULL,
  commission_amount numeric DEFAULT 0,
  commission_paid_to uuid REFERENCES public.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  image_url text,
  category text,
  stock_status text DEFAULT 'in_stock'::text,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.shop_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending'::text,
  payment_status text DEFAULT 'unpaid'::text,
  payment_method text,
  shipping_address text,
  contact_details text,
  admin_notes text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  payment_verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.shop_orders(id),
  product_id uuid REFERENCES public.products(id),
  quantity integer NOT NULL,
  price_at_purchase numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  reason text,
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.system_settings (
  key text NOT NULL PRIMARY KEY,
  value text NOT NULL,
  description text
);

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.check_affiliate_code(code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  exists_and_active boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE affiliate_code = code
    AND is_affiliate = true
    AND affiliate_status = 'active'
  ) INTO exists_and_active;
  
  RETURN exists_and_active;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'customer');
  return new;
end;
$function$;

-- 4. TRIGGERS
-- Note: Re-enable this after importing existing users to avoid duplicates
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RLS POLICIES (Summary)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- Users Policies
CREATE POLICY "Admins and Owners can read all users" ON public.users FOR SELECT USING (get_my_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable insert for users based on id" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users based on id" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Gyms Policies
CREATE POLICY "Allow public read access on gyms" ON public.gyms FOR SELECT USING (true);
CREATE POLICY "Admins can manage gyms" ON public.gyms FOR ALL USING (get_my_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Products Policies
CREATE POLICY "Allow public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (get_my_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- Shop Orders Policies
CREATE POLICY "Users create orders" ON public.shop_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own orders" ON public.shop_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.shop_orders FOR SELECT USING (get_my_role() = ANY (ARRAY['admin'::text, 'owner'::text]));
CREATE POLICY "Admins update orders" ON public.shop_orders FOR UPDATE USING (get_my_role() = ANY (ARRAY['admin'::text, 'owner'::text]));

-- 6. SEED DATA (Important current records)
INSERT INTO public.system_settings (key, value, description) VALUES 
('promptpay_number', '0980077527', 'Official PromptPay number for receiving payments')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.products (id, name, price, description, category, image_url, stock_status, is_featured) VALUES
('4492bda0-9722-4a5d-b937-0d1a92ce653e', 'Hat', 500, 'For protection', 'Hat', 'https://m.media-amazon.com/images/I/61FBvTDUehL.jpg', 'in_stock', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gyms (id, name, location, description, images, base_price, affiliate_percentage) VALUES
('fb79b42e-6b31-4b6b-b753-d33947801cf4', 'GYM1', 'Phuket', 'Boxing MuayThai', ARRAY['https://theboxthailand.com/wp-content/uploads/2024/10/the-box-bangkok-boxing-thailand.jpg'], 5000, 5)
ON CONFLICT (id) DO NOTHING;
