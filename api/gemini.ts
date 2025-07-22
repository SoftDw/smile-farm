
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from '../types';

// Vercel Edge Function configuration
export const config = {
  runtime: 'edge',
};

// The handler for the API route
export default async function handler(req: Request) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  // Ensure the API key is set
  if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: { message: 'API key is not configured on the server.' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { history, message } = (await req.json()) as { history: ChatMessage[], message: string };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Vercel functions are stateless, so we re-create the chat session with history each time.
    // Map the simple ChatMessage to the format expected by the SDK.
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "คุณคือผู้เชี่ยวชาญด้านการเกษตรและผู้ช่วยฟาร์มอัจฉริยะสำหรับ 'Smile Farm' ให้คำแนะนำที่ชัดเจน รัดกุม และนำไปใช้ได้จริงเกี่ยวกับการจัดการพืชผล การควบคุมสภาพแวดล้อม และการตรวจจับศัตรูพืช ใช้โทนเสียงที่เป็นมิตรและให้กำลังใจ ตอบเป็นภาษาไทย",
        },
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
    });

    const stream = await chat.sendMessageStream({ message: message });

    // Create a new ReadableStream to pipe the Gemini response through.
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                controller.enqueue(encoder.encode(chunkText));
            }
        }
        controller.close();
      }
    });
    
    // Return the stream as the response
    return new Response(readableStream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        }
    });

  } catch (error: any) {
    console.error('Error in Gemini API proxy:', error);
    return new Response(JSON.stringify({ error: { message: 'An internal error occurred while communicating with the AI service.', details: error.message } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
