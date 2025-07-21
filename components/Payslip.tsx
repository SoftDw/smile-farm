import React from 'react';
import { PayrollEntry, Employee, FarmInfo } from '../types';

interface PayslipProps {
  payroll: PayrollEntry | null;
  employees: Employee[];
  farmInfo: FarmInfo;
}

const Payslip: React.FC<PayslipProps> = ({ payroll, employees, farmInfo }) => {
    if (!payroll) return null;

    const employee = employees.find(e => e.id === payroll.employeeId);
    
    return (
        <div className="printable-area hidden">
            <div className="p-8 font-sans max-w-2xl mx-auto border border-gray-300 bg-white">
                {/* Header */}
                <div className="text-center mb-8 border-b pb-4">
                    <img src={farmInfo.logoUrl} alt="Farm Logo" className="h-16 mx-auto mb-2 object-contain" />
                    <h1 className="text-2xl font-bold">{farmInfo.name}</h1>
                    <h2 className="text-xl font-semibold text-gray-700">สลิปเงินเดือน / Payslip</h2>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    <div>
                        <h3 className="font-bold mb-1">ข้อมูลพนักงาน</h3>
                        <p><span className="font-semibold">ชื่อ:</span> {employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</p>
                        <p><span className="font-semibold">ตำแหน่ง:</span> {employee?.position}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="font-bold mb-1">ข้อมูลการจ่าย</h3>
                        <p><span className="font-semibold">รอบจ่าย:</span> {payroll.period}</p>
                        <p><span className="font-semibold">วันที่จ่าย:</span> {payroll.payDate}</p>
                    </div>
                </div>

                {/* Earnings & Deductions Table */}
                <table className="w-full text-left mb-8 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 font-semibold">รายการ</th>
                            <th className="p-2 font-semibold text-right">จำนวนเงิน (บาท)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-2">เงินได้</td>
                            <td className="p-2 text-right">{payroll.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                         <tr className="border-b">
                            <td className="p-2">รายการหัก</td>
                            <td className="p-2 text-right text-red-600">-{payroll.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                    </tbody>
                </table>
                
                {/* Net Pay */}
                <div className="flex justify-end">
                    <div className="w-1/2 bg-gray-100 p-3 rounded-md">
                        <div className="flex justify-between text-lg font-bold">
                            <span>เงินได้สุทธิ</span>
                            <span>{payroll.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })} บาท</span>
                        </div>
                    </div>
                </div>
                
                 {/* Footer */}
                <div className="mt-16 text-center text-xs text-gray-500 border-t pt-4">
                    <p>นี่คือเอกสารที่สร้างโดยระบบคอมพิวเตอร์</p>
                </div>
            </div>
        </div>
    );
};

export default Payslip;
