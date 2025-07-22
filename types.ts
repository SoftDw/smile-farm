

export interface FarmInfo {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
}

export interface Crop {
  id: number;
  name: string;
  status: 'Growing' | 'Harvest Ready' | 'Planted';
  plantingDate: string;
  expectedHarvest: string;
  imageUrl: string;
  optimalTemp?: [number, number]; // [min, max]
  optimalHumidity?: [number, number]; // [min, max]
}

export interface EnvironmentData {
  time: string;
  temperature: number;
  humidity: number;
  light: number;
}

export interface Device {
  id: number;
  name: string;
  type: 'Sensor' | 'Pump' | 'Light';
  status: 'Active' | 'Inactive' | 'Error';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  cropId?: number;
}

export interface Plot {
  id: number;
  name: string;
  description: string;
  currentCropId?: number;
}

export interface ActivityLog {
  id: number;
  plotId: number;
  activityType: 'เพาะปลูก' | 'ให้ปุ๋ย' | 'กำจัดศัตรูพืช' | 'รดน้ำ' | 'เก็บเกี่ยว';
  date: string;
  description: string;
  materialsUsed?: string; 
  personnel: string;
}

export interface Alert {
  id: string;
  type: 'task' | 'warning';
  message: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
}

// --- HR Management Interfaces ---

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  dateOfBirth: string;
  nationalId: string;
  address: string;
  phone: string;
  email: string;
  startDate: string;
  position: string;
  salary: number; // Monthly salary in THB
  contractUrl?: string;
  trainingHistory?: string[];
}

export interface PayrollEntry {
  id: number;
  employeeId: number;
  period: string; // e.g., "August 2024"
  payDate: string;
  grossPay: number;
  deductions: number; // tax, social security, etc.
  netPay: number;
}

export interface TimeLog {
  id: number;
  employeeId: number;
  timestamp: string; // ISO 8601 format
  type: 'clock-in' | 'clock-out';
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: 'ลาป่วย' | 'ลากิจ' | 'ลาพักร้อน';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AssignedTask {
  id: number;
  employeeId: number;
  taskDescription: string;
  assignedDate: string;
  dueDate: string;
  status: 'To Do' | 'In Progress' | 'Done';
}

// --- Marketing & Sales Interfaces ---

export interface Customer {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
}

export interface OrderItem {
  itemId: string; // Unique ID for form list management
  cropId: number;
  quantity: number;
  unitPrice: number;
}

export interface SalesOrder {
  id: number;
  customerId: number;
  orderDate: string;
  status: 'Quote' | 'Confirmed' | 'Shipped' | 'Completed' | 'Cancelled';
  items: OrderItem[];
  totalAmount: number;
}

// --- Admin & Permissions Interfaces ---

export interface PermissionSet {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type AppModule = 'dashboard' | 'crops' | 'environment' | 'gap' | 'inventory' | 'hr' | 'ledger' | 'profitability' | 'assistant' | 'settings' | 'admin' | 'sales' | 'smartdevices' | 'reports';

export type PermissionsMap = { [key in AppModule]: PermissionSet };

export interface Role {
  id: number;
  name: string;
  permissions: { [key in AppModule]?: PermissionSet };
}

export interface User {
  id: number;
  username: string;
  password: string;
  employeeId: number; // Link to employee record
  roleId: number;
}

export interface CurrentUser extends User {
    permissions: PermissionsMap;
}

// --- Public Interfaces ---

export interface TraceabilityResult {
  activityLog: ActivityLog;
  plot: Plot;
  crop: Crop;
}
