import React, { useState } from 'react';
import { InventoryItem, PermissionSet } from '../types';
import Card from './Card';
import Modal from './Modal';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import { Database } from '../lib/database.types';

type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];

interface InventoryProps {
    items: InventoryItem[];
    onSave: (item: InventoryItemInsert) => Promise<void>;
    onDelete: (itemId: number) => Promise<void>;
    permissions: PermissionSet;
}

const Inventory: React.FC<InventoryProps> = ({ items, onSave, onDelete, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        quantity: '',
        unit: '',
        lowStockThreshold: '',
    });

    const handleOpenModal = (item: InventoryItem | null) => {
        setCurrentItem(item);
        if (item) {
            setFormData({
                name: item.name,
                category: item.category,
                quantity: item.quantity.toString(),
                unit: item.unit,
                lowStockThreshold: item.lowStockThreshold.toString(),
            });
        } else {
            setFormData({
                name: '',
                category: '',
                quantity: '',
                unit: '',
                lowStockThreshold: '10', // Default value
            });
        }
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.quantity || !formData.unit) {
            alert("กรุณากรอกข้อมูลให้ครบ: ชื่อ, จำนวน, และหน่วย");
            return;
        }

        const itemToSave: InventoryItemInsert = {
            id: currentItem?.id,
            name: formData.name,
            category: formData.category || null,
            quantity: parseFloat(formData.quantity),
            unit: formData.unit,
            low_stock_threshold: parseFloat(formData.lowStockThreshold) || 0,
        };
        
        await onSave(itemToSave);
        handleCloseModal();
    };

    const handleDeleteItem = (itemId: number) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?")) {
            onDelete(itemId);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-8 flex items-center gap-3">
                <ArchiveBoxIcon className="w-9 h-9" /> คลังปัจจัยการผลิต
            </h1>

            <Card title="รายการปัจจัยการผลิตทั้งหมด">
                 {permissions.create && (
                    <div className="flex justify-end mb-4">
                        <button 
                          onClick={() => handleOpenModal(null)}
                          className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                          เพิ่มรายการใหม่
                        </button>
                    </div>
                 )}
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">ชื่อปัจจัยการผลิต</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">หมวดหมู่</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">จำนวนคงคลัง</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-center">สถานะ</th>
                                {(permissions.edit || permissions.delete) && <th className="px-4 py-3 font-semibold text-gray-600 text-right">การดำเนินการ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-medium text-farm-text">{item.name}</td>
                                    <td className="px-4 py-4 text-gray-600">{item.category}</td>
                                    <td className="px-4 py-4 text-right font-semibold text-farm-text">{item.quantity.toLocaleString()} {item.unit}</td>
                                    <td className="px-4 py-4 text-center">
                                        {item.quantity <= item.lowStockThreshold && (
                                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                สต็อกต่ำ
                                            </span>
                                        )}
                                    </td>
                                    {(permissions.edit || permissions.delete) && (
                                        <td className="px-4 py-4 text-right">
                                            {permissions.edit && <button onClick={() => handleOpenModal(item)} className="text-sm text-blue-600 hover:text-blue-800 font-medium mr-4">แก้ไข</button>}
                                            {permissions.delete && <button onClick={() => handleDeleteItem(item.id)} className="text-sm text-red-600 hover:text-red-800 font-medium">ลบ</button>}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isModalOpen && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}>
                    <form onSubmit={handleSaveItem} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">ชื่อรายการ</label>
                            <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                         <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">หมวดหมู่</label>
                            <input type="text" id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="เช่น ปุ๋ย, เมล็ดพันธุ์" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">จำนวน</label>
                                <input type="number" id="quantity" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">หน่วย</label>
                                <input type="text" id="unit" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="กก., ลิตร, ซอง" required />
                            </div>
                        </div>
                         <div>
                            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">เกณฑ์แจ้งเตือนสต็อกต่ำ</label>
                            <input type="number" id="lowStockThreshold" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={handleCloseModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">ยกเลิก</button>
                            <button type="submit" className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg">บันทึก</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default Inventory;
