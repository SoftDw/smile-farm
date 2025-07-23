import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  messages: string[];
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalTime = 800; // Time per message in ms
    const totalDuration = intervalTime * messages.length;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => {
        if (prevIndex < messages.length - 1) {
          return prevIndex + 1;
        }
        clearInterval(messageInterval);
        return prevIndex;
      });
    }, intervalTime);

    // Animate progress bar smoothly over the total duration
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        // Add a small buffer to the duration to ensure it reaches 100% just after the last message
        const currentProgress = Math.min((elapsedTime / (totalDuration + 500)) * 100, 100);
        setProgress(currentProgress);
        if (currentProgress >= 100) {
            clearInterval(progressInterval);
        }
    }, 50); // Update progress frequently for smoothness

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [messages.length]);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center animated-gradient text-white">
      <div className="relative flex items-center justify-center w-48 h-48">
        {/* Pulsing rings */}
        <div className="absolute w-full h-full rounded-full bg-white/10 animate-pulse-ring-1"></div>
        <div className="absolute w-full h-full rounded-full bg-white/10 animate-pulse-ring-2"></div>
        
        {/* Logo */}
        <img 
          src={'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E3ZDdjNTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1YzhkODk7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNncmFkMSkiIGQ9Ik0gMTAwLDEwIEMgNDAsMzAgMjAsMTAwIDEwMCwxOTAgQyAxODAsMTAwIDE2MCwzMCAxMDAsMTAgWiIgLz48cGF0aCBkPSJNIDYwLDExNSBRIDEsMTQwIDE0MCwxMTUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjwvc3ZnPg=='}
          alt="Smile Farm Logo" 
          className="w-24 h-24 object-contain z-10" 
        />
      </div>

      <div className="text-center mt-8 px-4">
        <h2 className="text-2xl font-semibold text-shadow transition-opacity duration-500 h-8">
            {messages[currentMessageIndex]}
        </h2>
      </div>
      
      <div className="absolute bottom-10 w-full max-w-md px-4">
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div 
            className="bg-white h-2.5 rounded-full transition-all duration-500 ease-linear" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;