import React from 'react';

const BannerLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-64 bg-[#f8f4ea]">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-[spin_3s_linear_infinite]" />
        
        {/* Middle ring */}
        <div className="absolute inset-2 border-4 border-amber-400 rounded-full animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Inner ring */}
        <div className="absolute inset-4 border-4 border-amber-600 rounded-full animate-[spin_1.5s_linear_infinite]" />
        
        {/* Center dot */}
        <div className="absolute inset-[22px] bg-amber-500 rounded-full animate-pulse" />
      </div>
      
      {/* Loading text */}
      <div className="absolute mt-32 text-amber-600 font-medium animate-pulse">
        Loading your experience...
      </div>
    </div>
  );
};

export default BannerLoader;
