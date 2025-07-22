
import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import DatabaseSetup from './DatabaseSetup';

interface LoginPageProps {
  onBackToLanding: () => void;
}

const FloatingLabelInput = ({ id, type, value, onChange, placeholder, icon, required = false, autoComplete }: { id: string, type: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string, icon: React.ReactNode, required?: boolean, autoComplete?: string }) => {
    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                {icon}
            </div>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                className="block w-full px-4 py-4 pl-12 text-lg text-white placeholder-gray-300 bg-gray-900/30 border border-white/20 rounded-xl peer focus:outline-none focus:ring-2 focus:ring-farm-green-light"
                placeholder=" "
                required={required}
                autoComplete={autoComplete}
            />
            <label
                htmlFor={id}
                className="absolute text-base text-gray-300 duration-300 transform -translate-y-4 scale-75 top-5 z-0 origin-[0] left-12 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4"
            >
                {placeholder}
            </label>
        </div>
    )
}

const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
            const { error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                     setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                } else {
                     setError(signUpError.message);
                }
            }
        } else {
            setError(signInError.message);
        }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animated-gradient">
      <div className="w-full max-w-md bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/30 text-white">
        
        <div className="text-center mb-8">
            <img src={'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg=='} alt="Smile farm Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h1 className="text-4xl font-bold">Smile Farm</h1>
            <p className="text-gray-300 mt-2">เข้าสู่ระบบหรือลงทะเบียนเพื่อเริ่มต้น</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <FloatingLabelInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล (ชื่อผู้ใช้)"
              icon={<UserIcon className="h-6 w-6 text-gray-300" />}
              required
              autoComplete="email"
            />
            
            <FloatingLabelInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              icon={<LockIcon className="h-6 w-6 text-gray-300" />}
              required
              autoComplete="current-password"
            />
            
            {error && <p className="text-red-300 text-sm text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-farm-green-light hover:bg-white text-farm-green-dark font-bold py-4 px-4 rounded-xl text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-farm-green-light/50 disabled:bg-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed pulse-glow"
            >
              {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ / ลงทะเบียน'}
            </button>
        </form>

        <div className="mt-6 text-center border-t border-white/20 pt-6">
            <p className="text-sm text-gray-300 mb-2">
              หากเป็นการใช้งานครั้งแรก หรือต้องการตั้งค่าฐานข้อมูลใหม่:
            </p>
            <button
                type="button"
                onClick={() => setIsSetupModalOpen(true)}
                className="text-sm font-medium text-farm-green-light hover:text-white underline"
            >
                คลิกที่นี่เพื่อดูขั้นตอนการตั้งค่า
            </button>
        </div>

        <div className="mt-8 text-center">
            <button onClick={onBackToLanding} className="text-sm text-gray-300 hover:text-white transition-colors">
              &larr; กลับสู่หน้าหลัก
            </button>
        </div>
      </div>
      
      <Modal 
          isOpen={isSetupModalOpen} 
          onClose={() => setIsSetupModalOpen(false)} 
          title="ตั้งค่าฐานข้อมูล (Database Setup)"
          className="max-w-4xl"
      >
          <DatabaseSetup />
      </Modal>
    </div>
  );
};

export default LoginPage;
