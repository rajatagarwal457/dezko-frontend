import React from 'react';

interface VireoBirdProps {
  isCooking?: boolean;
  className?: string;
}

const VireoBird: React.FC<VireoBirdProps> = ({ isCooking = false, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src="/vireo-animated-logo.svg"
        alt="Vireo Bird"
        className={`w-full h-full object-contain ${isCooking ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

export default VireoBird;
