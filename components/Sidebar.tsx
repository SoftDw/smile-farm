

import React from 'react';
import DashboardIcon from './icons/DashboardIcon';
import LeafIcon from './icons/LeafIcon';
import SparklesIcon from './icons/SparklesIcon';
import ThermostatIcon from './icons/ThermostatIcon';
import SettingsIcon from './icons/SettingsIcon';
import CalculatorIcon from './icons/CalculatorIcon';
import ChartPieIcon from './icons/ChartPieIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import UsersIcon from './icons/UsersIcon';
import KeyIcon from './icons/KeyIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LogoutIcon from './icons/LogoutIcon';
import ChipIcon from './icons/ChipIcon';
import { PermissionsMap } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  logoUrl: string;
  farmName: string;
  permissions: PermissionsMap;
  onLogout: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-2 rounded-lg cursor-pointer transition-colors ${
      isActive
        ? 'bg-farm-green-light text-farm-green-dark'
        : 'text-gray-600 hover:bg-farm-green-light hover:text-farm-green-dark'
    }`}
    role="button"
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="ml-4 font-semibold">{label}</span>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, logoUrl, farmName, permissions, onLogout }) => {
  const allNavItems = [
    { id: 'dashboard', label: 'แผงควบคุม', icon: <DashboardIcon /> },
    { id: 'crops', label: 'พืชผล', icon: <LeafIcon /> },
    { id: 'environment', label: 'สภาพแวดล้อม', icon: <ThermostatIcon /> },
    { id: 'smartdevices', label: 'อุปกรณ์สมาร์ทฟาร์ม', icon: <ChipIcon /> },
    { id: 'gap', label: 'จัดการ GAP', icon: <ShieldCheckIcon /> },
    { id: 'inventory', label: 'คลังปัจจัยการผลิต', icon: <ArchiveBoxIcon /> },
    { id: 'sales', label: 'การตลาดและการขาย', icon: <BriefcaseIcon /> },
    { id: 'hr', label: 'จัดการพนักงาน', icon: <UsersIcon /> },
    { id: 'ledger', label: 'บัญชีฟาร์ม', icon: <CalculatorIcon /> },
    { id: 'profitability', label: 'กำไรต่อสินค้า', icon: <ChartPieIcon /> },
    { id: 'assistant', label: 'ผู้ช่วย AI', icon: <SparklesIcon /> },
    { id: 'settings', label: 'การตั้งค่า', icon: <SettingsIcon /> },
    { id: 'admin', label: 'ผู้ดูแลระบบ', icon: <KeyIcon /> },
  ];

  const visibleNavItems = allNavItems.filter(item => permissions[item.id as keyof PermissionsMap]?.view);

  return (
    <aside className="w-64 bg-white h-full p-4 flex flex-col shadow-xl">
      <div className="flex items-center mb-10 p-2">
        <img src={logoUrl} alt="Smile Farm Logo" className="w-10 h-10 object-contain" />
        <h1 className="text-2xl font-bold text-farm-green-dark ml-2">{farmName}</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              onClick={() => setActiveView(item.id)}
            />
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <li
            onClick={onLogout}
            className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors text-gray-600 hover:bg-red-100 hover:text-red-700`}
            role="button"
          >
            <LogoutIcon />
            <span className="ml-4 font-semibold">ออกจากระบบ</span>
          </li>
        <div className="p-2 text-center text-gray-500 text-xs">
          <p>&copy; 2024 {farmName}</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
