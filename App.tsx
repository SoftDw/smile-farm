
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PostgrestResponse, type Session, PostgrestSingleResponse } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Crops from './components/Crops';
import Environment from './components/Environment';
import Assistant from './components/Assistant';
import Settings from './components/Settings';
import FarmLedger from './components/FarmLedger';
import ProductProfitability from './components/ProductProfitability';
import GapManagement from './components/GapManagement';
import Inventory from './components/Inventory';
import EmployeeManagement from './components/EmployeeManagement';
import AdminManagement from './components/AdminManagement';
import SalesManagement from './components/SalesManagement';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import SmartFarmDevices from './components/SmartFarmDevices';
import { supabase } from './lib/supabaseClient';
import { MODULES, MOCK_ENVIRONMENT_DATA } from './constants';
import { AppModule, Crop, Device, EnvironmentData, LedgerEntry, Plot, ActivityLog, FarmInfo, Alert, InventoryItem, Employee, PayrollEntry, TimeLog, LeaveRequest, AssignedTask, User, Role, CurrentUser, PermissionsMap, PermissionSet, Customer, SalesOrder, OrderItem } from './types';
import { Database, Json } from './lib/database.types';
import MenuIcon from './components/icons/MenuIcon';
import Reports from './components/Reports';

type CropInsert = Database['public']['Tables']['crops']['Insert'];
type DeviceInsert = Database['public']['Tables']['devices']['Insert'];
type LedgerEntryInsert = Database['public']['Tables']['ledger_entries']['Insert'];
type PlotInsert = Database['public']['Tables']['plots']['Insert'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type LeaveRequestInsert = Database['public']['Tables']['leave_requests']['Insert'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type SalesOrderInsert = Database['public']['Tables']['sales_orders']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
type RoleUpdate = Database['public']['Tables']['roles']['Update'];


const App = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [locationHash, setLocationHash] = useState(window.location.hash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // --- Local State ---
  const initialFarmInfo: FarmInfo = {
    name: "Smile farm",
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg==',
    address: "",
    phone: "",
    email: "",
    taxId: ""
  };
  const [farmInfo, setFarmInfo] = useState<FarmInfo>(initialFarmInfo);

  // --- Data State ---
  const [crops, setCrops] = useState<Crop[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [environmentData, setEnvironmentData] = useState<EnvironmentData[]>(MOCK_ENVIRONMENT_DATA);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  // --- Auth & Loading State ---
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Memoized Derived Data ---
  const alerts: Alert[] = useMemo(() => {
    const newAlerts: Alert[] = [];
    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.lowStockThreshold);
    lowStockItems.forEach(item => {
      newAlerts.push({
        id: `stock-${item.id}`,
        type: 'warning',
        message: `ปัจจัยการผลิต "${item.name}" มีปริมาณต่ำ (${item.quantity} ${item.unit})`,
      });
    });
    
    crops.filter(c => c.status === 'Harvest Ready').forEach(crop => {
         newAlerts.push({
            id: `harvest-${crop.id}`,
            type: 'task',
            message: `"${crop.name}" พร้อมสำหรับการเก็บเกี่ยวแล้ว!`
        });
    });

    return newAlerts;
  }, [inventoryItems, crops]);
  
  const pageTitles: { [key: string]: string } = {
    dashboard: 'แผงควบคุมหลัก',
    crops: 'จัดการพืชผล',
    environment: 'ภาพรวมสภาพแวดล้อม',
    smartdevices: 'อุปกรณ์สมาร์ทฟาร์ม',
    gap: 'การจัดการมาตรฐาน GAP',
    inventory: 'คลังปัจจัยการผลิต',
    sales: 'การตลาดและการขาย',
    hr: 'การจัดการพนักงาน',
    ledger: 'บัญชีฟาร์ม',
    profitability: 'กำไรขาดทุนต่อสินค้า',
    reports: 'รายงานและบทวิเคราะห์',
    assistant: 'ผู้ช่วยอัจฉริยะ',
    settings: 'การตั้งค่า',
    admin: 'การจัดการผู้ดูแลระบบ',
  };

  // --- Data Fetching and Management ---
  const fetchData = useCallback(async (currentSession: Session) => {
    setLoading(true);

    try {
      // Step 1: Check if user profile exists
      const { data: userData, error: userError }: PostgrestSingleResponse<Database['public']['Tables']['users']['Row']> = await supabase
        .from('users')
        .select(`*`)
        .eq('username', currentSession.user.email!)
        .single();

      if (userError || !userData) {
          console.error("Critical Error: User profile not found in database after login.", userError);
          alert("An error occurred while accessing your user profile. Please try logging in again. If the problem persists, contact support.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
      }

      // Step 1.5: Get permissions for the user's role
      const { data: roleData, error: roleError }: PostgrestSingleResponse<Database['public']['Tables']['roles']['Row']> = await supabase
        .from('roles')
        .select('*')
        .eq('id', userData.role_id)
        .single();

       if (roleError || !roleData) {
          console.error("Critical Error: Could not retrieve role permissions for user.", roleError);
          alert("An error occurred while accessing your user permissions. Please try logging in again.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
      }
      
      // Step 2: Build the CurrentUser object with permissions
      const userPermissions: PermissionsMap = (roleData.permissions as any || {});
      const user: CurrentUser = {
        id: userData.id,
        username: userData.username,
        employeeId: userData.employee_id,
        roleId: userData.role_id,
        password: '', // Not stored in frontend
        permissions: userPermissions,
      };
      setCurrentUser(user);

      // Step 3: Fetch all farm data concurrently
      const dataPromises = [
          supabase.from('crops').select('*').order('created_at', { ascending: false }),
          supabase.from('devices').select('*').order('created_at', { ascending: false }),
          supabase.from('ledger_entries').select('*').order('date', { ascending: false }),
          supabase.from('plots').select('*').order('created_at', { ascending: false }),
          supabase.from('activity_logs').select('*').order('date', { ascending: false }),
          supabase.from('inventory_items').select('*').order('name', { ascending: true }),
          supabase.from('employees').select('*').order('first_name', { ascending: true }),
          supabase.from('payrolls').select('*').order('pay_date', { ascending: false }),
          supabase.from('time_logs').select('*').order('timestamp', { ascending: false }),
          supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
          supabase.from('tasks').select('*').order('due_date', { ascending: true }),
          supabase.from('customers').select('*').order('name', { ascending: true }),
          supabase.from('sales_orders').select('*').order('order_date', { ascending: false }),
          supabase.from('users').select('*'),
          supabase.from('roles').select('*'),
      ];

      const settingsPromise = supabase.from('farm_settings').select('*').eq('id', 1).single();
      
      const [dataResponses, settingsRes] = await Promise.all([
          Promise.all(dataPromises),
          settingsPromise
      ]);

      const errors = (dataResponses as any[]).map(res => res.error).filter(Boolean);
      if (settingsRes.error) errors.push(settingsRes.error);
      
      if (errors.length > 0) {
        errors.forEach(error => console.error("Error fetching data:", error));
        throw new Error(`Failed to fetch data. Encountered ${errors.length} errors.`);
      }

      const [
          cropsRes, devicesRes, ledgerRes, plotsRes, activityLogsRes, inventoryRes, 
          employeesRes, payrollsRes, timeLogsRes, leaveRequestsRes, tasksRes, customersRes,
          salesOrdersRes, usersRes, rolesRes
      ] = dataResponses as any[];


      // Step 4: Set state
      setCrops(cropsRes.data?.map((c: any) => ({ id: c.id, name: c.name, status: c.status as Crop['status'], plantingDate: c.planting_date, expectedHarvest: c.expected_harvest || "", imageUrl: c.image_url || "", optimalTemp: c.optimal_temp as any, optimalHumidity: c.optimal_humidity as any })) ?? []);
      setDevices(devicesRes.data?.map((d: any) => ({...d, status: d.status as Device['status'], type: d.type as Device['type']})) ?? []);
      setLedgerEntries(ledgerRes.data?.map((l: any) => ({ id: l.id, date: l.date, description: l.description, type: l.type as LedgerEntry['type'], amount: l.amount, cropId: l.crop_id ?? undefined })) ?? []);
      setPlots(plotsRes.data?.map((p: any) => ({ id: p.id, name: p.name, description: p.description || '', currentCropId: p.current_crop_id ?? undefined })) ?? []);
      setActivityLogs(activityLogsRes.data?.map((a: any) => ({ id: a.id, plotId: a.plot_id, activityType: a.activity_type as ActivityLog['activityType'], date: a.date, description: a.description, materialsUsed: a.materials_used ?? undefined, personnel: a.personnel || '' })) ?? []);
      setInventoryItems(inventoryRes.data?.map((i: any) => ({ id: i.id, name: i.name, category: i.category || '', quantity: i.quantity, unit: i.unit, lowStockThreshold: i.low_stock_threshold })) ?? []);
      setEmployees(employeesRes.data?.map((e: any) => ({ id: e.id, firstName: e.first_name, lastName: e.last_name, nickname: e.nickname || '', dateOfBirth: e.date_of_birth || '', nationalId: e.national_id || '', address: e.address || '', phone: e.phone || '', email: e.email || '', startDate: e.start_date, position: e.position, salary: e.salary || 0, contractUrl: e.contract_url ?? undefined, trainingHistory: (e.training_history as string[] | undefined) ?? undefined })) ?? []);
      setPayrolls(payrollsRes.data?.map((p: any) => ({ id: p.id, employeeId: p.employee_id, period: p.period, payDate: p.pay_date, grossPay: p.gross_pay, deductions: p.deductions, netPay: p.net_pay })) ?? []);
      setTimeLogs(timeLogsRes.data?.map((t: any) => ({ id: t.id, employeeId: t.employee_id, timestamp: t.timestamp, type: t.type as 'clock-in' | 'clock-out' })) ?? []);
      setLeaveRequests(leaveRequestsRes.data?.map((r: any) => ({ id: r.id, employeeId: r.employee_id, leaveType: r.leave_type as LeaveRequest['leaveType'], startDate: r.start_date, endDate: r.end_date, reason: r.reason, status: r.status as LeaveRequest['status'] })) ?? []);
      setTasks(tasksRes.data?.map((t: any) => ({ id: t.id, employeeId: t.employee_id, taskDescription: t.task_description, assignedDate: t.assigned_date, dueDate: t.due_date || '', status: t.status as AssignedTask['status'] })) ?? []);
      setCustomers(customersRes.data?.map((c: any) => ({ id: c.id, name: c.name, contactPerson: c.contact_person || '', phone: c.phone || '', email: c.email || '', address: c.address || '' })) ?? []);
      setSalesOrders(salesOrdersRes.data?.map((o: any) => ({ id: o.id, customerId: o.customer_id, orderDate: o.order_date, status: o.status as SalesOrder['status'], totalAmount: o.total_amount, items: (o.items as any) ?? [] })) ?? []);
      setUsers(usersRes.data?.map((u: any) => ({ id: u.id, username: u.username, employeeId: u.employee_id, roleId: u.role_id, password: '' })) ?? []);
      setRoles(rolesRes.data?.map((r: any) => ({ id: r.id, name: r.name, permissions: (r.permissions as any) ?? {} })) ?? []);
      
      if (settingsRes.data) {
        setFarmInfo((settingsRes.data as any).info as any);
      }
      
    } catch (error) {
      console.error("Error during full data fetch:", error);
      alert('An error occurred while fetching farm data. The application may not function correctly.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setLocationHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    // Set initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchData(session);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentUser(null); // Reset user on auth change
      if (session) {
        fetchData(session);
      } else {
        setLoading(false);
        setActiveView('dashboard'); // Reset to default view on logout
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const reloadData = () => {
      if(session) fetchData(session);
  };
  
  const handleSave = async (table: keyof Database['public']['Tables'], data: any) => {
      const { error } = await supabase.from(table).upsert(data);
      if (error) {
          alert(`Error saving data: ${error.message}`);
          console.error(error);
      } else {
          reloadData();
      }
  }
  
  const handleDelete = async (table: keyof Database['public']['Tables'], id: number) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
       if (error) {
          alert(`Error deleting data: ${error.message}`);
          console.error(error);
      } else {
          reloadData();
      }
  }
  
  // Specific Handlers
  const handleSaveCrop = (crop: CropInsert) => handleSave('crops', crop);
  const handleDeleteCrop = (id: number) => handleDelete('crops', id);
  const handleSaveDevice = (device: DeviceInsert) => handleSave('devices', device);
  const handleDeleteDevice = (id: number) => handleDelete('devices', id);
  const handleSaveLedgerEntry = (entry: LedgerEntryInsert) => handleSave('ledger_entries', entry);
  const handleDeleteLedgerEntry = (id: number) => handleDelete('ledger_entries', id);
  const handleSavePlot = (plot: PlotInsert) => handleSave('plots', plot);
  const handleDeletePlot = (id: number) => handleDelete('plots', id);
  const handleSaveActivityLog = (log: ActivityLogInsert) => handleSave('activity_logs', log);
  const handleSaveInventoryItem = (item: InventoryItemInsert) => handleSave('inventory_items', item);
  const handleDeleteInventoryItem = (id: number) => handleDelete('inventory_items', id);
  const handleSaveEmployee = (emp: EmployeeInsert) => handleSave('employees', emp);
  const handleDeleteEmployee = (id: number) => handleDelete('employees', id);
  const handleSaveLeaveRequest = (req: LeaveRequestInsert) => handleSave('leave_requests', req);
  const handleSaveTask = (task: TaskInsert) => handleSave('tasks', task);
  const handleSaveCustomer = (customer: CustomerInsert) => handleSave('customers', customer);
  const handleDeleteCustomer = (id: number) => handleDelete('customers', id);
  const handleSaveSalesOrder = (order: SalesOrderInsert) => handleSave('sales_orders', order);
  const handleDeleteSalesOrder = (id: number) => handleDelete('sales_orders', id);
  const handleSaveUser = (user: UserUpdate) => handleSave('users', user);
  const handleSaveRole = (role: RoleUpdate) => handleSave('roles', role);
  
  const handleSaveFarmInfo = async (info: FarmInfo) => {
      setFarmInfo(info);
      const { error } = await supabase.from('farm_settings').upsert([{ id: 1, info: info as unknown as Json }] as any, { onConflict: 'id' });
       if (error) {
          alert(`Error saving farm settings: ${error.message}`);
          console.error(error);
      }
  }


  const renderActiveView = () => {
    if (!currentUser?.permissions) return null; // Or a loading/error state
    const viewPerms = currentUser.permissions[activeView as keyof PermissionsMap];
    if (!viewPerms?.view) {
        // Find the first viewable module and switch to it
        const firstViewable = MODULES.find(mod => currentUser.permissions[mod as AppModule]?.view);
        if(firstViewable) {
            setActiveView(firstViewable);
        } else {
            return <div className="p-8">You do not have permission to view any modules.</div>;
        }
        return null; // The component will re-render with the new activeView
    }

    switch (activeView) {
      case 'dashboard': return <Dashboard crops={crops} devices={devices} environmentData={environmentData} ledgerEntries={ledgerEntries} alerts={alerts} />;
      case 'crops': return <Crops crops={crops} onSave={handleSaveCrop} onDelete={handleDeleteCrop} ledgerEntries={ledgerEntries} plots={plots} environmentData={environmentData} permissions={viewPerms} />;
      case 'environment': return <Environment environmentData={environmentData} devices={devices} />;
      case 'smartdevices': return <SmartFarmDevices devices={devices} onSave={handleSaveDevice} onDelete={handleDeleteDevice} permissions={viewPerms} />;
      case 'ledger': return <FarmLedger entries={ledgerEntries} onSave={handleSaveLedgerEntry} onDelete={handleDeleteLedgerEntry} crops={crops} permissions={viewPerms} />;
      case 'profitability': return <ProductProfitability crops={crops} ledgerEntries={ledgerEntries} />;
      case 'gap': return <GapManagement plots={plots} activityLogs={activityLogs} crops={crops} farmInfo={farmInfo} permissions={viewPerms} onSavePlot={handleSavePlot} onDeletePlot={handleDeletePlot} onSaveActivityLog={handleSaveActivityLog} />;
      case 'inventory': return <Inventory items={inventoryItems} onSave={handleSaveInventoryItem} onDelete={handleDeleteInventoryItem} permissions={viewPerms} />;
      case 'sales': return <SalesManagement customers={customers} salesOrders={salesOrders} crops={crops} permissions={viewPerms} onSaveCustomer={handleSaveCustomer} onDeleteCustomer={handleDeleteCustomer} onSaveSalesOrder={handleSaveSalesOrder} onDeleteSalesOrder={handleDeleteSalesOrder} farmInfo={farmInfo} />;
      case 'hr': return <EmployeeManagement employees={employees} payrolls={payrolls} timeLogs={timeLogs} leaveRequests={leaveRequests} tasks={tasks} permissions={viewPerms} onSaveEmployee={handleSaveEmployee} onDeleteEmployee={handleDeleteEmployee} onSaveLeaveRequest={handleSaveLeaveRequest} onSaveTask={handleSaveTask} farmInfo={farmInfo} />;
      case 'admin': return <AdminManagement users={users} roles={roles} employees={employees} onSaveUser={handleSaveUser} onSaveRole={handleSaveRole} />;
      case 'reports': return <Reports salesOrders={salesOrders} ledgerEntries={ledgerEntries} crops={crops} customers={customers} />;
      case 'assistant': return <Assistant />;
      case 'settings': return <Settings farmInfo={farmInfo} onSave={handleSaveFarmInfo} />;
      default: return <Dashboard crops={crops} devices={devices} environmentData={environmentData} ledgerEntries={ledgerEntries} alerts={alerts} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-farm-green"></div>
            <h2 className="text-xl font-semibold text-gray-700 mt-4">Loading Farm Data...</h2>
        </div>
      </div>
    );
  }

  if (!session) {
    const isLoginPage = locationHash === '#login';
    if(isLoginPage) {
        return <LoginPage onBackToLanding={() => window.location.hash = ''} />;
    }
    return <LandingPage onGoToLogin={() => window.location.hash = '#login'} />;
  }
  
  if (!currentUser) {
       return (
          <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-red-500"></div>
                <h2 className="text-xl font-semibold text-gray-700 mt-4">Authorizing User...</h2>
                <p className="text-gray-500">If this persists, please try logging out and in again.</p>
                 <button onClick={handleLogout} className="mt-4 bg-red-500 text-white py-2 px-4 rounded">Sign Out</button>
            </div>
          </div>
        );
  }
  
  return (
    <div className="flex h-screen bg-white text-farm-text">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        logoUrl={farmInfo.logoUrl}
        farmName={farmInfo.name}
        permissions={currentUser.permissions}
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-30 flex items-center justify-between p-4">
            <button onClick={() => setIsSidebarOpen(true)} className="text-gray-700 p-2 -ml-2">
                <MenuIcon />
            </button>
            <span className="text-lg font-bold text-farm-green-dark">{pageTitles[activeView] || 'Smile Farm'}</span>
            <div className="w-6"></div> {/* Spacer to balance title */}
        </header>
        <div className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
};

export default App;