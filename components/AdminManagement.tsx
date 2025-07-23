

import React, { useState } from 'react';
import { User, Role, Employee, AppModule, PermissionSet, CurrentUser, PayrollEntry, AssignedTask } from '../types';
import { MODULES } from '../constants';
import Card from './Card';
import KeyIcon from './icons/KeyIcon';
import Modal from './Modal';
import { Database, Json } from '../lib/database.types';
import { supabase } from '../lib/supabaseClient';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type UserUpdate = Database['public']['Tables']['users']['Update'];
type RoleUpdate = Database['public']['Tables']['roles']['Update'];

type ActiveTab = 'users' | 'roles';

interface AdminManagementProps {
    users: User[];
    roles: Role[];
    employees: Employee[];
    payrolls: PayrollEntry[];
    tasks: AssignedTask[];
    onSaveUser: (user: UserUpdate) => Promise<void>;
    onSaveRole: (role: RoleUpdate) => Promise<void>;
    onDeleteEmployee: (employeeId: number) => Promise<void>;
    currentUser: CurrentUser;
}

const AdminManagement: React.FC<AdminManagementProps> = (props) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('users');

    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors border-b-2 ${
                activeTab === tab 
                ? 'border-farm-green text-farm-green-dark' 
                : 'border-transparent text-gray-500 hover:text-farm-green hover:border-farm-green-light'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-6 flex items-center gap-3">
                <KeyIcon className="w-9 h-9" /> การจัดการผู้ดูแลระบบ
            </h1>

            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-2">
                    <TabButton tab="users" label="จัดการผู้ใช้งาน" />
                    <TabButton tab="roles" label="จัดการบทบาท" />
                </nav>
            </div>

            <div>
                {activeTab === 'users' && <UserManagementTab {...props} />}
                {activeTab === 'roles' && <RoleManagementTab {...props} />}
            </div>
        </div>
    );
};


// --- User Management Tab ---
const UserManagementTab: React.FC<AdminManagementProps> = ({ users, onSaveUser, roles, employees, onDeleteEmployee, currentUser, payrolls, tasks }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState({ roleId: '' });

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({ email: '', password: '', roleId: '' });
    const [isAdding, setIsAdding] = useState(false);


    const getEmployeeName = (employeeId: number) => {
        const emp = employees.find(e => e.id === employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
    };

    const getRoleName = (roleId: number) => {
        return roles.find(r => r.id === roleId)?.name || 'N/A';
    };

    const handleOpenEditModal = (user: User) => {
        setEditingUser(user);
        setEditFormData({ roleId: user.roleId.toString() });
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        const userToUpdate: UserUpdate = {
            id: editingUser.id,
            role_id: parseInt(editFormData.roleId, 10),
        };

        await onSaveUser(userToUpdate);
        handleCloseEditModal();
    };

    const handleOpenAddModal = () => {
        const defaultRole = roles.find(r => r.name === 'Worker');
        setAddFormData({
            email: '',
            password: '',
            roleId: defaultRole ? defaultRole.id.toString() : (roles.length > 0 ? roles[0].id.toString() : '')
        });
        setIsAddModalOpen(true);
    }

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addFormData.email || !addFormData.password) {
            alert('กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }
        setIsAdding(true);
        try {
            // The client's only responsibility is to sign up the user with Supabase Auth.
            // The database trigger 'handle_new_user' will automatically create the corresponding
            // entries in the 'employees' and 'users' tables with the correct default role.
            const { error: signUpError } = await supabase.auth.signUp({
                email: addFormData.email,
                password: addFormData.password,
            });

            if (signUpError) {
                throw signUpError;
            }
            
            alert(`ส่งคำเชิญไปยัง ${addFormData.email} สำเร็จแล้ว! ผู้ใช้จะสามารถล็อกอินได้หลังจากยืนยันอีเมล`);
            handleCloseAddModal();
        } catch (error: any) {
            alert(`เกิดข้อผิดพลาดในการสร้างผู้ใช้: ${error.message}`);
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <Card title="รายชื่อผู้ใช้งานระบบ">
             <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                    จัดการบทบาทผู้ใช้ที่มีอยู่ หรือเพิ่มผู้ใช้ใหม่เข้าระบบ
                </p>
                <button
                    onClick={handleOpenAddModal}
                    className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    เพิ่มผู้ใช้งานระบบ
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">Username (Email)</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">ชื่อพนักงาน</th>
                            <th className="px-4 py-3 font-semibold text-gray-600">บทบาท</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => {
                            const isSelf = currentUser.employeeId === user.employeeId;
                            const hasDependencies = payrolls.some(p => p.employeeId === user.employeeId) || tasks.some(t => t.employeeId === user.employeeId);
                            const isDisabled = isSelf || hasDependencies;

                            let tooltip = '';
                            if (isSelf) {
                                tooltip = 'ไม่สามารถลบผู้ใช้ของตัวเองได้';
                            } else if (hasDependencies) {
                                tooltip = 'ไม่สามารถลบได้เนื่องจากมีข้อมูลเงินเดือนหรืองานที่ผูกอยู่';
                            }

                            return (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono">{user.username}</td>
                                    <td className="px-4 py-3 font-medium">{getEmployeeName(user.employeeId)}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {getRoleName(user.roleId)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleOpenEditModal(user)} className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-4">แก้ไขบทบาท</button>
                                        <button
                                            onClick={() => onDeleteEmployee(user.employeeId)}
                                            disabled={isDisabled}
                                            title={tooltip}
                                            className="text-sm text-red-600 hover:text-red-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && editingUser && (
                 <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title={`แก้ไขผู้ใช้งาน: ${editingUser.username}`}>
                    <form onSubmit={handleSaveUser} className="space-y-4">
                        <div>
                            <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">บทบาท</label>
                            <select id="roleId" name="roleId" value={editFormData.roleId} onChange={e => setEditFormData({...editFormData, roleId: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white" required>
                                <option value="" disabled>-- เลือกบทบาท --</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseEditModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
                        </div>
                    </form>
                </Modal>
            )}

            <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal} title="เพิ่มผู้ใช้งานระบบใหม่">
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล (Username)</label>
                        <input type="email" id="email" value={addFormData.email} onChange={e => setAddFormData({...addFormData, email: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                        <input type="password" id="password" value={addFormData.password} onChange={e => setAddFormData({...addFormData, password: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required minLength={6} />
                        <p className="text-xs text-gray-500 mt-1">ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={handleCloseAddModal} disabled={isAdding} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50">ยกเลิก</button>
                        <button type="submit" disabled={isAdding} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                            {isAdding ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ใช้งาน'}
                        </button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};

// --- Role Management Tab ---
const RoleManagementTab: React.FC<AdminManagementProps> = ({ roles, onSaveRole }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [permissions, setPermissions] = useState<Role['permissions']>({});

    const handleOpenModal = (role: Role) => {
        setEditingRole(role);
        setPermissions(JSON.parse(JSON.stringify(role.permissions || {}))); // Deep copy
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setPermissions({});
    };

    const handlePermissionChange = (module: AppModule, key: keyof PermissionSet, value: boolean) => {
        setPermissions(prev => {
            const modulePermissions = prev[module] || { view: false, create: false, edit: false, delete: false };
            const newModulePermissions = { ...modulePermissions, [key]: value };
            
            // If view is unchecked, uncheck everything else
            if (key === 'view' && !value) {
                newModulePermissions.create = false;
                newModulePermissions.edit = false;
                newModulePermissions.delete = false;
            }
            
            // If C/E/D is checked, ensure view is checked
            if (key !== 'view' && value) {
                newModulePermissions.view = true;
            }

            return {
                ...prev,
                [module]: newModulePermissions
            }
        });
    };
    
    const handleSave = async () => {
        if (editingRole) {
            await onSaveRole({ id: editingRole.id, permissions: permissions as unknown as Json });
        }
        handleCloseModal();
    };


    return (
        <Card title="บทบาทและสิทธิ์การเข้าถึง">
             <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600">ชื่อบทบาท</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {roles.map(role => (
                            <tr key={role.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{role.name}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleOpenModal(role)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        แก้ไขสิทธิ์
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`แก้ไขสิทธิ์สำหรับ: ${editingRole?.name}`} className="max-w-4xl">
                 <div className="overflow-y-auto max-h-[70vh]">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-gray-200 sticky top-0 bg-white">
                           <tr>
                                <th className="p-3 font-semibold text-gray-600">โมดูล</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">ดู (View)</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">สร้าง (Create)</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">แก้ไข (Edit)</th>
                                <th className="p-3 font-semibold text-gray-600 text-center">ลบ (Delete)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MODULES.map(module => (
                                <tr key={module} className="border-b border-gray-100">
                                    <td className="p-3 font-medium capitalize">{module}</td>
                                    {(['view', 'create', 'edit', 'delete'] as const).map(key => (
                                        <td key={key} className="p-3 text-center">
                                            <input 
                                                type="checkbox"
                                                className="h-5 w-5 rounded text-farm-green focus:ring-farm-green"
                                                checked={permissions[module]?.[key] || false}
                                                onChange={e => handlePermissionChange(module, key, e.target.checked)}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
                 <div className="pt-6 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                    <button type="button" onClick={handleSave} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึกสิทธิ์</button>
                </div>
            </Modal>
        </Card>
    );
};


export default AdminManagement;
