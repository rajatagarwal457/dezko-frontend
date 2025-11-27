import React, { useState, useEffect } from 'react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Moon, Sun, LayoutDashboard } from 'lucide-react';
import { AppState, UploadedClip, VideoRender } from './types';
import LandingView from './components/LandingView';
import ProcessingView from './components/ProcessingView';
import ResultView from './components/ResultView';
import DashboardView from './components/DashboardView';
import VireoBird from './components/VireoBird';
import { api } from './services/api';
import { videoStore } from './services/videoStore';

const App: React.FC = () => {
  const { isSignedIn, isLoaded, user } = useUser();
  const [currentState, setCurrentState] = useState<AppState>(AppState.LANDING);
  const [uploadedClips, setUploadedClips] = useState<UploadedClip[]>([]);
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentRender, setCurrentRender] = useState<VideoRender | null>(null);

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
    if (!isSignedIn || !user) {
      alert("Please sign in to upload videos.");
      return;
    }
    setUploadedClips(clips);

    // Create render entry immediately with a temporary filename
    // const renderId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempRender: VideoRender = {
      id: renderId,
      filename: `pending_${renderId}.mp4`, // Temporary filename
      status: 'generating',
      createdAt: Date.now(),
      clipNames: clips.map(c => c.name),
      userId: user.id
    };
    videoStore.saveVideoRender(tempRender);

    // Redirect to Dashboard immediately
    setCurrentState(AppState.DASHBOARD);

    // Upload and generate in background
    (async () => {
      try {
        // 1. Upload Videos
        const files = clips.map(c => c.file);
        await api.uploadVideos(files);

        // 2. Generate Video (backend returns immediately with filename)
        const result = await api.generateVideo();
        // const renderId = result.filename;
        const tempRender: VideoRender = {
          id: result.filename,
          filename: `${result.filename}.mp4`, // Temporary filename
          status: 'generating',
          createdAt: Date.now(),
          clipNames: clips.map(c => c.name),
          userId: user.id
        };
        videoStore.saveVideoRender(tempRender);
        // 3. Update render with actual filename

      } catch (error) {
        console.error("Error processing video:", error);
        // videoStore.updateVideoStatus(renderId, 'failed');
      }
    })();
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
    setCurrentRender(null);
    setCurrentState(AppState.LANDING);
  };

  const handleViewVideo = (render: VideoRender) => {
    setCurrentRender(render);
    setOutputVideoUrl(api.getVideoUrl(render.filename));
    setCurrentState(AppState.RESULT);
  };

  const handleGoToDashboard = () => {
    setCurrentState(AppState.DASHBOARD);
  };

  const handleCreateNew = () => {
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
          <SignedIn>
            <button
              onClick={handleGoToDashboard}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go to Dashboard"
              title="Dashboard"
            >
              <LayoutDashboard className="w-6 h-6 text-vireo-dark dark:text-white" />
            </button>
          </SignedIn>
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
            isProcessing={isProcessing}
          />
        )}

        {currentState === AppState.PROCESSING && (
          <ProcessingView onComplete={handleProcessingComplete} />
        )}

        {currentState === AppState.DASHBOARD && (
          <DashboardView
            onCreateNew={handleCreateNew}
            onViewVideo={handleViewVideo}
          />
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
