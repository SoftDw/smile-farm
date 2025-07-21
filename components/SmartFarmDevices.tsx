
import React, { useState } from 'react';
import { Device, PermissionSet } from '../types';
import Card from './Card';
import Modal from './Modal';
import ChipIcon from './icons/ChipIcon';
import { Database } from '../lib/database.types';

type DeviceInsert = Database['public']['Tables']['devices']['Insert'];

const statusColorMap: { [key in Device['status']]: string } = {
  Active: 'bg-green-100 text-green-800',
  Inactive: 'bg-gray-100 text-gray-800',
  Error: 'bg-red-100 text-red-800',
};

const statusToggleColorMap: { [key in Device['status']]: string } = {
  Active: 'bg-farm-green',
  Inactive: 'bg-gray-200',
  Error: 'bg-red-400',
};

interface SmartFarmDevicesProps {
    devices: Device[];
    onSave: (device: DeviceInsert) => Promise<void>;
    onDelete: (deviceId: number) => Promise<void>;
    permissions: PermissionSet;
}

const SmartFarmDevices: React.FC<SmartFarmDevicesProps> = ({ devices, onSave, onDelete, permissions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Sensor' as Device['type']});

  const handleOpenModal = (device: Device | null = null) => {
    setEditingDevice(device);
    if(device){
        setFormData({ name: device.name, type: device.type });
    } else {
        setFormData({ name: '', type: 'Sensor' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const deviceToSave: DeviceInsert = {
        id: editingDevice?.id,
        name: formData.name,
        type: formData.type,
        status: editingDevice?.status || 'Inactive',
    };

    await onSave(deviceToSave);
    handleCloseModal();
  };
  
  const handleToggleStatus = async (device: Device) => {
      if(device.type === 'Sensor' || !permissions.edit) return;

      const newStatus = device.status === 'Active' ? 'Inactive' : 'Active';
      const deviceToSave: DeviceInsert = {
          ...device,
          status: newStatus
      };
      await onSave(deviceToSave);
  }

  const handleDeleteDevice = (deviceId: number) => {
      if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?")) {
          onDelete(deviceId);
      }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-farm-green-dark flex items-center gap-3">
            <ChipIcon className="w-9 h-9" />
            อุปกรณ์สมาร์ทฟาร์ม
        </h1>
        {permissions.create && (
            <button
                onClick={() => handleOpenModal()}
                className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                เพิ่มอุปกรณ์ใหม่
            </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-farm-text">{device.name}</h3>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColorMap[device.status]}`}>
                    {device.status}
                  </span>
              </div>
              <p className="text-gray-500 mb-4">{device.type}</p>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
                <div>
                  {(device.type === 'Pump' || device.type === 'Light') && (
                        <div className="flex items-center gap-2">
                          <button
                              onClick={() => handleToggleStatus(device)}
                              className={`${statusToggleColorMap[device.status]} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50`}
                              role="switch"
                              aria-checked={device.status === 'Active'}
                              disabled={!permissions.edit}
                          >
                              <span className={`${device.status === 'Active' ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                          </button>
                          <span className="text-sm text-gray-600">{device.status === 'Active' ? 'เปิด' : 'ปิด'}</span>
                        </div>
                   )}
                </div>
                {(permissions.edit || permissions.delete) && (
                    <div className="flex gap-2">
                        {permissions.edit && <button onClick={() => handleOpenModal(device)} className="text-sm font-medium text-blue-600 hover:text-blue-800">แก้ไข</button>}
                        {permissions.delete && <button onClick={() => handleDeleteDevice(device.id)} className="text-sm font-medium text-red-600 hover:text-red-800">ลบ</button>}
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>

       <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingDevice ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}>
          <form onSubmit={handleSave} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700">ชื่ออุปกรณ์</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" placeholder="เช่น ปั๊มน้ำแปลง A" required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">ประเภทอุปกรณ์</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as Device['type']})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white">
                      <option value="Sensor">Sensor</option>
                      <option value="Pump">Pump</option>
                      <option value="Light">Light</option>
                  </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                  <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึกอุปกรณ์</button>
              </div>
          </form>
       </Modal>
    </div>
  );
};

export default SmartFarmDevices;
