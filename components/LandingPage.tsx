
import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import Modal from './Modal';
import { ActivityLog, Crop, Plot, TraceabilityResult } from '../types';
import SearchIcon from './icons/SearchIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import MenuIcon from './icons/MenuIcon';
import XIcon from './icons/XIcon';
import QrcodeIcon from './icons/QrcodeIcon';
import SparklesIcon from './icons/SparklesIcon';
import DashboardIcon from './icons/DashboardIcon';
import ChipIcon from './icons/ChipIcon';
import ThermostatIcon from './icons/ThermostatIcon';
import HumidityIcon from './icons/HumidityIcon';
import LeafIcon from './icons/LeafIcon';
import { supabase } from '../lib/supabaseClient';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

interface LandingPageProps {
  onGoToLogin: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, delay?: number }> = ({ icon, title, description, delay = 0 }) => (
    <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center transform hover:-translate-y-2 transition-all duration-300 reveal-on-scroll hover:shadow-2xl border border-white/20" style={{ transitionDelay: `${delay}ms` }}>
        <div className="bg-farm-green-light rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-inner">
            {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3 text-farm-green-dark">{title}</h3>
        <p className="text-gray-600 text-base">{description}</p>
    </div>
);

const TestimonialCard: React.FC<{ quote: string, author: string, company: string, delay?: number }> = ({ quote, author, company, delay = 0 }) => (
    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl reveal-on-scroll border border-white/30 h-full flex flex-col" style={{ transitionDelay: `${delay}ms` }}>
        <p className="text-gray-700 italic mb-4 flex-grow">"{quote}"</p>
        <div className="mt-auto">
          <p className="font-bold text-farm-green-dark">{author}</p>
          <p className="text-sm text-gray-500">{company}</p>
        </div>
    </div>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="flex-shrink-0 flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm mx-4">
        <div className="text-farm-green-light">{icon}</div>
        <div>
            <p className="text-sm text-gray-300">{label}</p>
            <p className="font-bold text-white text-lg">{value}</p>
        </div>
    </div>
);


const LandingPage: React.FC<LandingPageProps> = ({ onGoToLogin }) => {
  const [traceCode, setTraceCode] = useState('');
  const [traceResult, setTraceResult] = useState<TraceabilityResult | null>(null);
  const [traceError, setTraceError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [typedText, setTypedText] = useState('');
  const fullText = "ผมคือผู้ช่วย AI ของคุณ มีอะไรให้ช่วยเกี่ยวกับการทำฟาร์มอัจฉริยะไหมครับ?";

  const aiTeaserRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const typingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let i = 0;
            setTypedText('');
            const typingInterval = setInterval(() => {
              if (i < fullText.length) {
                setTypedText((prev) => prev + fullText.charAt(i));
                i++;
              } else {
                clearInterval(typingInterval);
              }
            }, 50);

            typingObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );

    if (aiTeaserRef.current) {
      typingObserver.observe(aiTeaserRef.current);
    }

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => revealObserver.observe(el));
    
    return () => {
        if (aiTeaserRef.current) {
            typingObserver.unobserve(aiTeaserRef.current);
        }
        elements.forEach(el => revealObserver.unobserve(el));
    };
  }, [fullText]);

  // QR Scanner State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();

  const handleTrace = useCallback(async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    setTraceError('');
    setTraceResult(null);
    setIsLoading(true);

    const codeToTrace = codeOverride || traceCode;
    if (!codeToTrace) {
        setTraceError('กรุณาใส่รหัสอ้างอิง');
        setIsLoading(false);
        return;
    }

    const parts = codeToTrace.trim().split('-');
    if (parts.length < 5 || parts[0] !== 'SF' || parts[1] !== 'GAP') {
      setTraceError('รหัสอ้างอิงไม่ถูกต้อง โปรดตรวจสอบรูปแบบ (เช่น SF-GAP-6-3-2)');
      setIsLoading(false);
      return;
    }

    try {
        const logId = parseInt(parts[2], 10);
        
        type ActivityLogRow = Database['public']['Tables']['activity_logs']['Row'];
        const { data: log, error: logError }: PostgrestSingleResponse<ActivityLogRow> = await supabase
            .from('activity_logs').select('id, plot_id, activity_type, date, description, materials_used, personnel').eq('id', logId).eq('activity_type', 'เก็บเกี่ยว').single();
        if (logError || !log) throw new Error("ไม่พบข้อมูลการเก็บเกี่ยวสำหรับรหัสนี้");

        type PlotRow = Database['public']['Tables']['plots']['Row'];
        const { data: plot, error: plotError }: PostgrestSingleResponse<PlotRow> = await supabase
            .from('plots').select('id, name, description, current_crop_id').eq('id', log.plot_id).single();
        if (plotError || !plot) throw new Error("ไม่พบข้อมูลแปลงปลูกที่เกี่ยวข้อง");

        if (!plot.current_crop_id) throw new Error("แปลงปลูกไม่ได้ผูกกับพืชผลใดๆ ในขณะนี้");

        type CropRow = Database['public']['Tables']['crops']['Row'];
        const { data: crop, error: cropError }: PostgrestSingleResponse<CropRow> = await supabase
            .from('crops').select('id, name, status, planting_date, expected_harvest, image_url, optimal_temp, optimal_humidity').eq('id', plot.current_crop_id).single();
        if (cropError || !crop) throw new Error("ไม่พบข้อมูลพืชผลสำหรับแปลงนี้");
        
        setTraceResult({
            activityLog: {
                id: log.id, plotId: log.plot_id, activityType: log.activity_type as ActivityLog['activityType'],
                date: log.date, description: log.description, materialsUsed: log.materials_used ?? undefined,
                personnel: log.personnel || ''
            },
            plot: {
                id: plot.id, name: plot.name, description: plot.description || '', currentCropId: plot.current_crop_id ?? undefined,
            },
            crop: {
                id: crop.id, name: crop.name, status: crop.status as any, plantingDate: crop.planting_date,
                expectedHarvest: crop.expected_harvest || '', imageUrl: crop.image_url || '',
                optimalTemp: crop.optimal_temp as [number, number] | undefined,
                optimalHumidity: crop.optimal_humidity as [number, number] | undefined,
            }
        });
    } catch (error: any) {
        setTraceError(error.message || 'ไม่พบข้อมูลสำหรับรหัสนี้ กรุณาตรวจสอบอีกครั้ง');
    } finally {
        setIsLoading(false);
    }
  }, [traceCode]);

  const handleMobileNavClick = (target: string) => {
    setIsMenuOpen(false);
    if(target.startsWith('#')) {
        document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'login') {
        onGoToLogin();
    }
  };
  
  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (typeof animationFrameId.current === 'number') {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, []);

  const handleCloseScanner = useCallback(() => {
    setIsScannerOpen(false);
    stopScanner();
  }, [stopScanner]);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = videoRef.current.videoHeight;
    canvas.width = videoRef.current.videoWidth;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code) {
      setTraceCode(code.data);
      handleCloseScanner();
      handleTrace(undefined, code.data);
    } else if (isScannerOpen) {
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  }, [isScannerOpen, handleCloseScanner, handleTrace]);

  const startScanner = useCallback(async () => {
    setScannerError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      setScannerError('ไม่สามารถเข้าถึงกล้องได้ โปรดตรวจสอบการอนุญาตในเบราว์เซอร์ของคุณ');
      setIsScannerOpen(false);
    }
  }, [scanFrame]);
  
  useEffect(() => {
    if (isScannerOpen) {
      startScanner();
    }
    return stopScanner;
  }, [isScannerOpen, startScanner, stopScanner]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-farm-text">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-md">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg=='} alt="Smile Farm Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-farm-green-dark">Smile Farm</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-farm-green transition-colors font-medium">คุณสมบัติ</a>
            <a href="#ai-teaser" className="text-gray-600 hover:text-farm-green transition-colors font-medium">ผู้ช่วย AI</a>
            <a href="#traceability" className="text-gray-600 hover:text-farm-green transition-colors font-medium">ตรวจสอบย้อนกลับ</a>
            <a href="#login" className="text-gray-600 hover:text-farm-green transition-colors font-medium">รายงาน</a>
            <button onClick={onGoToLogin} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-5 rounded-full transition-all duration-300 transform hover:scale-105">
              เข้าสู่ระบบ
            </button>
          </nav>
           <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu"><MenuIcon /></button>
           </div>
        </div>
      </header>
      
      <div className={`fixed inset-0 z-[100] bg-white p-6 md:hidden transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center mb-10">
            <span className="text-xl font-bold text-farm-green-dark">Menu</span>
            <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu"><XIcon/></button>
        </div>
        <nav className="flex flex-col items-center gap-8 text-lg">
          <a href="#features" onClick={() => handleMobileNavClick('#features')} className="text-gray-700 hover:text-farm-green">คุณสมบัติ</a>
          <a href="#ai-teaser" onClick={() => handleMobileNavClick('#ai-teaser')} className="text-gray-700 hover:text-farm-green">ผู้ช่วย AI</a>
          <a href="#traceability" onClick={() => handleMobileNavClick('#traceability')} className="text-gray-700 hover:text-farm-green">ตรวจสอบย้อนกลับ</a>
          <a href="#login" onClick={() => handleMobileNavClick('login')} className="text-gray-700 hover:text-farm-green">รายงาน</a>
          <button onClick={() => handleMobileNavClick('login')} className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3 px-8 rounded-full transition-colors">เข้าสู่ระบบ</button>
        </nav>
      </div>

      <main>
        <section className="hero-section text-white relative">
          <div className="container mx-auto px-6 py-24 md:py-32 text-center flex flex-col items-center justify-center min-h-[80vh] md:min-h-[70vh]">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-shadow-lg">เทคโนโลยีเกษตรอัจฉริยะ<br />เพื่อผลผลิตที่ยั่งยืน</h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-3xl mx-auto text-shadow">บริหารจัดการฟาร์มของคุณอย่างครบวงจรด้วยข้อมูลเรียลไทม์และ AI ผู้ช่วย</p>
                <button onClick={onGoToLogin} className="bg-white text-farm-green-dark font-extrabold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl pulse-glow">
                  เข้าสู่แดชบอร์ด
                </button>
              </div>
          </div>
           <div className="absolute bottom-0 left-0 right-0 py-4 bg-black/30 overflow-hidden">
                <div className="flex animate-marquee whitespace-nowrap">
                    <StatCard icon={<ThermostatIcon className="w-8 h-8"/>} label="อุณหภูมิ" value="28.2°C" />
                    <StatCard icon={<HumidityIcon className="w-8 h-8"/>} label="ความชื้น" value="65.7%" />
                    <StatCard icon={<ChipIcon className="w-8 h-8"/>} label="อุปกรณ์ทำงาน" value="12" />
                    <StatCard icon={<LeafIcon className="w-8 h-8"/>} label="พร้อมเก็บเกี่ยว" value="3 แปลง" />
                    <StatCard icon={<ThermostatIcon className="w-8 h-8"/>} label="อุณหภูมิ" value="28.2°C" />
                    <StatCard icon={<HumidityIcon className="w-8 h-8"/>} label="ความชื้น" value="65.7%" />
                    <StatCard icon={<ChipIcon className="w-8 h-8"/>} label="อุปกรณ์ทำงาน" value="12" />
                    <StatCard icon={<LeafIcon className="w-8 h-8"/>} label="พร้อมเก็บเกี่ยว" value="3 แปลง" />
                </div>
            </div>
        </section>

        <section id="features" className="py-20 bg-farm-brown-light" style={{backgroundImage: 'linear-gradient(to bottom, #f5e8dd, #ffffff)'}}>
         <div className="container mx-auto px-6">
          <div className="text-center mb-16 reveal-on-scroll">
            <h2 className="text-4xl md:text-5xl font-bold text-farm-green-dark">แพลตฟอร์มเดียว จบทุกเรื่องฟาร์ม</h2>
            <p className="text-gray-600 mt-4 text-lg max-w-2xl mx-auto">เครื่องมือที่เกษตรกรยุคใหม่ต้องมี เพื่อการจัดการฟาร์มที่มีประสิทธิภาพสูงสุด</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard icon={<DashboardIcon className="w-10 h-10 text-farm-green-dark" />} title="แดชบอร์ดอัจฉริยะ" description="ภาพรวมข้อมูลฟาร์มทั้งหมดในหน้าเดียว ทั้งสภาพอากาศ การเงิน และสถานะพืช" />
              <FeatureCard icon={<SparklesIcon className="w-10 h-10 text-farm-green-dark" />} title="ผู้ช่วย AI" description="ปรึกษาปัญหาการเกษตรได้ 24 ชม. เหมือนมีผู้เชี่ยวชาญส่วนตัว" delay={100} />
              <FeatureCard icon={<ShieldCheckIcon className="w-10 h-10 text-farm-green-dark" />} title="มาตรฐาน GAP" description="จัดการและตรวจสอบย้อนกลับกิจกรรมในฟาร์มได้อย่างง่ายดาย สร้างความมั่นใจให้ลูกค้า" delay={200} />
              <FeatureCard icon={<ChipIcon className="w-10 h-10 text-farm-green-dark" />} title="ควบคุมอัตโนมัติ" description="สั่งการและตั้งเวลาอุปกรณ์ในฟาร์ม เช่น ปั๊มน้ำ หรือระบบไฟ ผ่านระบบออนไลน์" delay={300} />
          </div>
        </div>
      </section>

      <section id="ai-teaser" ref={aiTeaserRef} className="py-24 ai-teaser-gradient text-white">
        <div className="container mx-auto px-6 text-center reveal-on-scroll">
            <div className="bg-black/20 backdrop-blur-lg p-8 md:p-12 rounded-3xl max-w-3xl mx-auto border border-white/30 shadow-2xl">
                <SparklesIcon className="w-16 h-16 mx-auto mb-4 text-farm-green-light"/>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">ผู้ช่วย AI พร้อมตอบทุกคำถาม</h2>
                <div className="bg-gray-800/50 p-4 rounded-xl text-left min-h-[80px] flex items-center gap-4">
                    <div className="w-12 h-12 bg-farm-green-dark rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg">AI</div>
                    <p className="text-lg text-gray-200">{typedText}<span className="inline-block w-1 h-5 bg-white animate-pulse ml-1"></span></p>
                </div>
                <button onClick={onGoToLogin} className="w-full mt-8 bg-white text-farm-green-dark font-bold py-4 px-6 rounded-xl text-lg transition-transform transform hover:scale-105 shadow-lg">
                    ทดลองใช้งานผู้ช่วย AI
                </button>
            </div>
        </div>
      </section>

      <section id="traceability" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 reveal-on-scroll">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto border">
            <h2 className="text-3xl md:text-4xl font-bold text-farm-green-dark text-center mb-4">ตรวจสอบย้อนกลับผลิตภัณฑ์</h2>
            <p className="text-gray-600 text-center mb-8">กรอกรหัสอ้างอิงบนฉลากสินค้า หรือสแกน QR Code เพื่อความโปร่งใสและปลอดภัย</p>
            <form onSubmit={handleTrace} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <input type="text" value={traceCode} onChange={(e) => setTraceCode(e.target.value)} placeholder="เช่น SF-GAP-123-45-67" className="flex-grow p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-green transition-shadow"/>
              <div className="flex items-center gap-3">
                 <button type="button" onClick={() => setIsScannerOpen(true)} aria-label="Scan QR Code" className="p-4 bg-gray-200 hover:bg-gray-300 text-farm-green-dark rounded-xl transition-colors"><QrcodeIcon className="w-6 h-6" /></button>
                <button type="submit" disabled={isLoading} className="flex-grow bg-farm-green hover:bg-farm-green-dark text-white font-bold py-4 px-6 rounded-xl disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"><SearchIcon className="w-5 h-5" />{isLoading ? '...' : 'ค้นหา'}</button>
              </div>
            </form>
            {scannerError && <p className="text-red-500 text-center mt-4">{scannerError}</p>}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 bg-farm-brown-light">
          <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-farm-green-dark text-center mb-12 reveal-on-scroll">เสียงจากเกษตรกรที่ใช้ Smile Farm</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <TestimonialCard quote="Smile Farm เปลี่ยนการทำฟาร์มของผมไปเลย จัดการทุกอย่างง่ายขึ้นเยอะ แถมผลผลิตก็ดีขึ้นด้วย" author="สมชาย ใจดี" company="สวนผักลุงสมชาย" />
                  <TestimonialCard quote="ระบบบัญชีและคลังช่วยลดข้อผิดพลาดได้มาก ตอนนี้รู้ต้นทุนกำไรชัดเจน ทำให้วางแผนง่ายขึ้นครับ" author="วิภาวรรณ สุขใจ" company="ไร่วิภาวรรณ" delay={100} />
                  <TestimonialCard quote="ลูกค้าชอบมากที่เรามี QR Code ให้สแกนดูที่มาของผักได้ มันสร้างความเชื่อมั่นได้จริงๆ" author="มานพ ตั้งตรง" company="ฟาร์มผักออร์แกนิกมานพ" delay={200} />
              </div>
          </div>
      </section>
      </main>

      <footer className="bg-farm-green-dark text-white">
        <div className="container mx-auto px-6 py-8 text-center">
          <p>&copy; {new Date().getFullYear()} Smile Farm. The Future of Smart Farming.</p>
        </div>
      </footer>
      
      {isScannerOpen && (
        <div className="qr-scanner-overlay">
          <button onClick={handleCloseScanner} className="qr-scanner-close" aria-label="Close scanner"><XIcon className="w-8 h-8" /></button>
          <video ref={videoRef} className="qr-scanner-video"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <p className="text-white mt-4 text-lg">เล็งกล้องไปที่ QR Code</p>
        </div>
      )}
      
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
