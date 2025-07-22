
import React, { useState, useMemo } from 'react';
import { Crop, Device, EnvironmentData, LedgerEntry, Alert } from '../types';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ThermostatIcon from './icons/ThermostatIcon';
import BellIcon from './icons/BellIcon';
import HumidityIcon from './icons/HumidityIcon';
import LeafIcon from './icons/LeafIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface DashboardProps {
    crops: Crop[];
    devices: Device[];
    environmentData: EnvironmentData[];
    ledgerEntries: LedgerEntry[];
    alerts: Alert[];
}

// A more refined status evaluation for gauges and indicators
const getStatusDetails = (current: number, optimal?: [number, number]) => {
    if (!optimal || optimal.length !== 2) return { text: 'N/A', color: 'text-gray-500', bg: 'bg-gray-400', level: 0.5 };
    const [min, max] = optimal;
    
    if (current >= min && current <= max) return { text: 'เหมาะสม', color: 'text-green-600', bg: 'bg-green-500', level: 1 };
    if (current < min) return { text: 'ต่ำเกินไป', color: 'text-red-600', bg: 'bg-red-500', level: 0 };
    return { text: 'สูงเกินไป', color: 'text-red-600', bg: 'bg-red-500', level: 0 };
};

const Gauge = ({ value, label, unit, min, max }: { value: number, label: string, unit: string, min: number, max: number }) => {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    // The circumference of a semi-circle with radius 40 is π * r
    const semiCircleCircumference = Math.PI * 40; 

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-lg h-full justify-center text-center">
            <div className="relative w-full max-w-[12rem] h-24 mx-auto">
                <svg viewBox="0 0 100 50" className="w-full h-full transform -rotate-180">
                  {/* Background track */}
                  <path
                    d="M 5, 45 a 40,40 0 1,1 90,0"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fillOpacity="0"
                    strokeLinecap="round"
                  />
                  {/* Meter */}
                  <path
                    d="M 5, 45 a 40,40 0 1,1 90,0"
                    stroke="#74b49b"
                    strokeWidth="8"
                    fillOpacity="0"
                    strokeLinecap="round"
                    strokeDasharray={semiCircleCircumference}
                    strokeDashoffset={semiCircleCircumference - (percentage / 100) * semiCircleCircumference}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="text-4xl font-bold text-farm-text">{value}</span>
                  <span className="text-lg text-gray-500 -mt-1">{unit}</span>
                  <p className="text-gray-600 font-semibold text-sm">{label}</p>
                </div>
            </div>
        </div>
    );
};

const KpiCard = ({ title, value, trend, trendValue, icon, colorClass }: { title:string, value:string, trend?:'up'|'down', trendValue?:string, icon:React.ReactNode, colorClass:string }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg flex-1">
        <div className="flex items-center justify-between">
            <p className="text-gray-500 font-semibold">{title}</p>
            <div className={`${colorClass} p-2 rounded-lg`}>
                {icon}
            </div>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-farm-text mt-2">{value}</p>
        {trend && (
            <div className="flex items-center mt-2 text-sm">
                {trend === 'up' ? <ArrowUpIcon className="w-4 h-4 text-green-500" /> : <ArrowDownIcon className="w-4 h-4 text-red-500" />}
                <span className={`ml-1 font-semibold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>{trendValue}</span>
                <span className="ml-1 text-gray-400">จากเดือนก่อน</span>
            </div>
        )}
    </div>
);

const PlantHealthStatus = ({ crop, tempStatus, humidityStatus }: {crop: Crop, tempStatus: ReturnType<typeof getStatusDetails>, humidityStatus: ReturnType<typeof getStatusDetails>}) => {
    const healthScore = (tempStatus.level + humidityStatus.level) / 2;
    const healthColor = healthScore > 0.75 ? 'bg-green-500' : healthScore > 0.25 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex items-center justify-between">
                <span className="font-bold text-farm-green-dark">{crop.name}</span>
                <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${tempStatus.bg}`} title={`อุณหภูมิ: ${tempStatus.text}`}></div>
                    <div className={`w-3 h-3 rounded-full ${humidityStatus.bg}`} title={`ความชื้น: ${humidityStatus.text}`}></div>
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className={`${healthColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${healthScore * 100}%` }}></div>
            </div>
        </div>
    );
};

const Dashboard = ({ crops, devices, environmentData, ledgerEntries, alerts }: DashboardProps) => {
    const { income, expense, net } = useMemo(() => {
        const income = ledgerEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
        const expense = ledgerEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
        return { income, expense, net: income - expense };
    }, [ledgerEntries]);

    const growingCrops = crops.filter(c => c.status === 'Growing');
    const currentEnv = environmentData.length > 0 ? environmentData[environmentData.length - 1] : { temperature: 25, humidity: 60 };

    const AlertIcon = ({type}: {type: Alert['type']}) => {
      if (type === 'warning') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;
      }
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
    }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl md:text-4xl font-bold text-farm-green-dark mb-8">แผงควบคุมหลัก</h1>
      
      <div className="flex flex-col xl:flex-row gap-6 mb-6">
          <KpiCard title="กำไรสุทธิ" value={`${net.toLocaleString()} ฿`} trend={net > 10000 ? "up" : "down"} trendValue="5.2%" icon={<CurrencyDollarIcon className="w-6 h-6 text-green-600"/>} colorClass="bg-green-100" />
          <KpiCard title="พืชที่กำลังเติบโต" value={growingCrops.length.toString()} icon={<LeafIcon className="w-6 h-6 text-blue-600"/>} colorClass="bg-blue-100" />
          <KpiCard title="การแจ้งเตือน" value={alerts.length.toString()} icon={<BellIcon className="w-6 h-6 text-yellow-600"/>} colorClass="bg-yellow-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment Section */}
        <div className="lg:col-span-2 flex flex-col md:flex-row gap-6">
            <Gauge value={currentEnv.temperature} label="อุณหภูมิ" unit="°C" min={10} max={40} />
            <Gauge value={currentEnv.humidity} label="ความชื้น" unit="%" min={20} max={100} />
        </div>

        {/* Alerts Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg">
             <h3 className="text-xl font-bold text-farm-green-dark mb-4">การแจ้งเตือนและงาน</h3>
             <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {alerts.length > 0 ? alerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                            <AlertIcon type={alert.type} />
                        </div>
                        <p className={`text-sm ${alert.type === 'warning' ? 'text-yellow-700' : 'text-gray-700'}`}>{alert.message}</p>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">ไม่มีการแจ้งเตือน</p>}
            </div>
        </div>
        
        {/* Plant Health Section */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-farm-green-dark mb-4">สถานะสุขภาพพืช</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {growingCrops.length > 0 ? growingCrops.map(crop => {
                    const tempStatus = getStatusDetails(currentEnv.temperature, crop.optimalTemp);
                    const humidityStatus = getStatusDetails(currentEnv.humidity, crop.optimalHumidity);
                    return <PlantHealthStatus key={crop.id} crop={crop} tempStatus={tempStatus} humidityStatus={humidityStatus} />;
                }) : <p className="text-center text-gray-500 py-4 md:col-span-3">ไม่มีพืชที่กำลังเติบโต</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
