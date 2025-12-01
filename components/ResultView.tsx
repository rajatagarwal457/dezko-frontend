import React, { useState, useEffect } from 'react';
import { UploadedClip } from '../types';
import Button from './Button';
import { AD_DURATION_SEC } from '../constants';
import { Share2, Download, Check, Play, X } from 'lucide-react';
import { generateCreativeTitle } from '../services/geminiService';

interface ResultViewProps {
  clips: UploadedClip[];
  videoUrl: string | null;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ clips, videoUrl, onReset }) => {
  const [showAd, setShowAd] = useState(false);
  const [adTimer, setAdTimer] = useState(AD_DURATION_SEC);
  const [videoTitle, setVideoTitle] = useState("Your Vireo Story");
  const [cachedVideoBlob, setCachedVideoBlob] = useState<Blob | null>(null);

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
    setShowAd(true);
    setAdTimer(AD_DURATION_SEC);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showAd && adTimer > 0) {
      interval = setInterval(() => {
        setAdTimer((prev) => prev - 1);
      }, 1000);
    } else if (showAd && adTimer === 0) {
      // Timer finished
    }
    return () => clearInterval(interval);
  }, [showAd, adTimer]);

  const completeDownload = () => {
    // Create a download link
    const link = document.createElement('a');
    link.href = previewSource;
    link.download = `Vireo_Edit_${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowAd(false);
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
          <video
            src={previewSource}
            className="w-full h-full object-contain"
            controls
            autoPlay
            loop
            playsInline
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
      </div>

      {/* Ad Modal */}
      {showAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full relative overflow-hidden dark:bg-gray-800">

            <div className="absolute top-0 left-0 w-full h-2 bg-gray-200">
              <div
                className="h-full bg-vireo-pink transition-all duration-1000 ease-linear"
                style={{ width: `${(adTimer / AD_DURATION_SEC) * 100}%` }}
              />
            </div>

            <div className="text-center py-8">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-4">Advertisement</p>
              <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 dark:bg-gray-700 dark:border-gray-600">
                <span className="text-gray-400 dark:text-gray-500">Awesome Brand Ad Here</span>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Wait for your download...</h3>
              <p className="text-gray-500 mb-6 dark:text-gray-400">Preparing your high-quality file.</p>

              {adTimer > 0 ? (
                <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
                  Skip in {adTimer}s
                </Button>
              ) : (
                <Button onClick={completeDownload} variant="primary" className="w-full animate-bounce">
                  Download Now <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultView;