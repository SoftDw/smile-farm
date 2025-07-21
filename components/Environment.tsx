

import React from 'react';
import { EnvironmentData, Device } from '../types';
import Card from './Card';
import LineChartComponent from './LineChartComponent';
import ThermostatIcon from './icons/ThermostatIcon';

const statusColorMap: { [key in Device['status']]: string } = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Error: 'bg-red-100 text-red-800',
};

interface EnvironmentProps {
    environmentData: EnvironmentData[];
    devices: Device[];
}

const Environment: React.FC<EnvironmentProps> = ({ environmentData, devices }) => {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-farm-green-dark flex items-center gap-3">
            <ThermostatIcon className="w-9 h-9" />
            ภาพรวมสภาพแวดล้อม
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="ข้อมูลสภาพแวดล้อม" icon={<ThermostatIcon />}>
            <LineChartComponent 
                data={environmentData}
                xAxisKey="time"
                lines={[
                    { key: 'temperature', name: 'อุณหภูมิ (°C)', color: '#ef4444' },
                    { key: 'humidity', name: 'ความชื้น (%)', color: '#3b82f6' },
                    { key: 'light', name: 'ความเข้มแสง (lux)', color: '#f59e0b' }
                ]}
            />
        </Card>

        <Card title="สถานะอุปกรณ์">
          <div className="space-y-4">
            {devices.map(device => (
              <div key={device.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="font-bold text-farm-text">{device.name}</p>
                  <p className="text-sm text-gray-500">{device.type}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColorMap[device.status]}`}>
                    {device.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Environment;
