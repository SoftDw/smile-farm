
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ActivityLog, Crop, Plot, TraceabilityResult } from '../types';
import SearchIcon from './icons/SearchIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import MapPinIcon from './icons/MapPinIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../lib/database.types';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];
type PlotRow = Database['public']['Tables']['plots']['Row'];
type CropRow = Database['public']['Tables']['crops']['Row'];

interface LandingPageProps {
  onGoToLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const [traceCode, setTraceCode] = useState('');
  const [traceResult, setTraceResult] = useState<TraceabilityResult | null>(null);
  const [traceError, setTraceError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
        elements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const handleTrace = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraceError('');
    setTraceResult(null);
    setIsLoading(true);

    const parts = traceCode.trim().split('-');
    if (parts.length < 5 || parts[0] !== 'SF' || parts[1] !== 'GAP') {
      setTraceError('รหัสอ้างอิงไม่ถูกต้อง โปรดตรวจสอบรูปแบบ (เช่น SF-GAP-6-3-2)');
      setIsLoading(false);
      return;
    }

    try {
        const logId = parseInt(parts[2], 10);
        
        const { data: logData, error: logError }: PostgrestSingleResponse<ActivityLogRow> = await supabase
            .from('activity_logs')
            .select('id, plot_id, activity_type, date, description, materials_used, personnel')
            .eq('id', logId)
            .eq('activity_type', 'เก็บเกี่ยว')
            .single();

        if (logError || !logData) {
            throw new Error("Could not find a harvest log with that ID.");
        }
        const log = logData;

        const { data: plotData, error: plotError }: PostgrestSingleResponse<PlotRow> = await supabase
            .from('plots')
            .select('id, name, description, current_crop_id')
            .eq('id', log.plot_id)
            .single();
        
        if (plotError || !plotData) {
            throw new Error("Could not find the plot associated with this log.");
        }
        const plot = plotData;

        if (!plot.current_crop_id) {
            throw new Error("The plot is not currently associated with a crop.");
        }

        const { data: cropData, error: cropError }: PostgrestSingleResponse<CropRow> = await supabase
            .from('crops')
            .select('id, name, status, planting_date, expected_harvest, image_url, optimal_temp, optimal_humidity')
            .eq('id', plot.current_crop_id)
            .single();

        if (cropError || !cropData) {
            throw new Error("Could not find the crop data for this plot.");
        }
        const crop = cropData;
        
        setTraceResult({
            activityLog: {
                id: log.id,
                plotId: log.plot_id,
                activityType: log.activity_type,
                date: log.date,
                description: log.description,
                materialsUsed: log.materials_used ?? undefined,
                personnel: log.personnel || ''
            },
            plot: {
                id: plot.id,
                name: plot.name,
                description: plot.description || '',
                currentCropId: plot.current_crop_id ?? undefined,
            },
            crop: {
                id: crop.id,
                name: crop.name,
                status: crop.status,
                plantingDate: crop.planting_date,
                expectedHarvest: crop.expected_harvest || '',
                imageUrl: crop.image_url || '',
                optimalTemp: crop.optimal_temp as [number, number] | undefined,
                optimalHumidity: crop.optimal_humidity as [number, number] | undefined,
            }
        });


    } catch (error: any) {
        console.error('Traceability search error:', error);
        setTraceError(error.message || 'ไม่พบข้อมูลสำหรับรหัสนี้ กรุณาตรวจสอบอีกครั้ง');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-farm-brown-light min-h-screen font-sans text-farm-text">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-md transition-all duration-300">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg=='} alt="Smile Farm Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-farm-green-dark">Smile Farm</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-farm-green transition-colors">คุณสมบัติ</a>
            <a href="#traceability" className="text-gray-600 hover:text-farm-green transition-colors">ตรวจสอบย้อนกลับ</a>
            <button
              onClick={onGoToLogin}
              className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              เข้าสู่ระบบ
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto reveal-on-scroll">
            <h1 className="text-4xl md:text-6xl font-extrabold text-farm-green-dark leading-tight mb-4">
                ยกระดับฟาร์มของคุณด้วย<br/>เทคโนโลยีอัจฉริยะ
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                จัดการฟาร์มของคุณอย่างครบวงจร ตั้งแต่การเพาะปลูก, การดูแล, จนถึงการขาย ด้วยระบบที่ใช้งานง่ายและข้อมูลที่แม่นยำ
            </p>
            <button
                onClick={onGoToLogin}
                className="bg-farm-green hover:bg-farm-green-dark text-white font-extrabold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
               เริ่มต้นใช้งาน
            </button>
        </div>
      </main>

       {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 reveal-on-scroll">
            <h2 className="text-3xl md:text-4xl font-bold text-farm-green-dark">คุณสมบัติหลัก</h2>
            <p className="text-gray-600 mt-2">เครื่องมือที่จะช่วยให้การทำฟาร์มของคุณง่ายและมีประสิทธิภาพมากขึ้น</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 reveal-on-scroll">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <ShieldCheckIcon className="w-8 h-8 text-farm-green" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-farm-text">จัดการ GAP</h3>
                  <p className="text-gray-600">บันทึกและติดตามกิจกรรมในฟาร์มตามมาตรฐาน GAP เพื่อสร้างความเชื่อมั่นให้ผู้บริโภค</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 reveal-on-scroll" style={{animationDelay: '100ms'}}>
                   <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                     <MapPinIcon className="w-8 h-8 text-blue-500" />
                   </div>
                  <h3 className="text-xl font-bold mb-2 text-farm-text">ตรวจสอบย้อนกลับ</h3>
                  <p className="text-gray-600">สร้าง QR Code สำหรับผลิตภัณฑ์ของคุณ ให้ลูกค้าสามารถตรวจสอบที่มาและความปลอดภัยได้</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 reveal-on-scroll" style={{animationDelay: '200ms'}}>
                   <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                     <BookOpenIcon className="w-8 h-8 text-yellow-500" />
                   </div>
                  <h3 className="text-xl font-bold mb-2 text-farm-text">บัญชีฟาร์ม</h3>
                  <p className="text-gray-600">บันทึกรายรับ-รายจ่ายอย่างเป็นระบบ พร้อมสรุปผลกำไรขาดทุนแยกตามผลิตภัณฑ์</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 reveal-on-scroll" style={{animationDelay: '300ms'}}>
                   <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                     <ArchiveBoxIcon className="w-8 h-8 text-purple-500" />
                   </div>
                  <h3 className="text-xl font-bold mb-2 text-farm-text">คลังปัจจัยการผลิต</h3>
                  <p className="text-gray-600">จัดการสต็อกปุ๋ย, ยา, และวัสดุอื่นๆ พร้อมระบบแจ้งเตือนเมื่อใกล้หมด</p>
              </div>
          </div>
        </div>
      </section>

      {/* Traceability Section */}
      <section id="traceability" className="py-20">
        <div className="container mx-auto px-6 reveal-on-scroll">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-farm-green-dark text-center mb-6">ตรวจสอบย้อนกลับผลิตภัณฑ์</h2>
            <p className="text-gray-600 text-center mb-8">
              กรอกรหัสอ้างอิงที่อยู่บนฉลากสินค้าเพื่อดูข้อมูลการเพาะปลูก
            </p>
            <form onSubmit={handleTrace} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
              <input
                type="text"
                value={traceCode}
                onChange={(e) => setTraceCode(e.target.value)}
                placeholder="เช่น SF-GAP-123-45-67"
                className="flex-grow p-4 border-2 border-farm-green-light rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-green"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-4 px-8 rounded-xl disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                <SearchIcon className="w-5 h-5" />
                {isLoading ? 'กำลังค้นหา...' : 'ค้นหา'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Smile Farm. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Traceability Modal */}
      <Modal isOpen={!!traceResult || !!traceError} onClose={() => { setTraceResult(null); setTraceError(''); }} title={traceResult ? "ผลการตรวจสอบย้อนกลับ" : "เกิดข้อผิดพลาด"}>
            {traceError && <p className="text-red-600 bg-red-100 p-4 rounded-lg">{traceError}</p>}
            {traceResult && (
                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-2xl text-farm-green-dark">{traceResult.crop.name}</h3>
                        <p className="text-gray-500">สถานะ: {traceResult.crop.status}</p>
                    </div>
                    <img src={traceResult.crop.imageUrl || `https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=600&h=400&auto=format&fit=crop`} alt={traceResult.crop.name} className="w-full h-48 object-cover rounded-lg" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong className="text-gray-700">วันที่เก็บเกี่ยว:</strong> {traceResult.activityLog.date}</div>
                        <div><strong className="text-gray-700">ผู้ดำเนินการ:</strong> {traceResult.activityLog.personnel}</div>
                        <div><strong className="text-gray-700">แปลงปลูก:</strong> {traceResult.plot.name}</div>
                        <div><strong className="text-gray-700">วันที่เริ่มปลูก:</strong> {traceResult.crop.plantingDate}</div>
                    </div>
                    <div>
                        <strong className="text-gray-700 block mb-1">รายละเอียดกิจกรรม:</strong>
                        <p className="bg-gray-50 p-3 rounded-md text-gray-800">{traceResult.activityLog.description}</p>
                    </div>
                    {traceResult.activityLog.materialsUsed && (
                        <div>
                            <strong className="text-gray-700 block mb-1">วัสดุที่ใช้:</strong>
                            <p className="bg-gray-50 p-3 rounded-md text-gray-800">{traceResult.activityLog.materialsUsed}</p>
                        </div>
                    )}
                </div>
            )}
      </Modal>
    </div>
  );
};

export default LandingPage;
