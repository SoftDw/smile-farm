

import React, { useState } from 'react';
import UserIcon from './icons/UserIcon';
import LockIcon from './icons/LockIcon';
import { supabase } from '../lib/supabaseClient';
import Modal from './Modal';
import DatabaseSetup from './DatabaseSetup';

interface LoginPageProps {
  onBackToLanding: () => void;
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
            // This fallback is intended to handle new users on first login.
            // Let's try to sign up.
            const { error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (signUpError) {
                // If sign up fails, it could be a password validation error,
                // or the user exists and entered the wrong password.
                if (signUpError.message.includes('already registered')) {
                     setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                } else {
                     setError(signUpError.message); // e.g., "Password should be at least 6 characters"
                }
            }
            // Successful signup is handled by onAuthStateChange listener in App.tsx
        } else {
            // For other sign-in errors (e.g., network), display them.
            setError(signInError.message);
        }
    }
    // On successful sign-in, the onAuthStateChange listener handles navigation.
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Left Pane - Image */}
      <div
        className="hidden lg:flex w-1/2 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1625246333195-78d9c38AD449?q=80&w=1974&auto=format&fit=crop')" }}
      >
        <div className="w-full h-full bg-black bg-opacity-40 flex items-center justify-center p-12">
          <div className="text-white text-center">
            <h1 className="text-4xl font-bold leading-tight mb-4">Welcome to the Future of Farming</h1>
            <p className="text-lg text-gray-200">
              Efficient, intelligent, and sustainable agriculture powered by data.
            </p>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-farm-brown-light">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src={'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg=='} alt="Smile farm Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
            <h1 className="text-3xl font-bold text-farm-green-dark">เข้าสู่ระบบหรือลงทะเบียน</h1>
            <p className="text-gray-600 mt-2">กรอกข้อมูลเพื่อเข้าสู่ระบบ หรือสร้างบัญชีใหม่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล (ชื่อผู้ใช้)
              </label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                 </div>
                 <input
                    id="username"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:outline-none"
                    required
                    autoComplete="email"
                    placeholder="e.g., admin@smilefarm.com"
                 />
              </div>
            </div>

            <div>
              <label htmlFor="password"  className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่าน
              </label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockIcon className="h-5 w-5 text-gray-400" />
                 </div>
                 <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:outline-none"
                    required
                    autoComplete="current-password"
                    placeholder="********"
                 />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-farm-green hover:bg-farm-green-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-farm-green disabled:bg-gray-400"
            >
              {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ / ลงทะเบียน'}
            </button>
          </form>
          
           <div className="mt-6 text-center border-t pt-6">
                <p className="text-sm text-gray-500 mb-2">
                  หากเป็นการใช้งานครั้งแรก หรือต้องการตั้งค่าฐานข้อมูลใหม่:
                </p>
                <button
                    type="button"
                    onClick={() => setIsSetupModalOpen(true)}
                    className="text-sm font-medium text-farm-green hover:text-farm-green-dark underline"
                >
                    คลิกที่นี่เพื่อดูขั้นตอนการตั้งค่าฐานข้อมูล
                </button>
            </div>

          <div className="mt-8 text-center">
            <button onClick={onBackToLanding} className="text-sm text-gray-500 hover:text-farm-green-dark">
              &larr; กลับสู่หน้าหลัก
            </button>
          </div>
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