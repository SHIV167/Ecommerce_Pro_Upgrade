import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

const ProgressBar = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          setTimeout(() => setIsLoading(false), 200);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [location]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div 
        className="h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
