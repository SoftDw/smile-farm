
import React, { useState, useMemo } from 'react';
import { SalesOrder, LedgerEntry, Crop, Customer } from '../types';
import Card from './Card';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import LineChartComponent from './LineChartComponent';
import PrintIcon from './icons/PrintIcon';

interface ReportsProps {
  salesOrders: SalesOrder[];
  ledgerEntries: LedgerEntry[];
  crops: Crop[];
  customers: Customer[];
}

type FilterType = '30d' | '90d' | 'year' | 'all';
type ReportView = 'sales' | 'profitability' | 'customers';

const NavItem: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`p-3 rounded-lg cursor-pointer transition-colors text-left w-full ${
      isActive
        ? 'bg-farm-green-light text-farm-green-dark font-semibold'
        : 'text-gray-600 hover:bg-farm-green-light/50'
    }`}
    role="button"
  >
    {label}
  </li>
);

const Reports: React.FC<ReportsProps> = ({ salesOrders, ledgerEntries, crops, customers }) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [activeReportView, setActiveReportView] = useState<ReportView>('sales');

    const handlePrint = () => {
        window.print();
    };

    const filteredSalesOrders = useMemo(() => {
        const now = new Date();
        if (filter === 'all') return salesOrders;
        
        let startDate = new Date();
        if (filter === '30d') {
            startDate.setDate(now.getDate() - 30);
        } else if (filter === '90d') {
            startDate.setDate(now.getDate() - 90);
        } else if (filter === 'year') {
            startDate.setFullYear(now.getFullYear(), 0, 1);
        }
        
        return salesOrders.filter(order => new Date(order.orderDate) >= startDate);
    }, [salesOrders, filter]);

    const salesChartData = useMemo(() => {
        const monthlySales: { [key: string]: number } = {};
        
        filteredSalesOrders.forEach(order => {
            const month = order.orderDate.substring(0, 7); // YYYY-MM
            if (!monthlySales[month]) {
                monthlySales[month] = 0;
            }
            monthlySales[month] += order.totalAmount;
        });

        return Object.keys(monthlySales).sort().map(month => ({
            month,
            "ยอดขาย": monthlySales[month],
        }));
    }, [filteredSalesOrders]);
    
    const profitabilityData = useMemo(() => {
        return crops.map(crop => {
            const relatedEntries = ledgerEntries.filter(entry => entry.cropId === crop.id);
            const totalIncome = relatedEntries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
            const totalExpenses = relatedEntries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
            const netProfit = totalIncome - totalExpenses;
            return {
                cropId: crop.id,
                productName: crop.name,
                totalIncome,
                totalExpenses,
                netProfit
            };
        }).sort((a, b) => b.netProfit - a.netProfit);
    }, [crops, ledgerEntries]);

    const topCustomersData = useMemo(() => {
        const customerSales: { [key: number]: { name: string, total: number, count: number } } = {};

        filteredSalesOrders.forEach(order => {
            if (!customerSales[order.customerId]) {
                const customerName = customers.find(c => c.id === order.customerId)?.name || 'Unknown Customer';
                customerSales[order.customerId] = { name: customerName, total: 0, count: 0 };
            }
            customerSales[order.customerId].total += order.totalAmount;
            customerSales[order.customerId].count += 1;
        });
        
        return Object.values(customerSales).sort((a, b) => b.total - a.total).slice(0, 10);
    }, [filteredSalesOrders, customers]);
    
    const FilterButton: React.FC<{ value: FilterType, label: string }> = ({ value, label }) => (
        <button 
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${filter === value ? 'bg-farm-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-4xl font-bold text-farm-green-dark flex items-center gap-3">
                    <DocumentChartBarIcon className="w-9 h-9" />
                    รายงานและบทวิเคราะห์
                </h1>
                <button 
                    onClick={handlePrint}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                    <PrintIcon className="w-5 h-5" />
                    พิมพ์รายงาน
                </button>
            </div>
            
            <div className="flex-grow flex gap-8">
                {/* Report Navigation Sidebar */}
                <nav className="w-64 flex-shrink-0 no-print">
                    <Card title="ประเภทรายงาน">
                        <ul className="space-y-2">
                            <NavItem label="ภาพรวมยอดขาย" isActive={activeReportView === 'sales'} onClick={() => setActiveReportView('sales')} />
                            <NavItem label="วิเคราะห์กำไร" isActive={activeReportView === 'profitability'} onClick={() => setActiveReportView('profitability')} />
                            <NavItem label="ข้อมูลลูกค้า" isActive={activeReportView === 'customers'} onClick={() => setActiveReportView('customers')} />
                        </ul>
                    </Card>
                </nav>

                {/* Report Content */}
                <div className="flex-1 printable-area">
                    <div className="hidden print:block text-center mb-8">
                        <h1 className="text-2xl font-bold">รายงานสรุป Smile Farm</h1>
                        <p className="text-sm text-gray-600">สร้างเมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {/* Sales Report Card - visible when active, or when printing */}
                    <div className={`${activeReportView === 'sales' ? '' : 'hidden'} print:block print:mb-8`}>
                        <Card title="สรุปยอดขาย">
                            <div className="flex justify-end gap-2 mb-4 no-print">
                                <FilterButton value="30d" label="30 วันล่าสุด" />
                                <FilterButton value="90d" label="90 วันล่าสุด" />
                                <FilterButton value="year" label="ปีนี้" />
                                <FilterButton value="all" label="ทั้งหมด" />
                            </div>
                            {salesChartData.length > 0 ? (
                                <LineChartComponent
                                    data={salesChartData}
                                    xAxisKey="month"
                                    lines={[{ key: 'ยอดขาย', name: 'ยอดขาย (บาท)', color: '#74b49b' }]}
                                />
                            ) : (
                                <p className="text-center text-gray-500 py-10">ไม่มีข้อมูลยอดขายในช่วงเวลานี้</p>
                            )}
                        </Card>
                    </div>

                    {/* Profitability Card - visible when active, or when printing */}
                    <div className={`${activeReportView === 'profitability' ? '' : 'hidden'} print:block print:mb-8`}>
                        <Card title="การทำกำไรของพืชผล (ทั้งหมด)">
                            <div className="overflow-y-auto max-h-[65vh] print:max-h-none print:overflow-visible">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 print:static">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600">สินค้า</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">กำไรสุทธิ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {profitabilityData.map(item => (
                                            <tr key={item.cropId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-farm-text">{item.productName}</td>
                                                <td className={`px-4 py-3 text-right font-bold ${item.netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                                    {item.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                    
                    {/* Top Customers Card - visible when active, or when printing */}
                    <div className={`${activeReportView === 'customers' ? '' : 'hidden'} print:block`}>
                        <Card title="ลูกค้าชั้นนำ">
                            <div className="overflow-y-auto max-h-[65vh] print:max-h-none print:overflow-visible">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 print:static">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-600">ลูกค้า</th>
                                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">ยอดซื้อรวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {topCustomersData.map((cust, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-farm-text">{cust.name}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-farm-green-dark">
                                                    {cust.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
