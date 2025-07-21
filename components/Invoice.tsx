import React from 'react';
import { SalesOrder, Customer, Crop, FarmInfo } from '../types';

interface InvoiceProps {
  order: SalesOrder | null;
  customers: Customer[];
  crops: Crop[];
  farmInfo: FarmInfo;
}

const Invoice: React.FC<InvoiceProps> = ({ order, customers, crops, farmInfo }) => {
    if (!order) return null;

    const customer = customers.find(c => c.id === order.customerId);
    const getCropName = (cropId: number) => crops.find(c => c.id === cropId)?.name || 'N/A';
    
    return (
        <div className="printable-area hidden">
            <div className="p-8 font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 border-b pb-4">
                    <div>
                        <img src={farmInfo.logoUrl} alt="Farm Logo" className="h-16 mb-2 object-contain" />
                        <h1 className="text-2xl font-bold">{farmInfo.name}</h1>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{farmInfo.address}</p>
                        <p className="text-sm text-gray-600">โทร: {farmInfo.phone}</p>
                        <p className="text-sm text-gray-600">อีเมล: {farmInfo.email}</p>
                        {farmInfo.taxId && <p className="text-sm text-gray-600">เลขประจำตัวผู้เสียภาษี: {farmInfo.taxId}</p>}
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-gray-800">ใบแจ้งหนี้ / Invoice</h2>
                        <p className="text-gray-600">เลขที่: INV-{String(order.id).padStart(5, '0')}</p>
                        <p className="text-gray-600">วันที่: {order.orderDate}</p>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">ข้อมูลลูกค้า</h3>
                    {customer ? (
                        <div className="text-gray-800">
                            <p className="font-bold">{customer.name}</p>
                            <p>{customer.contactPerson}</p>
                            <p className="whitespace-pre-line">{customer.address}</p>
                            <p>โทร: {customer.phone}</p>
                            <p>อีเมล: {customer.email}</p>
                        </div>
                    ) : (
                        <p>ไม่พบข้อมูลลูกค้า</p>
                    )}
                </div>

                {/* Line Items Table */}
                <table className="w-full text-left mb-8">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">รายการ</th>
                            <th className="p-2 text-right">จำนวน</th>
                            <th className="p-2 text-right">ราคา/หน่วย (฿)</th>
                            <th className="p-2 text-right">ราคารวม (฿)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.itemId} className="border-b">
                                <td className="p-2">{getCropName(item.cropId)}</td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">{item.unitPrice.toFixed(2)}</td>
                                <td className="p-2 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {/* Total */}
                <div className="flex justify-end">
                    <div className="w-1/2">
                        <div className="flex justify-between text-lg">
                            <span className="font-semibold">ยอดรวม</span>
                            <span className="font-bold">{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-xs text-gray-500 border-t pt-4">
                    <p>ขอบคุณที่ใช้บริการ Smile Farm</p>
                    <p>Thank you for your business!</p>
                </div>
            </div>
        </div>
    );
};

export default Invoice;
