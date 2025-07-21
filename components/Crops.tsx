import React, { useState } from 'react';
import { Crop, LedgerEntry, Plot, EnvironmentData, PermissionSet } from '../types';
import Modal from './Modal';
import ThermostatIcon from './icons/ThermostatIcon';
import HumidityIcon from './icons/HumidityIcon';
import UploadIcon from './icons/UploadIcon';
import LeafIcon from './icons/LeafIcon';
import { Database } from '../lib/database.types';

type CropInsert = Database['public']['Tables']['crops']['Insert'];

const statusColorMap = {
  'Growing': 'bg-blue-100 text-blue-800',
  'Harvest Ready': 'bg-green-100 text-green-800',
  'Planted': 'bg-yellow-100 text-yellow-800',
};

const getStatusDetails = (current: number, optimal?: [number, number]) => {
    if (!optimal || optimal.length !== 2) return { text: 'N/A', color: 'text-gray-500' };
    const [min, max] = optimal;
    const range = max - min;
    const buffer = range * 0.1; // 10% buffer

    if (current >= min && current <= max) return { text: 'เหมาะสม', color: 'text-green-600' };
    if (current >= min - buffer && current < min) return { text: 'ต่ำเล็กน้อย', color: 'text-yellow-600' };
    if (current > max && current <= max + buffer) return { text: 'สูงเล็กน้อย', color: 'text-yellow-600' };
    if (current < min - buffer) return { text: 'ต่ำเกินไป', color: 'text-red-600' };
    return { text: 'สูงเกินไป', color: 'text-red-600' };
};


interface CropCardProps {
    crop: Crop;
    onEdit: (crop: Crop) => void;
    onDelete: (cropId: number) => Promise<void>;
    currentEnv: EnvironmentData;
    permissions: PermissionSet;
}

const CropCard: React.FC<CropCardProps> = ({ crop, onEdit, onDelete, currentEnv, permissions }) => {
    const tempStatus = getStatusDetails(currentEnv.temperature, crop.optimalTemp);
    const humidityStatus = getStatusDetails(currentEnv.humidity, crop.optimalHumidity);
    
    const imageSrc = crop.imageUrl || `https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=600&h=400&auto=format&fit=crop`;

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
            <img className="h-48 w-full object-cover" src={imageSrc} alt={crop.name} />
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-farm-green-dark">{crop.name}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 ${statusColorMap[crop.status]}`}>
                        {crop.status}
                    </span>
                </div>
                <p className="text-gray-600">วันที่ปลูก: {crop.plantingDate}</p>
                <p className="text-gray-600 mb-4">คาดว่าจะเก็บเกี่ยว: {crop.expectedHarvest}</p>
                
                 {crop.status === 'Growing' && (
                    <div className="bg-farm-brown-light p-3 rounded-lg mb-4 space-y-2">
                        <h4 className="font-bold text-sm text-farm-green-dark">การประเมินสภาพแวดล้อมปัจจุบัน</h4>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                                <ThermostatIcon className="w-5 h-5" /> อุณหภูมิ:
                            </div>
                            <span className={`font-bold ${tempStatus.color}`}>{tempStatus.text}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2 text-gray-700">
                                <HumidityIcon className="w-5 h-5" /> ความชื้น:
                            </div>
                            <span className={`font-bold ${humidityStatus.color}`}>{humidityStatus.text}</span>
                        </div>
                    </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                    {permissions.edit && (
                        <button onClick={() => onEdit(crop)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>
                    )}
                    {(permissions.edit && permissions.delete) && <span className="text-gray-300">|</span>}
                    {permissions.delete && (
                        <button onClick={() => onDelete(crop.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">ลบ</button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface CropsProps {
    crops: Crop[];
    onSave: (crop: CropInsert) => Promise<void>;
    onDelete: (cropId: number) => Promise<void>;
    ledgerEntries: LedgerEntry[];
    plots: Plot[];
    environmentData: EnvironmentData[];
    permissions: PermissionSet;
}

const Crops: React.FC<CropsProps> = ({ crops, onSave, onDelete, ledgerEntries, plots, environmentData, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentCrop, setCurrentCrop] = useState<Crop | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        status: 'Planted' as Crop['status'],
        plantingDate: new Date().toISOString().split('T')[0],
        expectedHarvest: '',
        imageUrl: '',
        optimalTempMin: '',
        optimalTempMax: '',
        optimalHumidityMin: '',
        optimalHumidityMax: '',
    });
    
    const currentEnv = environmentData.length > 0 ? environmentData[environmentData.length - 1] : { temperature: 0, humidity: 0, light: 0, time: '' };

    const handleOpenModal = (crop: Crop | null) => {
        setCurrentCrop(crop);
        if (crop) {
            setFormData({
                name: crop.name,
                status: crop.status,
                plantingDate: crop.plantingDate,
                expectedHarvest: crop.expectedHarvest,
                imageUrl: crop.imageUrl,
                optimalTempMin: crop.optimalTemp?.[0]?.toString() || '',
                optimalTempMax: crop.optimalTemp?.[1]?.toString() || '',
                optimalHumidityMin: crop.optimalHumidity?.[0]?.toString() || '',
                optimalHumidityMax: crop.optimalHumidity?.[1]?.toString() || '',
            });
        } else {
             setFormData({
                name: '',
                status: 'Planted',
                plantingDate: new Date().toISOString().split('T')[0],
                expectedHarvest: '',
                imageUrl: '',
                optimalTempMin: '',
                optimalTempMax: '',
                optimalHumidityMin: '',
                optimalHumidityMax: '',
            });
        }
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCrop(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert("ไฟล์รูปภาพมีขนาดใหญ่เกินไป (สูงสุด 10MB)");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSaveCrop = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            alert("กรุณาใส่ชื่อพืชผล");
            return;
        }
        setIsSaving(true);

        const tempMin = parseFloat(formData.optimalTempMin);
        const tempMax = parseFloat(formData.optimalTempMax);
        const humidityMin = parseFloat(formData.optimalHumidityMin);
        const humidityMax = parseFloat(formData.optimalHumidityMax);

        const cropToSave: CropInsert = {
            id: currentCrop?.id,
            name: formData.name,
            status: formData.status,
            planting_date: formData.plantingDate,
            expected_harvest: formData.expectedHarvest || null,
            image_url: formData.imageUrl || null,
            optimal_temp: (!isNaN(tempMin) && !isNaN(tempMax)) ? [tempMin, tempMax] : null,
            optimal_humidity: (!isNaN(humidityMin) && !isNaN(humidityMax)) ? [humidityMin, humidityMax] : null,
        };

        await onSave(cropToSave);
        setIsSaving(false);
        handleCloseModal();
    };

    const handleDeleteCrop = async (cropId: number) => {
        const isUsedInLedger = ledgerEntries.some(entry => entry.cropId === cropId);
        const isUsedInPlots = plots.some(plot => plot.currentCropId === cropId);

        if (isUsedInLedger || isUsedInPlots) {
            alert("ไม่สามารถลบพืชผลนี้ได้ เนื่องจากมีการอ้างอิงในบัญชีฟาร์มหรือในแปลงเพาะปลูกแล้ว");
            return;
        }

        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพืชผลนี้?")) {
            await onDelete(cropId);
        }
    };

    return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-farm-green-dark flex items-center gap-3">
          <LeafIcon className="w-9 h-9" />
          จัดการพืชผล
        </h1>
        {permissions.create && (
            <button 
              onClick={() => handleOpenModal(null)}
              className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              เพิ่มพืชผลใหม่
            </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {crops.map((crop) => (
            <CropCard key={crop.id} crop={crop} onEdit={handleOpenModal} onDelete={handleDeleteCrop} currentEnv={currentEnv} permissions={permissions} />
        ))}
      </div>
      
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentCrop ? 'แก้ไขพืชผล' : 'เพิ่มพืชผลใหม่'}>
            <form onSubmit={handleSaveCrop} className="space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อพืชผล</label>
                    <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-gray-700">รูปภาพพืชผล</label>
                    <div className="mt-1 flex items-center gap-4">
                        <span className="h-24 w-24 rounded-lg overflow-hidden bg-gray-100">
                             {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                             ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                             )}
                        </span>
                        <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-farm-green">
                           <div className="flex items-center gap-2">
                            <UploadIcon className="w-5 h-5" />
                            <span>อัปโหลด</span>
                           </div>
                           <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif" />
                       </label>
                    </div>
                 </div>
                 
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">สถานะ</label>
                    <select id="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as Crop['status']})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                        <option value="Planted">Planted</option>
                        <option value="Growing">Growing</option>
                        <option value="Harvest Ready">Harvest Ready</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="plantingDate" className="block text-sm font-medium text-gray-700">วันที่ปลูก</label>
                    <input type="date" id="plantingDate" value={formData.plantingDate} onChange={e => setFormData({...formData, plantingDate: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                 <div>
                    <label htmlFor="expectedHarvest" className="block text-sm font-medium text-gray-700">คาดว่าจะเก็บเกี่ยว</label>
                    <input type="date" id="expectedHarvest" value={formData.expectedHarvest} onChange={e => setFormData({...formData, expectedHarvest: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                
                <fieldset className="border-t pt-4">
                  <legend className="text-base font-medium text-gray-900 mb-2">ค่าที่เหมาะสม (สำหรับการประเมิน)</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="optimalTempMin" className="block text-sm font-medium text-gray-700">อุณหภูมิต่ำสุด (°C)</label>
                      <input type="number" id="optimalTempMin" value={formData.optimalTempMin} onChange={e => setFormData({...formData, optimalTempMin: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                      <label htmlFor="optimalTempMax" className="block text-sm font-medium text-gray-700">อุณหภูมิสูงสุด (°C)</label>
                      <input type="number" id="optimalTempMax" value={formData.optimalTempMax} onChange={e => setFormData({...formData, optimalTempMax: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                      <label htmlFor="optimalHumidityMin" className="block text-sm font-medium text-gray-700">ความชื้นต่ำสุด (%)</label>
                      <input type="number" id="optimalHumidityMin" value={formData.optimalHumidityMin} onChange={e => setFormData({...formData, optimalHumidityMin: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                      <label htmlFor="optimalHumidityMax" className="block text-sm font-medium text-gray-700">ความชื้นสูงสุด (%)</label>
                      <input type="number" id="optimalHumidityMax" value={formData.optimalHumidityMax} onChange={e => setFormData({...formData, optimalHumidityMax: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                  </div>
                </fieldset>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} disabled={isSaving} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:opacity-50">ยกเลิก</button>
                    <button type="submit" disabled={isSaving} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </form>
        </Modal>
      )}
    </div>
    );
};

export default Crops;