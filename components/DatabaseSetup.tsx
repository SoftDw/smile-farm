import React, { useState } from 'react';
import Card from './Card';

const sqlSchema = `-- SQL Schema for Smile Farm Application (v5 - Non-destructive User Trigger)
-- This script can be run multiple times without causing errors.

-- 1. Create custom ENUM types safely
DO $$ BEGIN CREATE TYPE public.crop_status AS ENUM ('Planted', 'Growing', 'Harvest Ready'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.device_type AS ENUM ('Sensor', 'Pump', 'Light'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.device_status AS ENUM ('Active', 'Inactive', 'Error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ledger_type AS ENUM ('income', 'expense'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.activity_type AS ENUM ('เพาะปลูก', 'ให้ปุ๋ย', 'กำจัดศัตรูพืช', 'รดน้ำ', 'เก็บเกี่ยว'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.leave_request_type AS ENUM ('ลาป่วย', 'ลากิจ', 'ลาพักร้อน'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.leave_request_status AS ENUM ('Pending', 'Approved', 'Rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.task_status AS ENUM ('To Do', 'In Progress', 'Done'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('Quote', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS public.crops (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    status public.crop_status NOT NULL DEFAULT 'Planted',
    planting_date date NOT NULL,
    expected_harvest date,
    image_url text,
    optimal_temp jsonb,
    optimal_humidity jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.devices (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    type public.device_type NOT NULL,
    status public.device_status NOT NULL DEFAULT 'Inactive',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date date NOT NULL,
    description text NOT NULL,
    type public.ledger_type NOT NULL,
    amount numeric NOT NULL,
    crop_id bigint REFERENCES public.crops(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plots (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    description text,
    current_crop_id bigint REFERENCES public.crops(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    plot_id bigint NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
    activity_type public.activity_type NOT NULL,
    date date NOT NULL,
    description text NOT NULL,
    materials_used text,
    personnel text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    category text,
    quantity numeric NOT NULL,
    unit text NOT NULL,
    low_stock_threshold numeric DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employees (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    nickname text,
    date_of_birth date,
    national_id text,
    address text,
    phone text,
    email text UNIQUE,
    start_date date NOT NULL,
    position text NOT NULL,
    salary numeric,
    contract_url text,
    training_history jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payrolls (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    period text NOT NULL,
    pay_date date NOT NULL,
    gross_pay numeric NOT NULL,
    deductions numeric NOT NULL,
    net_pay numeric NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.time_logs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    timestamp timestamptz NOT NULL,
    type text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type public.leave_request_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.leave_request_status NOT NULL DEFAULT 'Pending',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    task_description text NOT NULL,
    assigned_date date NOT NULL,
    due_date date,
    status public.task_status NOT NULL DEFAULT 'To Do',
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    contact_person text,
    phone text,
    email text,
    address text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sales_orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    customer_id bigint NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_date date NOT NULL,
    status public.order_status NOT NULL DEFAULT 'Quote',
    items jsonb NOT NULL,
    total_amount numeric NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.roles (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    permissions jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.users (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    username text NOT NULL UNIQUE,
    employee_id bigint NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    role_id bigint NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.farm_settings (
    id int PRIMARY KEY DEFAULT 1,
    info jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- 3. Seed initial data (Roles, Settings)
INSERT INTO public.roles (name, permissions) VALUES
('Admin', '{"dashboard":{"view":true,"create":true,"edit":true,"delete":true},"crops":{"view":true,"create":true,"edit":true,"delete":true},"environment":{"view":true,"create":true,"edit":true,"delete":true},"smartdevices":{"view":true,"create":true,"edit":true,"delete":true},"gap":{"view":true,"create":true,"edit":true,"delete":true},"inventory":{"view":true,"create":true,"edit":true,"delete":true},"sales":{"view":true,"create":true,"edit":true,"delete":true},"hr":{"view":true,"create":true,"edit":true,"delete":true},"ledger":{"view":true,"create":true,"edit":true,"delete":true},"profitability":{"view":true,"create":true,"edit":true,"delete":true},"assistant":{"view":true,"create":true,"edit":true,"delete":true},"settings":{"view":true,"create":true,"edit":true,"delete":true},"admin":{"view":true,"create":true,"edit":true,"delete":true}}'),
('Farm Manager', '{"dashboard":{"view":true,"create":false,"edit":false,"delete":false},"crops":{"view":true,"create":true,"edit":true,"delete":true},"environment":{"view":true,"create":false,"edit":false,"delete":false},"smartdevices":{"view":true,"create":true,"edit":true,"delete":false},"gap":{"view":true,"create":true,"edit":true,"delete":false},"inventory":{"view":true,"create":true,"edit":true,"delete":false},"hr":{"view":true,"create":true,"edit":true,"delete":false},"ledger":{"view":true,"create":true,"edit":false,"delete":false},"profitability":{"view":true,"create":false,"edit":false,"delete":false},"assistant":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":true,"create":false,"edit":true,"delete":false},"admin":{"view":false,"create":false,"edit":false,"delete":false},"sales":{"view":true,"create":true,"edit":true,"delete":false}}'),
('Worker', '{"dashboard":{"view":true,"create":false,"edit":false,"delete":false},"crops":{"view":true,"create":false,"edit":false,"delete":false},"environment":{"view":true,"create":false,"edit":false,"delete":false},"smartdevices":{"view":true,"create":false,"edit":false,"delete":false},"gap":{"view":true,"create":true,"edit":false,"delete":false},"inventory":{"view":true,"create":false,"edit":false,"delete":false},"hr":{"view":false,"create":false,"edit":false,"delete":false},"ledger":{"view":false,"create":false,"edit":false,"delete":false},"profitability":{"view":false,"create":false,"edit":false,"delete":false},"assistant":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false},"admin":{"view":false,"create":false,"edit":false,"delete":false},"sales":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.farm_settings (id, info)
VALUES (1, '{"name": "Smile farm", "logoUrl": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN tribulationsvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYTdkN2M1O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzVjOGQ4OTtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cGF0aCBmaWxsPSJ1cmwoI2dyYWQxKSIgZD0iTSAxMDAsMTAgQyA0MCwzMCAyMCwxMDAgMTAwLDE5MCBDIDE4MCwxMDAgMTYwLDMwIDEwMCwxMCBaIiAvPjxwYXRoIGQ9Ik0gNjAsMTE1IFEwLDE0MCAxNDAsMTE1IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjgiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz48L3N2Zz4=", "address": "", "phone": "", "email": "contact@smilefarm.com", "taxId": ""}')
ON CONFLICT (id) DO UPDATE SET info = excluded.info;

-- 4. Seed Admin User Data
DO $$
DECLARE
    admin_role_id BIGINT;
    admin_employee_id BIGINT;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'Admin';
    IF admin_role_id IS NULL THEN RETURN; END IF;
    
    INSERT INTO public.employees (first_name, last_name, email, position, start_date)
    VALUES ('Natthaphong', 'Namwongthas', 'natthaphong.namwongthas@gmail.com', 'System Administrator', '2024-01-01')
    ON CONFLICT (email) DO NOTHING;

    SELECT id INTO admin_employee_id FROM public.employees WHERE email = 'natthaphong.namwongthas@gmail.com';
    
    IF admin_employee_id IS NOT NULL THEN
        INSERT INTO public.users (username, employee_id, role_id)
        VALUES ('natthaphong.namwongthas@gmail.com', admin_employee_id, admin_role_id)
        ON CONFLICT (username) DO NOTHING;
    END IF;
END $$;


-- 5. Create Trigger Function for New Users (NON-DESTRUCTIVE VERSION)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  employee_id_var BIGINT;
  user_role_id BIGINT;
  user_count INT;
BEGIN
  -- Step 1: Determine the role for the new user.
  -- The first user created in the system gets the 'Admin' role.
  -- All subsequent users get the 'Worker' role by default.
  SELECT count(*) INTO user_count FROM public.users;
  IF user_count = 0 THEN
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'Admin';
  ELSE
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'Worker';
  END IF;
  
  -- Step 2: Check if an employee record already exists with the new user's email.
  SELECT id INTO employee_id_var FROM public.employees WHERE email = new.email;
  
  -- Step 3: If no employee record is found, create a new one.
  -- This prevents overwriting existing employee data.
  IF employee_id_var IS NULL THEN
    INSERT INTO public.employees (first_name, last_name, email, position, start_date)
    VALUES ('New', 'User', new.email, 'Awaiting Setup', current_date)
    RETURNING id INTO employee_id_var;
  END IF;

  -- Step 4: Create the user profile in the public.users table,
  -- linking the auth user to the (either existing or new) employee record and role.
  INSERT INTO public.users (username, employee_id, role_id)
  VALUES (new.email, employee_id_var, user_role_id)
  ON CONFLICT (username) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 6. Create the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 7. Enable Row Level Security (RLS) for all tables
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_settings ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.crops;
CREATE POLICY "Allow authenticated users full access" ON public.crops FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.devices;
CREATE POLICY "Allow authenticated users full access" ON public.devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.ledger_entries;
CREATE POLICY "Allow authenticated users full access" ON public.ledger_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.plots;
CREATE POLICY "Allow authenticated users full access" ON public.plots FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.activity_logs;
CREATE POLICY "Allow authenticated users full access" ON public.activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.inventory_items;
CREATE POLICY "Allow authenticated users full access" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.employees;
CREATE POLICY "Allow authenticated users full access" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.payrolls;
CREATE POLICY "Allow authenticated users full access" ON public.payrolls FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.time_logs;
CREATE POLICY "Allow authenticated users full access" ON public.time_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.leave_requests;
CREATE POLICY "Allow authenticated users full access" ON public.leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.tasks;
CREATE POLICY "Allow authenticated users full access" ON public.tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.customers;
CREATE POLICY "Allow authenticated users full access" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.sales_orders;
CREATE POLICY "Allow authenticated users full access" ON public.sales_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.roles;
CREATE POLICY "Allow authenticated users full access" ON public.roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.users;
CREATE POLICY "Allow authenticated users full access" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.farm_settings;
CREATE POLICY "Allow authenticated users full access" ON public.farm_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Add policies for anon read on public data for traceability
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.activity_logs;
CREATE POLICY "Allow anonymous read access" ON public.activity_logs FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.plots;
CREATE POLICY "Allow anonymous read access" ON public.plots FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.crops;
CREATE POLICY "Allow anonymous read access" ON public.crops FOR SELECT TO anon USING (true);
`;

const DatabaseSetup: React.FC = () => {
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sqlSchema).then(() => {
            setCopySuccess('คัดลอก SQL ไปยังคลิปบอร์ดแล้ว!');
            setTimeout(() => setCopySuccess(''), 3000);
        }, () => {
            setCopySuccess('เกิดข้อผิดพลาดในการคัดลอก');
        });
    };

    return (
        <Card title="ตั้งค่าสกีมาฐานข้อมูล (Database Schema)">
            <div className="space-y-4">
                <p className="text-gray-600">
                    เพื่อให้แอปพลิเคชันทำงานได้อย่างถูกต้อง คุณต้องตั้งค่าตารางและข้อมูลพื้นฐานในฐานข้อมูล Supabase ของคุณก่อน
                    <br/>
                    <strong className="text-farm-green-dark">สคริปต์นี้ปลอดภัย สามารถรันซ้ำได้โดยไม่เกิดข้อผิดพลาด</strong>
                </p>
                <div className="bg-farm-brown-light p-4 rounded-lg border border-farm-brown space-y-2">
                    <p><span className="font-bold">ขั้นตอนที่ 1:</span> กดปุ่ม "คัดลอก SQL ทั้งหมด" ด้านล่าง</p>
                    <p><span className="font-bold">ขั้นตอนที่ 2:</span> ไปที่โปรเจกต์ Supabase ของคุณ และไปที่เมนู <span className="font-mono bg-gray-200 px-1 rounded">SQL Editor</span></p>
                    <p><span className="font-bold">ขั้นตอนที่ 3:</span> วางโค้ดที่คัดลอกมาลงในหน้าต่าง SQL Editor แล้วกด <span className="font-mono bg-green-200 px-1 rounded">RUN</span></p>
                </div>
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800">สำหรับผู้ใช้ Admin:</h4>
                    <p className="text-blue-700 text-sm">สคริปต์นี้จะสร้างข้อมูลสำหรับ <code className="font-mono">natthaphong.namwongthas@gmail.com</code> ให้โดยอัตโนมัติ คุณเพียงแค่ต้องไปที่เมนู <span className="font-mono bg-gray-200 px-1 rounded">Authentication</span> ใน Supabase เพื่อสร้างบัญชีล็อกอินด้วยอีเมลนี้และรหัสผ่านที่คุณต้องการ</p>
                </div>

                <div className="my-4">
                    <button
                        onClick={copyToClipboard}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        คัดลอก SQL ทั้งหมด
                    </button>
                    {copySuccess && <p className="text-center text-green-600 mt-2">{copySuccess}</p>}
                </div>

                <div className="relative">
                    <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm max-h-96 overflow-auto">
                        <code>{sqlSchema}</code>
                    </pre>
                </div>
            </div>
        </Card>
    );
};

export default DatabaseSetup;