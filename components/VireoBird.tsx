import React from 'react';
import vireoLogo from '@/vireo-animated-logo.svg';

interface VireoBirdProps {
  isCooking?: boolean;
  className?: string;
}

const VireoBird: React.FC<VireoBirdProps> = ({ isCooking = false, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src={vireoLogo}
        alt="Vireo Bird"
        className={`w-full h-full object-contain ${isCooking ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

export default VireoBird;
