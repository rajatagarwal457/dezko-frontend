import React, { useState, useEffect } from 'react';
import { UploadedClip } from '../types';
import Button from './Button';
import { Share2, Download } from 'lucide-react';
import { generateCreativeTitle } from '../services/geminiService';
import VideoLoader from './VideoLoader';

interface ResultViewProps {
  clips: UploadedClip[];
  videoUrl: string | null;
  onReset: () => void;
  onViewGallery: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ clips, videoUrl, onReset, onViewGallery }) => {
  const [videoTitle, setVideoTitle] = useState("Your Vireo Story");
  const [cachedVideoBlob, setCachedVideoBlob] = useState<Blob | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Determine the source to play. Use the generated video URL if available, otherwise fallback to first clip
  const previewSource = videoUrl || (clips.length > 0 ? clips[0].previewUrl : '');

  useEffect(() => {
    // Generate a creative title using Gemini (or fallback)
    const fetchTitle = async () => {
      const names = clips.map(c => c.name);
      const title = await generateCreativeTitle(names);
      setVideoTitle(title);
    };
    fetchTitle();
  }, [clips]);

  // Reset loading state when video URL changes
  useEffect(() => {
    if (videoUrl) {
      setIsVideoLoading(true);
    }
  }, [videoUrl]);

  // Cache the video blob when component mounts (for sharing)
  useEffect(() => {
    if (videoUrl && !cachedVideoBlob) {
      fetch(videoUrl)
        .then(res => res.blob())
        .then(blob => setCachedVideoBlob(blob))
        .catch(err => console.error('Failed to cache video:', err));
    }
  }, [videoUrl, cachedVideoBlob]);

  const handleShare = async () => {
    if (!navigator.canShare) {
      alert("Sharing not supported on this device");
      return;
    }

    try {
      let blob: Blob;

      // Use cached blob if available, otherwise fetch
      if (cachedVideoBlob) {
        blob = cachedVideoBlob;
      } else {
        const response = await fetch(videoUrl);
        blob = await response.blob();
      }

      // Create a File object
      const file = new File([blob], 'vireo_video.mp4', { type: 'video/mp4' });

      // Check if file sharing is supported
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Vireo Story',
          text: 'Check out this video I made with Vireo! #MainCharacterEnergy',
        });
      } else {
        alert("File sharing not supported");
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const handleDownloadClick = () => {
    // Create a download link
    const link = document.createElement('a');
    link.href = previewSource;
    link.download = `Vireo_Edit_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-vireo-dark mb-2 dark:text-white">
          Main character unlocked. ✨
        </h2>
        <p className="text-gray-500 dark:text-gray-400">Your story is ready to fly.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-4 border-vireo-teal dark:border-vireo-teal/50 p-2 md:p-4 mb-8 max-w-md mx-auto">
        <div className="relative aspect-[9/16] bg-black rounded-2xl overflow-hidden group">
          {/* Custom Video Loader */}
          {isVideoLoading && <VideoLoader />}

          <video
            src={previewSource}
            className="w-full h-full object-contain"
            controls
            autoPlay
            loop
            playsInline
            onCanPlayThrough={() => setIsVideoLoading(false)}
            onLoadedData={() => setIsVideoLoading(false)}
          />
          {/* Overlay Title */}

        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
        <Button onClick={handleShare} variant="secondary" size="lg" className="w-full md:w-auto">
          <Share2 className="w-5 h-5" />
          Post on Instagram
        </Button>
        <Button onClick={handleDownloadClick} variant="primary" size="lg" className="w-full md:w-auto">
          <Download className="w-5 h-5" />
          Download Video
        </Button>
      </div>

      <div className="mt-8 text-center">
        <button onClick={onReset} className="text-gray-400 hover:text-vireo-teal underline text-sm">
          Make another one
        </button>
        <div className="mt-3">
          <button
            onClick={onViewGallery}
            className="text-gray-400 hover:text-vireo-teal underline text-sm"
          >
            View gallery
          </button>
        </div>
      </div>


    </div>
  );
};

export default ResultView;