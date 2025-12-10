'use client'

import React, { useRef, useState } from 'react';
import { SignInButton } from "@clerk/nextjs";
import { UploadedClip } from '../types';
import { MAX_CLIPS, MAX_FILE_SIZE_MB } from '../constants';
import Button from './Button';
import { UploadCloud, Film, X, Plus, Sparkles } from 'lucide-react';
import { api } from '../services/api';

interface LandingViewProps {
  onStartProcessing: (sessionIdOrPromise: string | Promise<{ session_id: string; files: string[] }>, fileNames: string[], clipNames: string[], vibe?: string) => void;
  isSignedIn?: boolean | undefined;
  isProcessing?: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  canGenerate?: boolean;
  onShowPaymentModal?: () => void;
}

type Vibe = {
  id: string;
  label: string;
  emoji: string;
};

const VIBES: Vibe[] = [
  { id: 'party', label: 'Party', emoji: '🎉' },
  { id: 'nostalgia', label: 'Nostalgia', emoji: '📼' },
  { id: 'cute', label: 'Cute', emoji: '💖' },
  { id: 'hardcore', label: 'Hardcore', emoji: '⚡' },
  { id: 'lovey-dovey', label: 'Lovey Dovey', emoji: '🥰' },
  { id: '2025-throwback', label: '2025 Throwback', emoji: '🔁' },
];

const LandingView: React.FC<LandingViewProps> = ({ onStartProcessing, isSignedIn, isProcessing = false, userId, userName, userEmail, canGenerate = true, onShowPaymentModal }) => {
  const [clips, setClips] = useState<UploadedClip[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ session_id: string; files: string[] } | null>(null);

  // Refs to track upload state for the background polling
  const uploadResultRef = useRef<{ session_id: string; files: string[] } | null>(null);
  const isUploadingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
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

      // Read file data immediately to prevent mobile upload errors
      // This ensures the file data is captured in memory before any delays
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const newFile = new File([blob], file.name, {
        type: file.type,
        lastModified: file.lastModified
      });

      const previewUrl = URL.createObjectURL(newFile);
      newClips.push({
        id: Math.random().toString(36).substr(2, 9),
        file: newFile,
        previewUrl,
        name: file.name
      });
    }

    setClips(prev => [...prev, ...newClips]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isSignedIn || showVibePicker) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isSignedIn || showVibePicker) return;
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

  const handleUploadClick = async () => {
    if (!userId || !userName) {
      alert('User information not available. Please sign in.');
      return;
    }

    // Show vibe picker immediately
    setShowVibePicker(true);
    setIsUploading(true);
    isUploadingRef.current = true;

    // Start upload in background
    try {
      const files = clips.map(c => c.file);
      const result = await api.uploadVideos(files, userName, userId);
      setUploadResult(result);
      uploadResultRef.current = result;
      setIsUploading(false);
      isUploadingRef.current = false;
    } catch (error) {
      console.error('Upload failed:', error);
      var _ = await api.logError(error);
      setIsUploading(false);
      isUploadingRef.current = false;
      uploadResultRef.current = null;
      alert('Upload failed. Please try again.');
      setShowVibePicker(false);
    }
  };

  const handleVibeSelect = (vibeId: string) => {
    setSelectedVibe(vibeId);
  };

  const handleMakeMainCharacter = () => {
    if (!selectedVibe) return;

    // Check if user can generate (has free tries left or is premium)
    if (!canGenerate) {
      onShowPaymentModal?.();
      return;
    }

    const clipNames = clips.map(c => c.name);

    // Create a promise that resolves when upload is complete
    const uploadPromise = new Promise<{ session_id: string; files: string[] }>((resolve) => {
      const checkUpload = () => {
        if (uploadResultRef.current && !isUploadingRef.current) {
          resolve(uploadResultRef.current);
        } else {
          setTimeout(checkUpload, 100);
        }
      };
      checkUpload();
    });

    // Call onStartProcessing immediately with the promise
    // This will transition to processing view right away
    // The generate API call will wait for upload to finish
    onStartProcessing(uploadPromise, [], clipNames, selectedVibe);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 animate-fade-in flex flex-col items-center">

      {/* Hero Section */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-vireo-dark mb-4 tracking-tight leading-tight dark:text-white">
          Main character energy, <span className="text-vireo-teal inline-block transform hover:rotate-2 transition-transform cursor-default">instantly.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium">
          Vireo turns forgotten clips into stories worth sharing.
        </p>
      </div>

      {/* Upload Box / Vibe Picker Container */}
      <div className={`w-full relative transition-all duration-500 ${showVibePicker ? 'min-h-[520px] md:min-h-[400px]' : 'min-h-[300px]'}`}>

        {/* Upload View */}
        <div
          className={`
            w-full bg-white rounded-3xl border-4 border-dashed transition-all duration-500 group absolute inset-0
            h-[300px] flex flex-col items-center justify-center p-8
            ${showVibePicker ? 'opacity-0 scale-95 pointer-events-none z-0' : 'opacity-100 scale-100 z-10'}
            ${isDragging ? 'border-vireo-pink bg-vireo-pink/5 scale-105' : 'border-gray-200 hover:border-vireo-teal hover:bg-vireo-teal/5'}
            dark:bg-gray-800 dark:border-gray-700 dark:hover:border-vireo-teal dark:hover:bg-vireo-teal/10
          `}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => {
            if (isSignedIn && !showVibePicker) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            // accept="video/mp4,video/quicktime,video/x-m4v"
            accept="video/*"
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
            <div className="w-full h-full overflow-y-auto pointer-events-auto cursor-default px-2" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full pb-4">
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

        {/* Vibe Picker View */}
        <div
          className={`
            w-full bg-white rounded-3xl border-4 border-vireo-teal transition-all duration-500 absolute inset-0
            h-[520px] md:h-[400px] flex flex-col items-center justify-center p-4 md:p-8
            ${showVibePicker ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none z-0'}
            dark:bg-gray-800 dark:border-vireo-teal
          `}
        >
          <div className="w-full">
            <h3 className="text-xl md:text-2xl font-bold text-vireo-dark mb-1 md:mb-2 text-center dark:text-white">
              Choose your vibe ✨
            </h3>
            <p className="text-sm md:text-base text-gray-500 text-center mb-4 md:mb-6">
              Select the energy for your video
            </p>

            {/* Vibe Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.id}
                  onClick={() => handleVibeSelect(vibe.id)}
                  className={`
                    p-4 md:p-6 rounded-2xl border-3 transition-all duration-300 flex flex-col items-center justify-center gap-1 md:gap-2
                    ${selectedVibe === vibe.id
                      ? 'border-vireo-pink bg-vireo-pink/10 scale-105 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-vireo-teal hover:bg-vireo-teal/5 hover:scale-105 shadow-md hover:shadow-lg'
                    }
                    dark:border-gray-700 dark:bg-gray-800 dark:hover:border-vireo-teal
                  `}
                >
                  <span className="text-3xl md:text-4xl">{vibe.emoji}</span>
                  <span className={`text-xs md:text-sm font-bold ${selectedVibe === vibe.id ? 'text-vireo-pink' : 'text-gray-700 dark:text-gray-300'}`}>
                    {vibe.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="mt-8 transition-all duration-500">
        {!showVibePicker ? (
          // Upload Button
          <div className={`transition-all duration-500 transform ${clips.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <Button
              size="lg"
              variant="primary"
              className="text-xl px-12 py-5 shadow-vireo-pink/40 shadow-xl"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload ⬆️'}
            </Button>
          </div>
        ) : (
          // Make Me Main Character Button (after vibe selection)
          <div className={`transition-all duration-500 transform ${selectedVibe ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
            <Button
              size="lg"
              variant="primary"
              className="text-xl px-12 py-5 shadow-vireo-pink/40 shadow-xl"
              onClick={handleMakeMainCharacter}
              disabled={!selectedVibe}
            >
              Make me the main character ✨
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default LandingView;
