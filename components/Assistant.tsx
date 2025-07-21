
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { ChatMessage } from '../types';
import SparklesIcon from './icons/SparklesIcon';

// Mock AI for environments where API key is not available
const useMockAI = !process.env.API_KEY;

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useMockAI) return;
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "คุณคือผู้เชี่ยวชาญด้านการเกษตรและผู้ช่วยฟาร์มอัจฉริยะสำหรับ 'Smile Farm' ให้คำแนะนำที่ชัดเจน รัดกุม และนำไปใช้ได้จริงเกี่ยวกับการจัดการพืชผล การควบคุมสภาพแวดล้อม และการตรวจจับศัตรูพืช ใช้โทนเสียงที่เป็นมิตรและให้กำลังใจ ตอบเป็นภาษาไทย",
            },
        });
        setChat(newChat);
    } catch(e) {
        console.error("Failed to initialize Gemini AI:", e);
        setMessages([{ role: 'model', text: 'เกิดข้อผิดพลาดในการเริ่มต้นผู้ช่วย AI โปรดตรวจสอบการตั้งค่า API key'}]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (useMockAI) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: `นี่คือคำตอบจำลองสำหรับคำถาม: "${input}". ในเวอร์ชันจริง ส่วนนี้จะเชื่อมต่อกับ Gemini API` }]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    if (!chat) {
      setIsLoading(false);
      setMessages(prev => [...prev, {role: 'model', text: 'Chat session is not initialized.'}]);
      return;
    }
    
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const result = await chat.sendMessageStream({ message: input });

      for await (const chunk of result) {
        const chunkText = chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += chunkText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      setMessages(prev => [...prev, {role: 'model', text: 'ขออภัย, เกิดข้อผิดพลาดในการสื่อสารกับผู้ช่วย AI'}]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, chat]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <SparklesIcon className="w-10 h-10 text-farm-green" />
        <h1 className="text-4xl font-bold text-farm-green-dark">ผู้ช่วยอัจฉริยะ</h1>
      </div>
      
      <div className="flex-grow bg-farm-brown-light p-6 rounded-xl overflow-y-auto mb-6 shadow-inner">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-farm-green flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>}
              <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-farm-text rounded-bl-none'}`}>
                 <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
               {msg.role === 'user' && <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">คุณ</div>}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-farm-green flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
              <div className="max-w-xl p-4 rounded-2xl bg-white text-farm-text rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="ถามคำถามเกี่ยวกับการทำฟาร์ม..."
          className="flex-grow p-4 border-2 border-farm-green-light rounded-xl focus:outline-none focus:ring-2 focus:ring-farm-green"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="bg-farm-green hover:bg-farm-green-dark text-white font-bold py-2 px-6 rounded-xl disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'กำลังส่ง...' : 'ส่ง'}
        </button>
      </div>
    </div>
  );
};

export default Assistant;
