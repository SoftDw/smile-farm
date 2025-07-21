import React, { useState, useMemo } from 'react';
import { LedgerEntry, Crop, PermissionSet } from '../types';
import Card from './Card';
import CalculatorIcon from './icons/CalculatorIcon';
import { Database } from '../lib/database.types';

type LedgerEntryInsert = Database['public']['Tables']['ledger_entries']['Insert'];

interface FarmLedgerProps {
    entries: LedgerEntry[];
    onSave: (entry: LedgerEntryInsert) => Promise<void>;
    onDelete: (entryId: number) => Promise<void>;
    crops: Crop[];
    permissions: PermissionSet;
}

const FarmLedger: React.FC<FarmLedgerProps> = ({ entries, onSave, onDelete, crops, permissions }) => {
    const [newEntry, setNewEntry] = useState({ description: '', amount: '', type: 'expense' as 'income' | 'expense', cropId: '' });

    const { totalIncome, totalExpense, netProfit } = useMemo(() => {
        const income = entries
            .filter(e => e.type === 'income')
            .reduce((sum, e) => sum + e.amount, 0);
        const expense = entries
            .filter(e => e.type === 'expense')
            .reduce((sum, e) => sum + e.amount, 0);
        return {
            totalIncome: income,
            totalExpense: expense,
            netProfit: income - expense,
        };
    }, [entries]);

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.description || !newEntry.amount) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        const entryToAdd: LedgerEntryInsert = {
            date: new Date().toISOString().split('T')[0],
            description: newEntry.description,
            type: newEntry.type,
            amount: parseFloat(newEntry.amount),
            crop_id: newEntry.cropId ? parseInt(newEntry.cropId, 10) : undefined,
        };

        await onSave(entryToAdd);
        setNewEntry({ description: '', amount: '', type: 'expense', cropId: '' });
    };

    const handleDelete = (entryId: number) => {
        if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
            onDelete(entryId);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-8 flex items-center gap-3">
                <CalculatorIcon className="w-9 h-9" /> บัญชีฟาร์ม
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card title="รายรับทั้งหมด">
                    <p className="text-3xl font-bold text-green-600">{totalIncome.toLocaleString()} บาท</p>
                </Card>
                <Card title="รายจ่ายทั้งหมด">
                    <p className="text-3xl font-bold text-red-600">{totalExpense.toLocaleString()} บาท</p>
                </Card>
                <Card title="กำไร/ขาดทุนสุทธิ">
                     <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netProfit.toLocaleString()} บาท</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Entry */}
                {permissions.create && (
                    <div className="lg:col-span-1">
                        <Card title="เพิ่มรายการใหม่">
                            <form onSubmit={handleAddEntry} className="space-y-4">
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">รายการ</label>
                                    <input
                                        type="text"
                                        id="description"
                                        value={newEntry.description}
                                        onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-farm-green focus:border-farm-green"
                                        placeholder="เช่น ซื้อปุ๋ย, ขายมะเขือเทศ"
                                    />
                                </div>
                                 <div>
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">จำนวนเงิน (บาท)</label>
                                    <input
                                        type="number"
                                        id="amount"
                                        value={newEntry.amount}
                                        onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-farm-green focus:border-farm-green"
                                        placeholder="0.00"
                                        step="0.01"
                                    />
                                </div>
                                 <div>
                                    <label htmlFor="cropId" className="block text-sm font-medium text-gray-700">สินค้า (ถ้ามี)</label>
                                    <select
                                        id="cropId"
                                        value={newEntry.cropId}
                                        onChange={(e) => setNewEntry({...newEntry, cropId: e.target.value})}
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-farm-green focus:border-farm-green bg-white"
                                    >
                                        <option value="">-- ทั่วไป --</option>
                                        {crops.map(crop => (
                                            <option key={crop.id} value={crop.id}>{crop.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">ประเภท</label>
                                    <div className="flex gap-4 mt-1">
                                        <label className="flex items-center">
                                            <input type="radio" name="type" value="expense" checked={newEntry.type === 'expense'} onChange={() => setNewEntry({...newEntry, type: 'expense'})} className="focus:ring-farm-green h-4 w-4 text-farm-green border-gray-300" />
                                            <span className="ml-2">รายจ่าย</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" name="type" value="income" checked={newEntry.type === 'income'} onChange={() => setNewEntry({...newEntry, type: 'income'})} className="focus:ring-farm-green h-4 w-4 text-farm-green border-gray-300" />
                                            <span className="ml-2">รายรับ</span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    เพิ่มรายการ
                                </button>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Entries List */}
                <div className={permissions.create ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card title="ประวัติรายการล่าสุด">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-gray-600">วันที่</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600">รายการ</th>
                                        <th className="px-4 py-3 font-semibold text-gray-600 text-right">จำนวนเงิน</th>
                                        {permissions.delete && <th className="px-4 py-3"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {entries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500">{entry.date}</td>
                                            <td className="px-4 py-3">
                                                {entry.description}
                                                {entry.cropId && (
                                                    <span className="ml-2 text-xs bg-farm-green-light text-farm-green-dark font-medium px-2 py-0.5 rounded-full">
                                                        {crops.find(c => c.id === entry.cropId)?.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-semibold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {entry.type === 'expense' ? '-' : '+'}
                                                {entry.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                            {permissions.delete && (
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-600">&times;</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default FarmLedger;
