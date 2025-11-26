import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Moon, Sun } from 'lucide-react';
import { AppState, UploadedClip } from './types';
import LandingView from './components/LandingView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import VireoBird from './components/VireoBird';
import { api } from './services/api';

const App: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [currentState, setCurrentState] = useState<AppState>(AppState.LANDING);
  const [uploadedClips, setUploadedClips] = useState<UploadedClip[]>([]);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleStartProcessing = async (clips: UploadedClip[]) => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      alert("Please sign in to upload videos.");
      return;
    }
    setUploadedClips(clips);
    setCurrentState(AppState.PROCESSING);
    setIsProcessing(true);

    try {
      // 1. Upload Videos
      const files = clips.map(c => c.file);
      await api.uploadVideos(files);

      // 2. Generate Video
      const result = await api.generateVideo();
      const videoUrl = api.getVideoUrl(result.filename);
      setOutputVideoUrl(videoUrl);

      // 3. Move to Result View
      // Note: We could wait for ProcessingView animation here if we wanted to enforce a minimum time
      setCurrentState(AppState.RESULT);
      const _ = api.clearUploads();
    } catch (error) {
      console.error("Error processing video:", error);
      alert("Failed to generate video. Please try again.");
      setCurrentState(AppState.LANDING);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessingComplete = () => {
    // This is called by ProcessingView's timer. 
    // We ignore it now because we control transition based on API success.
    // Or we could use it to ensure minimum animation time.
    // For now, let's just let the API control the flow.
  };

  const handleReset = () => {
    // Cleanup URLs
    uploadedClips.forEach(clip => URL.revokeObjectURL(clip.previewUrl));
    setUploadedClips([]);
    setOutputVideoUrl(null);
    setCurrentState(AppState.LANDING);
  };

  return (
    <div className="min-h-screen bg-vireo-offwhite font-sans text-vireo-dark overflow-x-hidden relative dark:bg-gray-900 dark:text-white transition-colors duration-300">

      {/* Navbar / Logo Area */}
      <header className="w-full p-6 flex items-center justify-between max-w-7xl mx-auto z-50 relative">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <VireoBird className="w-20 h-20 transform group-hover:rotate-12 transition-transform duration-300" />
          <span className="text-2xl font-black tracking-tight text-vireo-dark group-hover:text-vireo-teal transition-colors dark:text-white">
            Vireo
          </span>
        </div>
        {/* Placeholder for menu or login */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-vireo-dark" />}
          </button>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-vireo-teal text-white rounded-lg font-bold hover:bg-opacity-90 transition-all">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">

        {currentState === AppState.LANDING && (
          <LandingView
            onStartProcessing={handleStartProcessing}
            isSignedIn={isSignedIn}
          />
        )}

        {currentState === AppState.PROCESSING && (
          <ProcessingView onComplete={handleProcessingComplete} />
        )}

        {currentState === AppState.RESULT && (
          <ResultView
            clips={uploadedClips}
            videoUrl={outputVideoUrl}
            onReset={handleReset}
          />
        )}

      </main>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-vireo-teal rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-vireo-purple rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] bg-vireo-pink rounded-full opacity-5 blur-3xl"></div>
      </div>

    </div>
  );
};

export default App;
