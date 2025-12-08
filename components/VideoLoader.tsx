import React from 'react';

const VideoLoader: React.FC = () => {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm rounded-2xl z-10">
            <div className="flex flex-col items-center gap-4">
                {/* Animated circles */}
                <div className="relative w-20 h-20">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-vireo-teal/30"></div>

                    {/* Spinning ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-vireo-teal border-r-vireo-pink animate-spin"></div>

                    {/* Inner pulsing circle */}
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-vireo-teal to-vireo-pink animate-pulse"></div>

                    {/* Center dot */}
                    <div className="absolute inset-6 rounded-full bg-white"></div>
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <p className="text-white font-bold text-lg mb-1">Loading your video...</p>
                    <p className="text-gray-400 text-sm">This won't take long ✨</p>
                </div>
            </div>
        </div>
    );
};

export default VideoLoader;
