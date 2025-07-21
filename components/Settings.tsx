import React, { useState, useEffect } from 'react';
import Card from './Card';
import UploadIcon from './icons/UploadIcon';
import { FarmInfo } from '../types';

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; setEnabled: (enabled: boolean) => void }> = ({ label, enabled, setEnabled }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-farm-text">{label}</span>
        <button
            onClick={() => setEnabled(!enabled)}
            className={`${enabled ? 'bg-farm-green' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-farm-green`}
            role="switch"
            aria-checked={enabled}
        >
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
        </button>
    </div>
);

interface SettingsProps {
    farmInfo: FarmInfo;
    onSave: (newInfo: FarmInfo) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ farmInfo, onSave }) => {
    const [formData, setFormData] = useState<FarmInfo>(farmInfo);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState({
        harvest: true,
        environment: true,
        summary: false,
    });
    const [theme, setTheme] = useState('light');
    const isApiKeySet = process.env.API_KEY && process.env.API_KEY.length > 0;
    
    useEffect(() => {
        setFormData(farmInfo);
    }, [farmInfo]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const newInfo = {
            ...formData,
            logoUrl: logoPreview || formData.logoUrl,
        };
        await onSave(newInfo);
        setLogoPreview(null);
        setIsSaving(false);
        alert('บันทึกข้อมูลฟาร์มเรียบร้อยแล้ว');
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-8">การตั้งค่า</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Farm Information */}
                <Card title="ข้อมูลฟาร์ม" className="lg:col-span-2">
                    <form onSubmit={handleSaveChanges} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Column 1: Text fields */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อฟาร์ม</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700">ที่อยู่</label>
                                <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                            </div>
                             <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                                <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">เลขประจำตัวผู้เสียภาษี</label>
                                <input type="text" id="taxId" name="taxId" value={formData.taxId} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                        
                        {/* Column 2: Logo */}
                        <div className="space-y-4">
                            <p className="block text-sm font-medium text-gray-700">โลโก้ฟาร์ม</p>
                            <div className="flex items-center gap-6">
                                <img src={logoPreview || formData.logoUrl} alt="Logo" className="w-32 h-32 object-contain rounded-lg bg-farm-brown-light p-2 border border-farm-brown"/>
                            </div>
                            <div>
                                <label htmlFor="logo-upload" className="w-full cursor-pointer bg-white border border-gray-300 rounded-lg p-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                    <UploadIcon className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm font-medium text-farm-text">{logoPreview ? 'เปลี่ยนรูปภาพ' : 'อัปโหลดโลโก้'}</span>
                                </label>
                                <input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml, image/gif" onChange={handleFileSelect} />
                                 {logoPreview && <p className="text-xs text-center text-gray-500 mt-2">แสดงตัวอย่างโลโก้ใหม่</p>}
                            </div>
                        </div>
                        
                        {/* Save Button */}
                        <div className="md:col-span-2 mt-4">
                             <button type="submit" disabled={isSaving} className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-gray-400">
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลฟาร์ม'}
                            </button>
                        </div>
                    </form>
                </Card>

                {/* Notification Settings */}
                <Card title="การตั้งค่าการแจ้งเตือน">
                    <div className="space-y-2 divide-y divide-gray-200">
                        <ToggleSwitch label="แจ้งเตือนเมื่อพืชพร้อมเก็บเกี่ยว" enabled={notifications.harvest} setEnabled={(val) => setNotifications(p => ({...p, harvest: val}))} />
                        <ToggleSwitch label="แจ้งเตือนค่าสภาพแวดล้อมผิดปกติ" enabled={notifications.environment} setEnabled={(val) => setNotifications(p => ({...p, environment: val}))} />
                        <ToggleSwitch label="รับสรุปผลรายวัน" enabled={notifications.summary} setEnabled={(val) => setNotifications(p => ({...p, summary: val}))} />
                    </div>
                </Card>
                
                {/* Theme Settings */}
                <Card title="ธีมและหน้าตา">
                     <fieldset className="space-y-2">
                        <legend className="font-medium text-farm-text mb-2">เลือกธีมของแอป</legend>
                        <div className="flex items-center">
                            <input type="radio" id="light" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} className="focus:ring-farm-green h-4 w-4 text-farm-green border-gray-300" />
                            <label htmlFor="light" className="ml-3 block text-sm font-medium text-gray-700">Light Mode (สว่าง)</label>
                        </div>
                        <div className="flex items-center">
                            <input type="radio" id="dark" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} className="focus:ring-farm-green h-4 w-4 text-farm-green border-gray-300" disabled />
                            <label htmlFor="dark" className="ml-3 block text-sm font-medium text-gray-500">Dark Mode (มืด) - เร็วๆ นี้</label>
                        </div>
                     </fieldset>
                </Card>

                 {/* API Key Settings */}
                <Card title="การตั้งค่า API" className="lg:col-span-2">
                    <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <span className="font-medium text-farm-text">สถานะ Gemini API Key</span>
                            {isApiKeySet ? (
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">ตั้งค่าแล้ว</span>
                            ) : (
                                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">ยังไม่ได้ตั้งค่า</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 bg-farm-brown-light p-3 rounded-md border border-farm-brown">
                           API Key ของคุณถูกจัดการผ่านตัวแปรสภาพแวดล้อม (environment variables) และไม่สามารถเปลี่ยนแปลงได้ที่นี่ เพื่อความปลอดภัย
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;