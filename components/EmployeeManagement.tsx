
import React, { useState, useEffect } from 'react';
import { Employee, PayrollEntry, TimeLog, LeaveRequest, AssignedTask, PermissionSet, FarmInfo } from '../types';
import Card from './Card';
import UsersIcon from './icons/UsersIcon';
import Modal from './Modal';
import { Database } from '../lib/database.types';
import Payslip from './Payslip';

type EmployeeInsert = Database['public']['Tables']['employees']['Insert'];
type LeaveRequestInsert = Database['public']['Tables']['leave_requests']['Insert'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

type ActiveTab = 'roster' | 'payroll' | 'time' | 'tasks';

const InputField = ({label, name, value, onChange, type="text", required=false}: {label:string, name:string, value:string, onChange: (e:any)=>void, type?:string, required?:boolean}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} id={name} name={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
    </div>
)

interface EmployeeManagementProps {
    employees: Employee[];
    payrolls: PayrollEntry[];
    timeLogs: TimeLog[];
    leaveRequests: LeaveRequest[];
    tasks: AssignedTask[];
    permissions: PermissionSet;
    onSaveEmployee: (employee: EmployeeInsert) => Promise<void>;
    onDeleteEmployee: (employeeId: number) => Promise<void>;
    onSaveLeaveRequest: (req: LeaveRequestInsert) => Promise<void>;
    onSaveTask: (task: TaskInsert) => Promise<void>;
    farmInfo: FarmInfo;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('roster');
    const [payrollToPrint, setPayrollToPrint] = useState<PayrollEntry | null>(null);

    useEffect(() => {
        if (payrollToPrint) {
            const timer = setTimeout(() => {
                window.print();
                setPayrollToPrint(null); // Reset after printing to hide the component
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [payrollToPrint]);

    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab 
                ? 'border-farm-green text-farm-green' 
                : 'border-transparent text-gray-500 hover:text-farm-green-dark hover:border-farm-green'
            }`}
        >
            {label}
        </button>
    );
    
    const getEmployeeName = (id: number) => {
        const emp = props.employees.find(e => e.id === id);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'ไม่พบชื่อ';
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-6 flex items-center gap-3">
                <UsersIcon className="w-9 h-9" /> การจัดการพนักงาน
            </h1>

            <div className="border-b border-gray-200 mb-6 no-print">
                <nav className="flex space-x-2">
                    <TabButton tab="roster" label="ทะเบียนประวัติ" />
                    <TabButton tab="payroll" label="บัญชีเงินเดือน" />
                    <TabButton tab="time" label="เวลาและการลา" />
                    <TabButton tab="tasks" label="มอบหมายงาน" />
                </nav>
            </div>

            <div className="no-print">
                {activeTab === 'roster' && <RosterTab employees={props.employees} onSaveEmployee={props.onSaveEmployee} onDeleteEmployee={props.onDeleteEmployee} permissions={props.permissions} />}
                {activeTab === 'payroll' && <PayrollTab payrolls={props.payrolls} getEmployeeName={getEmployeeName} setPayrollToPrint={setPayrollToPrint} />}
                {activeTab === 'time' && <TimeAndLeaveTab 
                    leaveRequests={props.leaveRequests} 
                    onSaveLeaveRequest={props.onSaveLeaveRequest} 
                    getEmployeeName={getEmployeeName}
                    employees={props.employees}
                    permissions={props.permissions}
                />}
                {activeTab === 'tasks' && <TaskAssignmentTab tasks={props.tasks} onSaveTask={props.onSaveTask} employees={props.employees} getEmployeeName={getEmployeeName} permissions={props.permissions} />}
            </div>
            
            <Payslip payroll={payrollToPrint} employees={props.employees} farmInfo={props.farmInfo} />
        </div>
    );
};

const initialFormData: Omit<Employee, 'id' | 'trainingHistory' | 'contractUrl'> = {
    firstName: '',
    lastName: '',
    nickname: '',
    dateOfBirth: '',
    nationalId: '',
    address: '',
    phone: '',
    email: '',
    startDate: new Date().toISOString().split('T')[0],
    position: '',
    salary: 0,
};

// --- Roster Tab ---
const RosterTab = ({employees, onSaveEmployee, onDeleteEmployee, permissions}: {
    employees: Employee[], 
    permissions: PermissionSet,
    onSaveEmployee: (employee: EmployeeInsert) => Promise<void>;
    onDeleteEmployee: (employeeId: number) => Promise<void>;
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState(initialFormData);

    const handleOpenModal = (employee: Employee | null) => {
        setEditingEmployee(employee);
        if (employee) {
            // When editing, create a new object from the employee prop.
            // Ensure all values are initialized to prevent issues with controlled components.
            setFormData({
                firstName: employee.firstName || '',
                lastName: employee.lastName || '',
                nickname: employee.nickname || '',
                dateOfBirth: employee.dateOfBirth || '',
                nationalId: employee.nationalId || '',
                address: employee.address || '',
                phone: employee.phone || '',
                email: employee.email || '',
                startDate: employee.startDate || new Date().toISOString().split('T')[0],
                position: employee.position || '',
                salary: employee.salary || 0,
            });
        } else {
            // When adding a new employee, use a copy of the initial state.
            setFormData({ ...initialFormData });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.position) {
            alert('กรุณากรอกข้อมูลสำคัญ: ชื่อ, นามสกุล, และตำแหน่ง');
            return;
        }

        const employeeToSave: EmployeeInsert = {
            id: editingEmployee?.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            nickname: formData.nickname || null,
            position: formData.position,
            date_of_birth: formData.dateOfBirth || null,
            national_id: formData.nationalId || null,
            phone: formData.phone || null,
            email: formData.email || null,
            start_date: formData.startDate,
            salary: formData.salary || null,
            address: formData.address || null,
        }

        await onSaveEmployee(employeeToSave);
        handleCloseModal();
    };
    
    return (
        <Card title="ทะเบียนประวัติพนักงาน">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">จัดการข้อมูลพนักงานทั้งหมดในฟาร์ม</p>
              {permissions.create && (
                <button 
                  onClick={() => handleOpenModal(null)}
                  className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                  เพิ่มพนักงานใหม่
                </button>
              )}
            </div>
            
            <div className="mt-4 overflow-x-auto">
                 <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">ชื่อ-สกุล</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">ตำแหน่ง</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">เบอร์โทรศัพท์</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">วันที่เริ่มงาน</th>
                            {(permissions.edit || permissions.delete) && <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {employees.map(emp => (
                        <tr key={emp.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{emp.firstName} {emp.lastName}</td>
                            <td className="px-4 py-3">{emp.position}</td>
                            <td className="px-4 py-3">{emp.phone}</td>
                            <td className="px-4 py-3">{emp.startDate}</td>
                            {(permissions.edit || permissions.delete) && (
                                <td className="px-4 py-3 text-right">
                                    {permissions.edit && <button onClick={() => handleOpenModal(emp)} className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-4">แก้ไข</button>}
                                    {permissions.delete && <button onClick={() => onDeleteEmployee(emp.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">ลบ</button>}
                                </td>
                            )}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            
            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingEmployee ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'} className="max-w-3xl">
                    <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="ชื่อจริง" name="firstName" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
                            <InputField label="นามสกุล" name="lastName" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
                            <InputField label="ชื่อเล่น" name="nickname" value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
                            <InputField label="ตำแหน่งงาน" name="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required />
                            <InputField label="วันเกิด" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
                            <InputField label="เลขบัตรประชาชน" name="nationalId" value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                            <InputField label="เบอร์โทรศัพท์" name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            <InputField label="อีเมล" name="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            <InputField label="วันที่เริ่มงาน" name="startDate" type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                            <InputField label="อัตราค่าจ้าง (ต่อเดือน)" name="salary" type="number" value={String(formData.salary)} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div>
                             <label htmlFor="address" className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                             <textarea name="address" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
                        </div>
                    </form>
                </Modal>
            )}
        </Card>
    );
};


// --- Payroll Tab ---
const PayrollTab = ({ payrolls, getEmployeeName, setPayrollToPrint }: { payrolls: PayrollEntry[], getEmployeeName: (id: number) => string, setPayrollToPrint: (p: PayrollEntry) => void }) => {
    return (
        <Card title="ประวัติการจ่ายเงินเดือน">
            <p className="text-gray-600 mb-4">ดูประวัติและจัดการบัญชีเงินเดือนของพนักงาน</p>
             <div className="overflow-x-auto">
                 <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">พนักงาน</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">รอบการจ่าย</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">วันที่จ่าย</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">เงินเดือนสุทธิ</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-center">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {payrolls.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{getEmployeeName(p.employeeId)}</td>
                            <td className="px-4 py-3">{p.period}</td>
                            <td className="px-4 py-3">{p.payDate}</td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">{p.netPay.toLocaleString()} ฿</td>
                            <td className="px-4 py-3 text-center">
                                <button
                                    onClick={() => setPayrollToPrint(p)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"
                                >
                                    พิมพ์สลิป
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- Time & Leave Tab ---
const initialLeaveForm = {
    employeeId: '',
    leaveType: 'ลาป่วย' as LeaveRequest['leaveType'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
};

const TimeAndLeaveTab = ({ leaveRequests, onSaveLeaveRequest, getEmployeeName, employees, permissions }: { 
    leaveRequests: LeaveRequest[], 
    getEmployeeName: (id: number) => string,
    employees: Employee[],
    permissions: PermissionSet,
    onSaveLeaveRequest: (req: LeaveRequestInsert) => Promise<void>;
}) => {
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveFormData, setLeaveFormData] = useState(initialLeaveForm);

    const handleLeaveStatusChange = (req: LeaveRequest, status: LeaveRequest['status']) => {
        const requestToSave: LeaveRequestInsert = {
            id: req.id,
            employee_id: req.employeeId,
            leave_type: req.leaveType,
            start_date: req.startDate,
            end_date: req.endDate,
            reason: req.reason,
            status: status,
        };
        onSaveLeaveRequest(requestToSave);
    };

    const handleOpenLeaveModal = () => {
        setLeaveFormData({
            ...initialLeaveForm,
            employeeId: employees.length > 0 ? String(employees[0].id) : '',
        });
        setIsLeaveModalOpen(true);
    };

    const handleCloseLeaveModal = () => setIsLeaveModalOpen(false);
    
    const handleSaveLeaveRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leaveFormData.employeeId || !leaveFormData.reason || !leaveFormData.startDate || !leaveFormData.endDate) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const newRequest: LeaveRequestInsert = {
            employee_id: parseInt(leaveFormData.employeeId, 10),
            leave_type: leaveFormData.leaveType,
            start_date: leaveFormData.startDate,
            end_date: leaveFormData.endDate,
            reason: leaveFormData.reason,
            status: 'Pending',
        };
        
        await onSaveLeaveRequest(newRequest);
        handleCloseLeaveModal();
    };

    return (
        <>
            <Card title="คำร้องขอลา">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">จัดการคำร้องขอลาของพนักงาน</p>
                    <button onClick={handleOpenLeaveModal} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        ยื่นใบลา
                    </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                     <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">พนักงาน</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">ประเภท</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">ตั้งแต่</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">ถึงวันที่</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">เหตุผล</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-center">การดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {leaveRequests.map(req => (
                            <tr key={req.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{getEmployeeName(req.employeeId)}</td>
                                <td className="px-4 py-3">{req.leaveType}</td>
                                <td className="px-4 py-3">{req.startDate}</td>
                                <td className="px-4 py-3">{req.endDate}</td>
                                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{req.reason}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                        req.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>{req.status}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {req.status === 'Pending' && permissions.edit && (
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleLeaveStatusChange(req, 'Approved')} className="text-xs bg-green-500 text-white px-2 py-1 rounded">อนุมัติ</button>
                                            <button onClick={() => handleLeaveStatusChange(req, 'Rejected')} className="text-xs bg-red-500 text-white px-2 py-1 rounded">ปฏิเสธ</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isLeaveModalOpen} onClose={handleCloseLeaveModal} title="ยื่นคำร้องขอลา">
                <form onSubmit={handleSaveLeaveRequest} className="space-y-4">
                    <div>
                        <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">พนักงาน</label>
                        <select id="employeeId" value={leaveFormData.employeeId} onChange={e => setLeaveFormData({...leaveFormData, employeeId: e.target.value})} className="mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md" required>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">ประเภทการลา</label>
                        <select id="leaveType" value={leaveFormData.leaveType} onChange={e => setLeaveFormData({...leaveFormData, leaveType: e.target.value as LeaveRequest['leaveType']})} className="mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md" required>
                            <option value="ลาป่วย">ลาป่วย</option>
                            <option value="ลากิจ">ลากิจ</option>
                            <option value="ลาพักร้อน">ลาพักร้อน</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">วันที่เริ่มลา</label>
                            <input type="date" id="startDate" value={leaveFormData.startDate} onChange={e => setLeaveFormData({...leaveFormData, startDate: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">ถึงวันที่</label>
                            <input type="date" id="endDate" value={leaveFormData.endDate} onChange={e => setLeaveFormData({...leaveFormData, endDate: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">เหตุผลการลา</label>
                        <textarea id="reason" rows={3} value={leaveFormData.reason} onChange={e => setLeaveFormData({...leaveFormData, reason: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleCloseLeaveModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                        <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">ส่งคำร้อง</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};


// --- Task Assignment Tab ---
const initialTaskForm = {
    employeeId: '',
    taskDescription: '',
    dueDate: new Date().toISOString().split('T')[0],
};

const TaskAssignmentTab = ({ tasks, onSaveTask, employees, getEmployeeName, permissions }: { 
    tasks: AssignedTask[], 
    employees: Employee[], 
    getEmployeeName: (id: number) => string,
    permissions: PermissionSet,
    onSaveTask: (task: TaskInsert) => Promise<void>;
}) => {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskFormData, setTaskFormData] = useState(initialTaskForm);

    const statusColorMap = {
        'To Do': 'bg-blue-100 text-blue-800',
        'In Progress': 'bg-yellow-100 text-yellow-800',
        'Done': 'bg-green-100 text-green-800'
    };
    
    const handleOpenTaskModal = () => {
        setTaskFormData({
            ...initialTaskForm,
            employeeId: employees.length > 0 ? String(employees[0].id) : '',
        });
        setIsTaskModalOpen(true);
    };

    const handleCloseTaskModal = () => setIsTaskModalOpen(false);

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.employeeId || !taskFormData.taskDescription || !taskFormData.dueDate) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const newTask: TaskInsert = {
            employee_id: parseInt(taskFormData.employeeId, 10),
            task_description: taskFormData.taskDescription,
            assigned_date: new Date().toISOString().split('T')[0],
            due_date: taskFormData.dueDate,
            status: 'To Do',
        };
        
        await onSaveTask(newTask);
        handleCloseTaskModal();
    };
    
    const handleStatusChange = (task: AssignedTask, status: AssignedTask['status']) => {
        const taskToSave: TaskInsert = {
            id: task.id,
            employee_id: task.employeeId,
            task_description: task.taskDescription,
            assigned_date: task.assignedDate,
            due_date: task.dueDate,
            status: status,
        };
        onSaveTask(taskToSave);
    };

    return (
        <>
            <Card title="รายการงานที่มอบหมาย">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">ติดตามความคืบหน้าของงานที่ได้รับมอบหมาย</p>
                    {permissions.create && (
                        <button onClick={handleOpenTaskModal} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                            มอบหมายงานใหม่
                        </button>
                    )}
                 </div>
                 <div className="mt-4 overflow-x-auto">
                     <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">รายละเอียดงาน</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">ผู้รับผิดชอบ</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">กำหนดส่ง</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{task.taskDescription}</td>
                                <td className="px-4 py-3">{getEmployeeName(task.employeeId)}</td>
                                <td className="px-4 py-3">{task.dueDate}</td>
                                <td className="px-4 py-3">
                                     <select 
                                        value={task.status} 
                                        onChange={(e) => handleStatusChange(task, e.target.value as AssignedTask['status'])}
                                        className={`px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-0 ${statusColorMap[task.status]} bg-opacity-70`}
                                        disabled={!permissions.edit}
                                     >
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isTaskModalOpen} onClose={handleCloseTaskModal} title="มอบหมายงานใหม่">
                <form onSubmit={handleSaveTask} className="space-y-4">
                    <div>
                        <label htmlFor="taskEmployeeId" className="block text-sm font-medium text-gray-700">พนักงาน</label>
                        <select id="taskEmployeeId" value={taskFormData.employeeId} onChange={e => setTaskFormData({...taskFormData, employeeId: e.target.value})} className="mt-1 block w-full p-2 border bg-white border-gray-300 rounded-md" required>
                             <option value="" disabled>-- เลือกพนักงาน --</option>
                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">รายละเอียดงาน</label>
                        <textarea id="taskDescription" rows={4} value={taskFormData.taskDescription} onChange={e => setTaskFormData({...taskFormData, taskDescription: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">กำหนดส่ง</label>
                        <input type="date" id="dueDate" value={taskFormData.dueDate} onChange={e => setTaskFormData({...taskFormData, dueDate: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required/>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleCloseTaskModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                        <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึกงาน</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default EmployeeManagement;
