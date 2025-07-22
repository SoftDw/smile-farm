
import React, { useState } from 'react';
import Card from './Card';

const sqlSchema = `-- SQL Schema for Smile Farm Application (v7 - Correct RLS Policies)
-- This script is idempotent and can be run multiple times safely.

-- 1. Create custom ENUM types if they don't exist
DO $$ BEGIN CREATE TYPE public.crop_status AS ENUM ('Planted', 'Growing', 'Harvest Ready'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.device_type AS ENUM ('Sensor', 'Pump', 'Light'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.device_status AS ENUM ('Active', 'Inactive', 'Error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.ledger_type AS ENUM ('income', 'expense'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.activity_type AS ENUM ('เพาะปลูก', 'ให้ปุ๋ย', 'กำจัดศัตรูพืช', 'รดน้ำ', 'เก็บเกี่ยว'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.leave_request_type AS ENUM ('ลาป่วย', 'ลากิจ', 'ลาพักร้อน'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.leave_request_status AS ENUM ('Pending', 'Approved', 'Rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.task_status AS ENUM ('To Do', 'In Progress', 'Done'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.order_status AS ENUM ('Quote', 'Confirmed', 'Shipped', 'Completed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create tables if they don't exist (structure remains the same)
CREATE TABLE IF NOT EXISTS public.crops ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL, status public.crop_status NOT NULL DEFAULT 'Planted', planting_date date NOT NULL, expected_harvest date, image_url text, optimal_temp jsonb, optimal_humidity jsonb, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.devices ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL, type public.device_type NOT NULL, status public.device_status NOT NULL DEFAULT 'Inactive', created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.employees ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, first_name text NOT NULL, last_name text NOT NULL, nickname text, date_of_birth date, national_id text, address text, phone text, email text UNIQUE, start_date date NOT NULL, position text NOT NULL, salary numeric, contract_url text, training_history jsonb, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.roles ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL UNIQUE, permissions jsonb NOT NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.users ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, username text NOT NULL UNIQUE, employee_id bigint NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE, role_id bigint NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.ledger_entries ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, date date NOT NULL, description text NOT NULL, type public.ledger_type NOT NULL, amount numeric NOT NULL, crop_id bigint REFERENCES public.crops(id) ON DELETE SET NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.plots ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL, description text, current_crop_id bigint REFERENCES public.crops(id) ON DELETE SET NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.activity_logs ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, plot_id bigint NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE, activity_type public.activity_type NOT NULL, date date NOT NULL, description text NOT NULL, materials_used text, personnel text, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.inventory_items ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL, category text, quantity numeric NOT NULL, unit text NOT NULL, low_stock_threshold numeric DEFAULT 0 NOT NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.payrolls ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, period text NOT NULL, pay_date date NOT NULL, gross_pay numeric NOT NULL, deductions numeric NOT NULL, net_pay numeric NOT NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.time_logs ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, "timestamp" timestamptz NOT NULL, type text NOT NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.leave_requests ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, leave_type public.leave_request_type NOT NULL, start_date date NOT NULL, end_date date NOT NULL, reason text NOT NULL, status public.leave_request_status NOT NULL DEFAULT 'Pending', created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.tasks ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, employee_id bigint NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, task_description text NOT NULL, assigned_date date NOT NULL, due_date date, status public.task_status NOT NULL DEFAULT 'To Do', created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.customers ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, name text NOT NULL, contact_person text, phone text, email text, address text, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.sales_orders ( id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY, customer_id bigint NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT, order_date date NOT NULL, status public.order_status NOT NULL DEFAULT 'Quote', items jsonb NOT NULL, total_amount numeric NOT NULL, created_at timestamptz DEFAULT now() NOT NULL );
CREATE TABLE IF NOT EXISTS public.farm_settings ( id int PRIMARY KEY DEFAULT 1, info jsonb NOT NULL, created_at timestamptz DEFAULT now() NOT NULL, CONSTRAINT single_row_check CHECK (id = 1) );


-- 3. Seed initial data (Roles, Settings) - No change in logic, just ensuring it's idempotent
INSERT INTO public.roles (name, permissions) VALUES
('Admin', '{"dashboard":{"view":true,"create":true,"edit":true,"delete":true},"crops":{"view":true,"create":true,"edit":true,"delete":true},"environment":{"view":true,"create":true,"edit":true,"delete":true},"smartdevices":{"view":true,"create":true,"edit":true,"delete":true},"gap":{"view":true,"create":true,"edit":true,"delete":true},"inventory":{"view":true,"create":true,"edit":true,"delete":true},"sales":{"view":true,"create":true,"edit":true,"delete":true},"hr":{"view":true,"create":true,"edit":true,"delete":true},"ledger":{"view":true,"create":true,"edit":true,"delete":true},"profitability":{"view":true,"create":true,"edit":true,"delete":true},"reports":{"view":true,"create":true,"edit":true,"delete":true},"assistant":{"view":true,"create":true,"edit":true,"delete":true},"settings":{"view":true,"create":true,"edit":true,"delete":true},"admin":{"view":true,"create":true,"edit":true,"delete":true}}'),
('Farm Manager', '{"dashboard":{"view":true,"create":false,"edit":false,"delete":false},"crops":{"view":true,"create":true,"edit":true,"delete":true},"environment":{"view":true,"create":false,"edit":false,"delete":false},"smartdevices":{"view":true,"create":true,"edit":true,"delete":false},"gap":{"view":true,"create":true,"edit":true,"delete":false},"inventory":{"view":true,"create":true,"edit":true,"delete":false},"hr":{"view":true,"create":true,"edit":true,"delete":false},"ledger":{"view":true,"create":true,"edit":false,"delete":false},"profitability":{"view":true,"create":false,"edit":false,"delete":false},"reports":{"view":true,"create":false,"edit":false,"delete":false},"assistant":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":true,"create":false,"edit":true,"delete":false},"admin":{"view":false,"create":false,"edit":false,"delete":false},"sales":{"view":true,"create":true,"edit":true,"delete":false}}'),
('Worker', '{"dashboard":{"view":true,"create":false,"edit":false,"delete":false},"crops":{"view":true,"create":false,"edit":false,"delete":false},"environment":{"view":true,"create":false,"edit":false,"delete":false},"smartdevices":{"view":true,"create":false,"edit":false,"delete":false},"gap":{"view":true,"create":true,"edit":false,"delete":false},"inventory":{"view":true,"create":false,"edit":false,"delete":false},"hr":{"view":false,"create":false,"edit":false,"delete":false},"ledger":{"view":false,"create":false,"edit":false,"delete":false},"profitability":{"view":false,"create":false,"edit":false,"delete":false},"reports":{"view":false,"create":false,"edit":false,"delete":false},"assistant":{"view":true,"create":false,"edit":false,"delete":false},"settings":{"view":false,"create":false,"edit":false,"delete":false},"admin":{"view":false,"create":false,"edit":false,"delete":false},"sales":{"view":false,"create":false,"edit":false,"delete":false}}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.farm_settings (id, info)
VALUES (1, '{"name": "Smile farm", "logoUrl": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg==", "address": "", "phone": "", "email": "contact@smilefarm.com", "taxId": ""}')
ON CONFLICT (id) DO UPDATE SET info = excluded.info;

-- 4. Create Security Helper Functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.name
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.username = auth.email();
$$;

CREATE OR REPLACE FUNCTION public.check_permission(module_name text, permission_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role_id BIGINT;
  has_permission BOOLEAN;
BEGIN
  -- Get the role_id of the current user
  SELECT role_id INTO user_role_id
  FROM public.users
  WHERE username = auth.email()
  LIMIT 1;

  IF user_role_id IS NULL THEN
    RETURN FALSE; -- No user profile found
  END IF;

  -- Check the permissions from the roles table
  SELECT (permissions->module_name->>permission_type)::boolean INTO has_permission
  FROM public.roles
  WHERE id = user_role_id;
  
  -- Return true if permission exists and is true, otherwise false
  RETURN COALESCE(has_permission, FALSE);
END;
$$;


-- 5. Create Trigger Function for New Users (Smarter Version)
-- This function now correctly assigns 'Admin' to the very first user, and 'Worker' to everyone else.
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
  -- Determine the role for the new user.
  -- The first user created in the system gets the 'Admin' role.
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'Admin';
  ELSE
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'Worker';
  END IF;
  
  -- Create a new employee record for this user.
  INSERT INTO public.employees (first_name, last_name, email, position, start_date)
  VALUES ('New User', '(Pending Setup)', new.email, 'Awaiting Setup', current_date)
  RETURNING id INTO employee_id_var;

  -- Create the user profile in the public.users table.
  INSERT INTO public.users (username, employee_id, role_id)
  VALUES (new.email, employee_id_var, user_role_id);
  
  RETURN NEW;
END;
$$;

-- 6. Create the Trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

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

-- 8. Define Secure RLS Policies for each table
-- Policies are now defined per-command (SELECT, INSERT, UPDATE, DELETE) for correctness.
-- This replaces the old, incorrect 'FOR ALL' policies.

-- For table 'crops' (module: 'crops')
DROP POLICY IF EXISTS "Allow select access" ON public.crops;
CREATE POLICY "Allow select access" ON public.crops FOR SELECT USING (check_permission('crops', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.crops;
CREATE POLICY "Allow insert access" ON public.crops FOR INSERT WITH CHECK (check_permission('crops', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.crops;
CREATE POLICY "Allow update access" ON public.crops FOR UPDATE USING (check_permission('crops', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.crops;
CREATE POLICY "Allow delete access" ON public.crops FOR DELETE USING (check_permission('crops', 'delete'));

-- For table 'devices' (module: 'smartdevices')
DROP POLICY IF EXISTS "Allow select access" ON public.devices;
CREATE POLICY "Allow select access" ON public.devices FOR SELECT USING (check_permission('smartdevices', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.devices;
CREATE POLICY "Allow insert access" ON public.devices FOR INSERT WITH CHECK (check_permission('smartdevices', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.devices;
CREATE POLICY "Allow update access" ON public.devices FOR UPDATE USING (check_permission('smartdevices', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.devices;
CREATE POLICY "Allow delete access" ON public.devices FOR DELETE USING (check_permission('smartdevices', 'delete'));

-- For table 'ledger_entries' (module: 'ledger')
DROP POLICY IF EXISTS "Allow select access" ON public.ledger_entries;
CREATE POLICY "Allow select access" ON public.ledger_entries FOR SELECT USING (check_permission('ledger', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.ledger_entries;
CREATE POLICY "Allow insert access" ON public.ledger_entries FOR INSERT WITH CHECK (check_permission('ledger', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.ledger_entries;
CREATE POLICY "Allow update access" ON public.ledger_entries FOR UPDATE USING (check_permission('ledger', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.ledger_entries;
CREATE POLICY "Allow delete access" ON public.ledger_entries FOR DELETE USING (check_permission('ledger', 'delete'));

-- For table 'plots' (module: 'gap')
DROP POLICY IF EXISTS "Allow select access" ON public.plots;
CREATE POLICY "Allow select access" ON public.plots FOR SELECT USING (check_permission('gap', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.plots;
CREATE POLICY "Allow insert access" ON public.plots FOR INSERT WITH CHECK (check_permission('gap', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.plots;
CREATE POLICY "Allow update access" ON public.plots FOR UPDATE USING (check_permission('gap', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.plots;
CREATE POLICY "Allow delete access" ON public.plots FOR DELETE USING (check_permission('gap', 'delete'));

-- For table 'activity_logs' (module: 'gap')
DROP POLICY IF EXISTS "Allow select access" ON public.activity_logs;
CREATE POLICY "Allow select access" ON public.activity_logs FOR SELECT USING (check_permission('gap', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.activity_logs;
CREATE POLICY "Allow insert access" ON public.activity_logs FOR INSERT WITH CHECK (check_permission('gap', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.activity_logs;
CREATE POLICY "Allow update access" ON public.activity_logs FOR UPDATE USING (check_permission('gap', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.activity_logs;
CREATE POLICY "Allow delete access" ON public.activity_logs FOR DELETE USING (check_permission('gap', 'delete'));

-- For table 'inventory_items' (module: 'inventory')
DROP POLICY IF EXISTS "Allow select access" ON public.inventory_items;
CREATE POLICY "Allow select access" ON public.inventory_items FOR SELECT USING (check_permission('inventory', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.inventory_items;
CREATE POLICY "Allow insert access" ON public.inventory_items FOR INSERT WITH CHECK (check_permission('inventory', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.inventory_items;
CREATE POLICY "Allow update access" ON public.inventory_items FOR UPDATE USING (check_permission('inventory', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.inventory_items;
CREATE POLICY "Allow delete access" ON public.inventory_items FOR DELETE USING (check_permission('inventory', 'delete'));

-- For table 'employees' and related (module: 'hr')
DROP POLICY IF EXISTS "Allow select access" ON public.employees;
CREATE POLICY "Allow select access" ON public.employees FOR SELECT USING (check_permission('hr', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.employees;
CREATE POLICY "Allow insert access" ON public.employees FOR INSERT WITH CHECK (check_permission('hr', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.employees;
CREATE POLICY "Allow update access" ON public.employees FOR UPDATE USING (check_permission('hr', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.employees;
CREATE POLICY "Allow delete access" ON public.employees FOR DELETE USING (check_permission('hr', 'delete'));

DROP POLICY IF EXISTS "Allow select access" ON public.payrolls;
CREATE POLICY "Allow select access" ON public.payrolls FOR SELECT USING (check_permission('hr', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.payrolls;
CREATE POLICY "Allow insert access" ON public.payrolls FOR INSERT WITH CHECK (check_permission('hr', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.payrolls;
CREATE POLICY "Allow update access" ON public.payrolls FOR UPDATE USING (check_permission('hr', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.payrolls;
CREATE POLICY "Allow delete access" ON public.payrolls FOR DELETE USING (check_permission('hr', 'delete'));

DROP POLICY IF EXISTS "Allow select access" ON public.time_logs;
CREATE POLICY "Allow select access" ON public.time_logs FOR SELECT USING (check_permission('hr', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.time_logs;
CREATE POLICY "Allow insert access" ON public.time_logs FOR INSERT WITH CHECK (check_permission('hr', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.time_logs;
CREATE POLICY "Allow update access" ON public.time_logs FOR UPDATE USING (check_permission('hr', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.time_logs;
CREATE POLICY "Allow delete access" ON public.time_logs FOR DELETE USING (check_permission('hr', 'delete'));

DROP POLICY IF EXISTS "Allow select access" ON public.leave_requests;
CREATE POLICY "Allow select access" ON public.leave_requests FOR SELECT USING (check_permission('hr', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.leave_requests;
CREATE POLICY "Allow insert access" ON public.leave_requests FOR INSERT WITH CHECK (check_permission('hr', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.leave_requests;
CREATE POLICY "Allow update access" ON public.leave_requests FOR UPDATE USING (check_permission('hr', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.leave_requests;
CREATE POLICY "Allow delete access" ON public.leave_requests FOR DELETE USING (check_permission('hr', 'delete'));

DROP POLICY IF EXISTS "Allow select access" ON public.tasks;
CREATE POLICY "Allow select access" ON public.tasks FOR SELECT USING (check_permission('hr', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.tasks;
CREATE POLICY "Allow insert access" ON public.tasks FOR INSERT WITH CHECK (check_permission('hr', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.tasks;
CREATE POLICY "Allow update access" ON public.tasks FOR UPDATE USING (check_permission('hr', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.tasks;
CREATE POLICY "Allow delete access" ON public.tasks FOR DELETE USING (check_permission('hr', 'delete'));

-- For 'customers' and 'sales_orders' tables (module: 'sales')
DROP POLICY IF EXISTS "Allow select access" ON public.customers;
CREATE POLICY "Allow select access" ON public.customers FOR SELECT USING (check_permission('sales', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.customers;
CREATE POLICY "Allow insert access" ON public.customers FOR INSERT WITH CHECK (check_permission('sales', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.customers;
CREATE POLICY "Allow update access" ON public.customers FOR UPDATE USING (check_permission('sales', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.customers;
CREATE POLICY "Allow delete access" ON public.customers FOR DELETE USING (check_permission('sales', 'delete'));

DROP POLICY IF EXISTS "Allow select access" ON public.sales_orders;
CREATE POLICY "Allow select access" ON public.sales_orders FOR SELECT USING (check_permission('sales', 'view'));
DROP POLICY IF EXISTS "Allow insert access" ON public.sales_orders;
CREATE POLICY "Allow insert access" ON public.sales_orders FOR INSERT WITH CHECK (check_permission('sales', 'create'));
DROP POLICY IF EXISTS "Allow update access" ON public.sales_orders;
CREATE POLICY "Allow update access" ON public.sales_orders FOR UPDATE USING (check_permission('sales', 'edit'));
DROP POLICY IF EXISTS "Allow delete access" ON public.sales_orders;
CREATE POLICY "Allow delete access" ON public.sales_orders FOR DELETE USING (check_permission('sales', 'delete'));

-- For 'roles' and 'users' tables (module: 'admin')
DROP POLICY IF EXISTS "Allow select access" ON public.roles;
CREATE POLICY "Allow select access" ON public.roles FOR SELECT USING (check_permission('admin', 'view'));
DROP POLICY IF EXISTS "Allow update access" ON public.roles;
CREATE POLICY "Allow update access" ON public.roles FOR UPDATE USING (check_permission('admin', 'edit'));

DROP POLICY IF EXISTS "Allow select access" ON public.users;
CREATE POLICY "Allow select access" ON public.users FOR SELECT USING (check_permission('admin', 'view'));
DROP POLICY IF EXISTS "Allow update access" ON public.users;
CREATE POLICY "Allow update access" ON public.users FOR UPDATE USING (check_permission('admin', 'edit'));

-- For table 'farm_settings' (module: 'settings')
DROP POLICY IF EXISTS "Allow select access" ON public.farm_settings;
CREATE POLICY "Allow select access" ON public.farm_settings FOR SELECT USING (check_permission('settings', 'view'));
DROP POLICY IF EXISTS "Allow update access" ON public.farm_settings;
CREATE POLICY "Allow update access" ON public.farm_settings FOR UPDATE USING (check_permission('settings', 'edit'));


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
                    เพื่อให้แอปพลิเคชันทำงานได้อย่างถูกต้องและปลอดภัยสูงสุด คุณต้องตั้งค่าตารางและสิทธิ์การเข้าถึง (Row Level Security) ในฐานข้อมูล Supabase ของคุณก่อน
                    <br/>
                    <strong className="text-farm-green-dark">สคริปต์นี้ปลอดภัย สามารถรันซ้ำได้โดยไม่เกิดข้อผิดพลาด</strong>
                </p>
                <div className="bg-farm-brown-light p-4 rounded-lg border border-farm-brown space-y-2">
                    <p><span className="font-bold">ขั้นตอนที่ 1:</span> กดปุ่ม "คัดลอก SQL ทั้งหมด" ด้านล่าง</p>
                    <p><span className="font-bold">ขั้นตอนที่ 2:</span> ไปที่โปรเจกต์ Supabase ของคุณ และไปที่เมนู <span className="font-mono bg-gray-200 px-1 rounded">SQL Editor</span></p>
                    <p><span className="font-bold">ขั้นตอนที่ 3:</span> วางโค้ดที่คัดลอกมาลงในหน้าต่าง SQL Editor แล้วกด <span className="font-mono bg-green-200 px-1 rounded">RUN</span></p>
                </div>
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-bold text-blue-800">การสร้างผู้ใช้ Admin คนแรก</h4>
                    <p className="text-blue-700 text-sm">สคริปต์นี้จะกำหนดให้ <strong className="font-semibold">ผู้ใช้คนแรกที่ลงทะเบียน</strong> ได้รับสิทธิ์ 'Admin' โดยอัตโนมัติ คุณเพียงแค่ใช้หน้า "เข้าสู่ระบบ / ลงทะเบียน" ในแอปพลิเคชันเพื่อสร้างบัญชีแรกของคุณ</p>
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
