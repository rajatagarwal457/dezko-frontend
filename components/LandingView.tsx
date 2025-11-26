import React, { useRef, useState } from 'react';
import { SignInButton } from "@clerk/clerk-react";
import { UploadedClip } from '../types';
import { MAX_CLIPS, MAX_FILE_SIZE_MB } from '../constants';
import Button from './Button';
import { UploadCloud, Film, X, Plus } from 'lucide-react';

interface LandingViewProps {
  onStartProcessing: (clips: UploadedClip[]) => void;
  isSignedIn?: boolean | undefined;
}

const LandingView: React.FC<LandingViewProps> = ({ onStartProcessing, isSignedIn }) => {
  const [clips, setClips] = useState<UploadedClip[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!isSignedIn) return;
    if (!fileList) return;

    const newClips: UploadedClip[] = [];
    const files = Array.from(fileList);

    for (const file of files) {
      if (clips.length + newClips.length >= MAX_CLIPS) {
        alert(`Maximum ${MAX_CLIPS} clips allowed!`);
        break;
      }

      if (!file.type.startsWith('video/')) {
        continue;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(`File ${file.name} is too large (Max ${MAX_FILE_SIZE_MB}MB)`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newClips.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl,
        name: file.name
      });
    }

    setClips(prev => [...prev, ...newClips]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isSignedIn) return;
    handleFiles(e.dataTransfer.files);
  };

  const removeClip = (id: string) => {
    setClips(prev => {
      const newClips = prev.filter(c => c.id !== id);
      // Revoke URL to avoid memory leaks
      const removed = prev.find(c => c.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return newClips;
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 animate-fade-in flex flex-col items-center">

      {/* Hero Section */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-vireo-dark mb-4 tracking-tight leading-tight dark:text-white">
          Main character energy, <span className="text-vireo-teal inline-block transform hover:rotate-2 transition-transform cursor-default">instantly.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium">
          Vireo turns forgotten clips into stories worth sharing.
        </p>
      </div>

      {/* Upload Box */}
      <div
        className={`
          w-full bg-white rounded-3xl border-4 border-dashed transition-all duration-300 relative group
          min-h-[300px] flex flex-col items-center justify-center p-8
          ${isDragging ? 'border-vireo-pink bg-vireo-pink/5 scale-105' : 'border-gray-200 hover:border-vireo-teal hover:bg-vireo-teal/5'}
          dark:bg-gray-800 dark:border-gray-700 dark:hover:border-vireo-teal dark:hover:bg-vireo-teal/10
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => {
          if (isSignedIn) {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="video/mp4,video/quicktime,video/x-m4v"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {clips.length === 0 ? (
          <div className="text-center pointer-events-none">
            <div className="w-20 h-20 bg-vireo-yellow rounded-full flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <UploadCloud className="w-10 h-10 text-vireo-orange" />
            </div>
            {isSignedIn ? (
              <>
                <h3 className="text-2xl font-bold text-vireo-dark mb-2 dark:text-white">Drop your clips here 📸</h3>
                <p className="text-gray-400 dark:text-gray-300">or click to browse files</p>
              </>
            ) : (
              <div className="pointer-events-auto">
                <h3 className="text-2xl font-bold text-vireo-dark mb-2 dark:text-white">Sign in to upload clips 🔒</h3>
                <SignInButton mode="modal">
                  <button
                    className="mt-2 px-6 py-2 bg-vireo-teal text-white rounded-lg font-bold hover:bg-opacity-90 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Sign In
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full pointer-events-auto cursor-default" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {clips.map((clip) => (
                <div key={clip.id} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group/item shadow-sm">
                  <video src={clip.previewUrl} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeClip(clip.id)}
                    className="absolute top-2 right-2 bg-white/90 p-1 rounded-full text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <p className="text-xs text-white truncate">{clip.name}</p>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              {clips.length < MAX_CLIPS && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-vireo-teal hover:text-vireo-teal hover:bg-white transition-colors"
                >
                  <Plus className="w-8 h-8 mb-1" />
                  <span className="text-xs font-bold">Add More</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className={`mt-8 transition-all duration-500 transform ${clips.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <Button
          size="lg"
          variant="primary"
          className="text-xl px-12 py-5 shadow-vireo-pink/40 shadow-xl"
          onClick={() => onStartProcessing(clips)}
        >
          Make me the main character ✨
        </Button>
      </div>

    </div>
  );
};

export default LandingView;
