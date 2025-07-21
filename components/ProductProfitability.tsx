import React, { useMemo } from 'react';
import Card from './Card';
import ChartPieIcon from './icons/ChartPieIcon';
import { Crop, LedgerEntry } from '../types';

interface ProductProfitabilityProps {
    crops: Crop[];
    ledgerEntries: LedgerEntry[];
}

const ProductProfitability: React.FC<ProductProfitabilityProps> = ({ crops, ledgerEntries }) => {

    const profitabilityData = useMemo(() => {
        return crops.map(crop => {
            const relatedEntries = ledgerEntries.filter(entry => entry.cropId === crop.id);

            const totalIncome = relatedEntries
                .filter(entry => entry.type === 'income')
                .reduce((sum, entry) => sum + entry.amount, 0);
            
            const totalExpenses = relatedEntries
                .filter(entry => entry.type === 'expense')
                .reduce((sum, entry) => sum + entry.amount, 0);

            const netProfit = totalIncome - totalExpenses;

            return {
                cropId: crop.id,
                productName: crop.name,
                totalIncome,
                totalExpenses,
                netProfit
            };
        });
    }, [crops, ledgerEntries]);

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-farm-green-dark mb-8 flex items-center gap-3">
                <ChartPieIcon className="w-9 h-9" /> กำไรขาดทุนต่อสินค้า
            </h1>

            <Card title="สรุปผลประกอบการแยกตามพืชผล">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-600">สินค้า</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">รายรับรวม</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">รายจ่ายรวม</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">กำไร/ขาดทุนสุทธิ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {profitabilityData.map(item => (
                                <tr key={item.cropId} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 font-medium text-farm-text">{item.productName}</td>
                                    <td className="px-4 py-4 text-right text-green-600 font-semibold">
                                        {item.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-4 text-right text-red-600 font-semibold">
                                        {item.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-4 py-4 text-right font-bold ${item.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                        {item.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ProductProfitability;
