import React from 'react';
import Modal from './Modal';
import { ActivityLog, Plot, Crop, FarmInfo } from '../types';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface ProductLabelProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    activityLog: ActivityLog;
    plot: Plot;
    crop: Crop;
  } | null;
  farmInfo: FarmInfo;
}

const ProductLabel: React.FC<ProductLabelProps> = ({ isOpen, onClose, data, farmInfo }) => {
  if (!isOpen || !data) return null;

  const { activityLog, plot, crop } = data;

  const qrData = `Smile Farm Traceability\nProduct: ${crop.name}\nPlot: ${plot.name}\nHarvest Date: ${activityLog.date}\nOperator: ${activityLog.personnel}\nLog ID: ${activityLog.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ฉลากสินค้า GAP" className="max-w-2xl">
        <div id="printable-label" className="border-2 border-dashed border-gray-400 p-6">
            <div className="text-center mb-4">
                <img src={farmInfo.logoUrl} alt={`${farmInfo.name} Logo`} className="w-16 h-16 mx-auto mb-2 object-contain" />
                <h3 className="text-2xl font-bold text-farm-green-dark">{farmInfo.name}</h3>
                <p className="text-sm text-gray-500">ผลผลิตคุณภาพ ปลอดภัย ตรวจสอบได้</p>
            </div>

            <div className="grid grid-cols-3 gap-6 items-center">
                <div className="col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-lg text-green-700">GAP Certified Product</span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">สินค้า</p>
                        <p className="font-bold text-xl text-farm-text">{crop.name}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600">แปลงเพาะปลูก</p>
                        <p className="font-semibold text-farm-text">{plot.name}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600">วันที่เก็บเกี่ยว</p>
                        <p className="font-semibold text-farm-text">{activityLog.date}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600">ผู้ดำเนินการ</p>
                        <p className="font-semibold text-farm-text">{activityLog.personnel}</p>
                    </div>
                </div>
                <div className="col-span-1 text-center">
                    <img src={qrCodeUrl} alt="QR Code for Traceability" className="mx-auto" />
                    <p className="text-xs text-gray-500 mt-2">สแกนเพื่อตรวจสอบย้อนกลับ</p>
                </div>
            </div>
             <p className="text-center text-xs text-gray-400 mt-6 border-t pt-2">
                รหัสอ้างอิง: SF-GAP-{activityLog.id}-{plot.id}-{crop.id}
             </p>
        </div>

      <div className="mt-6 flex justify-end gap-3 no-print">
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors"
        >
          ปิด
        </button>
        <button
          onClick={handlePrint}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          พิมพ์ฉลาก
        </button>
      </div>
    </Modal>
  );
};

export default ProductLabel;