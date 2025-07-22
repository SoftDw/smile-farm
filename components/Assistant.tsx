
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import SparklesIcon from './icons/SparklesIcon';

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    // Prepare history for the stateless API
    // The history is the list of messages before the new user message was added.
    const historyForApi = messages.map(msg => ({
        role: msg.role,
        text: msg.text
    }));

    // Add a placeholder for the model's response
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyForApi,
          message: messageToSend
        })
      });
      
      if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.statusText} - ${errorText}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += chunkText;
          return newMessages;
        });
      }

    } catch (error) {
      console.error('API proxy error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        // Replace the empty model message with an error
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'model' && lastMessage.text === '') {
            lastMessage.text = 'ขออภัย, เกิดข้อผิดพลาดในการสื่อสารกับผู้ช่วย AI';
        } else {
            newMessages.push({ role: 'model', text: 'ขออภัย, เกิดข้อผิดพลาดในการสื่อสารกับผู้ช่วย AI' });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

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
          {isLoading && messages[messages.length - 1]?.role !== 'model' && (
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
