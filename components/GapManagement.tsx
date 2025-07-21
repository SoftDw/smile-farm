import React, { useState, useMemo } from 'react';
import Card from './Card';
import { Plot, ActivityLog, Crop, FarmInfo, PermissionSet } from '../types';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import Modal from './Modal';
import ProductLabel from './ProductLabel';
import { Database } from '../lib/database.types';

type PlotInsert = Database['public']['Tables']['plots']['Insert'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

interface GapManagementProps {
    plots: Plot[];
    activityLogs: ActivityLog[];
    crops: Crop[];
    farmInfo: FarmInfo;
    permissions: PermissionSet;
    onSavePlot: (plot: PlotInsert) => Promise<void>;
    onDeletePlot: (plotId: number) => Promise<void>;
    onSaveActivityLog: (log: ActivityLogInsert) => Promise<void>;
}

export default function GapManagement({ plots, activityLogs, crops, farmInfo, permissions, onSavePlot, onDeletePlot, onSaveActivityLog }: GapManagementProps) {
    const [filteredPlotId, setFilteredPlotId] = useState<string>('all');
    
    // Modal and Form State
    const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
    const [currentPlot, setCurrentPlot] = useState<Plot | null>(null); // null for new, Plot object for edit
    const [plotFormData, setPlotFormData] = useState({ name: '', description: '', currentCropId: '' });
    
    // Label state
    const [labelData, setLabelData] = useState<{ activityLog: ActivityLog; plot: Plot; crop: Crop; } | null>(null);


    const [newActivity, setNewActivity] = useState({
        plotId: '',
        activityType: 'เพาะปลูก' as ActivityLog['activityType'],
        date: new Date().toISOString().split('T')[0],
        description: '',
        materialsUsed: '',
        personnel: ''
    });

    const handleAddActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newActivity.plotId || !newActivity.description || !newActivity.personnel) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน: แปลง, รายละเอียด, และผู้ดำเนินการ');
            return;
        }
        const activityToAdd: ActivityLogInsert = {
            plot_id: parseInt(newActivity.plotId, 10),
            activity_type: newActivity.activityType,
            date: newActivity.date,
            description: newActivity.description,
            materials_used: newActivity.materialsUsed || null,
            personnel: newActivity.personnel,
        };
        
        await onSaveActivityLog(activityToAdd);
        setNewActivity({ plotId: '', activityType: 'เพาะปลูก', date: new Date().toISOString().split('T')[0], description: '', materialsUsed: '', personnel: '' });
    };

    const filteredLogs = useMemo(() => {
        if (filteredPlotId === 'all') return activityLogs;
        return activityLogs.filter(log => log.plotId === parseInt(filteredPlotId, 10));
    }, [activityLogs, filteredPlotId]);
    
    const getPlotName = (plotId: number) => plots.find(p => p.id === plotId)?.name || 'N/A';
    const getCropName = (cropId?: number) => cropId ? crops.find(c => c.id === cropId)?.name : 'ว่าง';

    // --- Plot Management Handlers ---
    const handleOpenPlotModal = (plot: Plot | null) => {
        setCurrentPlot(plot);
        if (plot) {
            setPlotFormData({
                name: plot.name,
                description: plot.description,
                currentCropId: plot.currentCropId?.toString() || ''
            });
        } else {
            setPlotFormData({ name: '', description: '', currentCropId: '' });
        }
        setIsPlotModalOpen(true);
    };

    const handleClosePlotModal = () => {
        setIsPlotModalOpen(false);
        setCurrentPlot(null);
    };

    const handleSavePlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plotFormData.name) {
            alert('กรุณาใส่ชื่อแปลง');
            return;
        }

        const plotToSave: PlotInsert = {
            id: currentPlot?.id,
            name: plotFormData.name,
            description: plotFormData.description || null,
            current_crop_id: plotFormData.currentCropId ? parseInt(plotFormData.currentCropId) : null
        };
        
        await onSavePlot(plotToSave);
        handleClosePlotModal();
    };

    const handleDeletePlot = (plotId: number) => {
        // The check for existing logs is removed because the database handles this with ON DELETE CASCADE.
        // Instead, we provide a more informative confirmation dialog.
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแปลงนี้? การดำเนินการนี้จะลบประวัติกิจกรรมทั้งหมดที่เกี่ยวข้องกับแปลงนี้ด้วย')) {
            onDeletePlot(plotId);
        }
    };
    // --- End Plot Management Handlers ---

    // --- Label Generation Handler ---
    const handleCreateLabel = (log: ActivityLog) => {
        const plot = plots.find(p => p.id === log.plotId);
        if (!plot) return;
        const crop = crops.find(c => c.id === plot.currentCropId);
        if (!crop) {
            alert('ไม่พบข้อมูลพืชผลสำหรับแปลงนี้ ไม่สามารถสร้างฉลากได้');
            return;
        }
        setLabelData({ activityLog: log, plot, crop });
    };
    // --- End Label Generation Handler ---

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-8 flex items-center gap-3">
                <ShieldCheckIcon className="w-9 h-9" /> การจัดการมาตรฐาน GAP
            </h1>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-farm-text">แปลงเพาะปลูก</h2>
                {permissions.create && (
                    <button
                        onClick={() => handleOpenPlotModal(null)}
                        className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        เพิ่มแปลงใหม่
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {plots.map(plot => (
                    <Card key={plot.id} title={plot.name} className="bg-white flex flex-col">
                        <div className="flex-grow">
                            <p className="text-gray-600">{plot.description}</p>
                            <p className="mt-2 font-semibold text-farm-text">
                                พืชที่ปลูกอยู่: <span className="font-bold text-farm-green">{getCropName(plot.currentCropId)}</span>
                            </p>
                        </div>
                         {(permissions.edit || permissions.delete) && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                 {permissions.edit && <button onClick={() => handleOpenPlotModal(plot)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">แก้ไข</button>}
                                 {(permissions.edit && permissions.delete) && <span className="text-gray-300">|</span>}
                                 {permissions.delete && <button onClick={() => handleDeletePlot(plot.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">ลบ</button>}
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {permissions.create && (
                    <div className="lg:col-span-1">
                        <Card title="บันทึกกิจกรรมใหม่">
                            <form onSubmit={handleAddActivity} className="space-y-4">
                                 <div>
                                    <label htmlFor="plotId" className="block text-sm font-medium text-gray-700">เลือกแปลง</label>
                                    <select id="plotId" value={newActivity.plotId} onChange={e => setNewActivity({...newActivity, plotId: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                        <option value="" disabled>-- กรุณาเลือก --</option>
                                        {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="activityType" className="block text-sm font-medium text-gray-700">ประเภทกิจกรรม</label>
                                    <select id="activityType" value={newActivity.activityType} onChange={e => setNewActivity({...newActivity, activityType: e.target.value as ActivityLog['activityType']})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                        <option>เพาะปลูก</option>
                                        <option>ให้ปุ๋ย</option>
                                        <option>กำจัดศัตรูพืช</option>
                                        <option>รดน้ำ</option>
                                        <option>เก็บเกี่ยว</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">วันที่</label>
                                    <input type="date" id="date" value={newActivity.date} onChange={e => setNewActivity({...newActivity, date: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                                    <textarea id="description" value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} rows={2} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                                </div>
                                <div>
                                    <label htmlFor="materialsUsed" className="block text-sm font-medium text-gray-700">วัสดุที่ใช้ (ถ้ามี)</label>
                                    <input type="text" id="materialsUsed" value={newActivity.materialsUsed} onChange={e => setNewActivity({...newActivity, materialsUsed: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="เช่น ปุ๋ย, ยา, เมล็ดพันธุ์" />
                                </div>
                                <div>
                                    <label htmlFor="personnel" className="block text-sm font-medium text-gray-700">ผู้ดำเนินการ</label>
                                    <input type="text" id="personnel" value={newActivity.personnel} onChange={e => setNewActivity({...newActivity, personnel: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="ชื่อผู้รับผิดชอบ" />
                                </div>
                                <button type="submit" className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึกกิจกรรม</button>
                            </form>
                        </Card>
                    </div>
                )}
                <div className={permissions.create ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card title="ประวัติกิจกรรม (ตรวจสอบย้อนกลับ)">
                         <div className="mb-4">
                            <label htmlFor="filterPlot" className="text-sm font-medium text-gray-700 mr-2">กรองตามแปลง:</label>
                            <select id="filterPlot" value={filteredPlotId} onChange={e => setFilteredPlotId(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                <option value="all">ทุกแปลง</option>
                                {plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-600">วันที่</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">แปลง</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">กิจกรรม</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">รายละเอียด</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">ผู้ดำเนินการ</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{log.date}</td>
                                            <td className="px-4 py-3 font-medium">{getPlotName(log.plotId)}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {log.activityType}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.description}
                                                {log.materialsUsed && <div className="text-gray-500 text-xs">วัสดุ: {log.materialsUsed}</div>}
                                            </td>
                                            <td className="px-4 py-3">{log.personnel}</td>
                                            <td className="px-4 py-3 text-right">
                                                {log.activityType === 'เก็บเกี่ยว' && (
                                                    <button 
                                                        onClick={() => handleCreateLabel(log)}
                                                        className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-md transition-colors"
                                                    >
                                                        สร้างฉลาก
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
            
            {isPlotModalOpen && (
                <Modal isOpen={isPlotModalOpen} onClose={handleClosePlotModal} title={currentPlot ? 'แก้ไขแปลง' : 'เพิ่มแปลงใหม่'}>
                    <form onSubmit={handleSavePlot} className="space-y-4">
                        <div>
                            <label htmlFor="plotName" className="block text-sm font-medium text-gray-700">ชื่อแปลง</label>
                            <input
                                type="text"
                                id="plotName"
                                value={plotFormData.name}
                                onChange={e => setPlotFormData({...plotFormData, name: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-farm-green focus:border-farm-green"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="plotDescription" className="block text-sm font-medium text-gray-700">รายละเอียด</label>
                            <textarea
                                id="plotDescription"
                                rows={3}
                                value={plotFormData.description}
                                onChange={e => setPlotFormData({...plotFormData, description: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-farm-green focus:border-farm-green"
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="plotCrop" className="block text-sm font-medium text-gray-700">พืชที่ปลูกปัจจุบัน</label>
                            <select
                                id="plotCrop"
                                value={plotFormData.currentCropId}
                                onChange={e => setPlotFormData({...plotFormData, currentCropId: e.target.value})}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-farm-green focus:border-farm-green"
                            >
                                <option value="">-- ว่าง --</option>
                                {crops.map(crop => (
                                    <option key={crop.id} value={crop.id}>{crop.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleClosePlotModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
                                ยกเลิก
                            </button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">
                                บันทึก
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            
            <ProductLabel 
                isOpen={!!labelData}
                onClose={() => setLabelData(null)}
                data={labelData}
                farmInfo={farmInfo}
            />

        </div>
    );
}